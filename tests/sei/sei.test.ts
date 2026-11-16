import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataIso, decodificarEntidades, lerPaginaProcesso, linhasDaTabela, semDadoPessoal, tabelaPorId, TAMANHO_MAXIMO_PAGINA, textoDe } from '../../src/lib/sei/leitor.ts';
import { marcoDoDocumento, marcosDoProcesso, ondeEsta, paralisacaoAberta, resumirProcesso, sugerirEtapa } from '../../src/lib/sei/analise.ts';
import { mascararLinkSei, validarLinkSei } from '../../src/lib/sei/link.ts';
import { ANDAMENTOS_EXEMPLO, DOCUMENTOS_EXEMPLO, paginaExemplo } from '../../src/lib/sei/exemplo.ts';
import type { ProcessoSei } from '../../src/lib/sei/tipos.ts';

const LINK = 'https://sei.goiania.go.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?AbCdEfGhIjKlMnOpQrSt_uv-WX0123456789';

test('leitor: cabeçalho, contagens e totais da página fictícia', () => {
  const p = lerPaginaProcesso(paginaExemplo())!;
  assert.equal(p.numero, '99.9.000000123-4');
  assert.equal(p.tipo, 'Licitação');
  assert.equal(p.geradoEm, '2026-07-01');
  assert.equal(p.documentos.length, DOCUMENTOS_EXEMPLO.length);
  assert.equal(p.andamentos.length, ANDAMENTOS_EXEMPLO.length);
  assert.equal(p.totalDocumentos, DOCUMENTOS_EXEMPLO.length);
  assert.equal(p.totalAndamentos, ANDAMENTOS_EXEMPLO.length);
  assert.equal(resumirProcesso(p).incompleto, false);
});

test('leitor: interessados nunca entram (podem ter nome de pessoa)', () => {
  const p = lerPaginaProcesso(paginaExemplo())!;
  assert.doesNotMatch(JSON.stringify(p), /Pessoa Fictícia/);
});

test('leitor: documento público × restrito (célula restrita sem </td>)', () => {
  const p = lerPaginaProcesso(paginaExemplo())!;
  const tr = p.documentos.find((d) => d.tipo === 'Termo de Referência')!;
  assert.equal(tr.publico, false);
  assert.equal(tr.numero, '90000004');
  assert.equal(tr.data, '2026-07-20');
  assert.equal(tr.unidade, 'SEC-EXEMPLO/GERPLAN');
  assert.equal(p.documentos[0].publico, true);
  assert.equal(p.documentos.filter((d) => d.publico).length, DOCUMENTOS_EXEMPLO.filter((d) => d.publico).length);
});

test('leitor: andamentos do mais recente para o mais antigo, com hora e sem e-mail', () => {
  const p = lerPaginaProcesso(paginaExemplo())!;
  assert.equal(p.andamentos[0].dataHora, '2026-11-05T10:12');
  assert.equal(p.andamentos.at(-1)!.dataHora, '2026-07-01T08:15');
  for (let i = 1; i < p.andamentos.length; i++) assert.ok(p.andamentos[i - 1].dataHora >= p.andamentos[i].dataHora);
  assert.doesNotMatch(JSON.stringify(p.andamentos), /@exemplo/);
  assert.ok(p.andamentos.some((a) => a.descricao.includes('[e-mail]')));
});

test('leitor: andamentos fora de ordem na página saem do mais recente para o mais antigo', () => {
  const html = paginaExemplo();
  const ini = html.indexOf('<tr class="andamentoAberto">');
  const fim = html.lastIndexOf('</tr>') + 5;
  const linhas = html.slice(ini, fim).split('\n');
  const p = lerPaginaProcesso(html.slice(0, ini) + linhas.reverse().join('\n') + html.slice(fim))!;
  assert.equal(p.andamentos[0].dataHora, '2026-11-05T10:12');
  assert.equal(p.andamentos.at(-1)!.dataHora, '2026-07-01T08:15');
});

test('leitor: página sem as tabelas (captcha ou link vencido) = null; grande demais = null', () => {
  assert.equal(lerPaginaProcesso(paginaExemplo({ semTabelas: true })), null);
  assert.equal(lerPaginaProcesso(''), null);
  assert.equal(lerPaginaProcesso('x'.repeat(TAMANHO_MAXIMO_PAGINA + 1)), null);
  assert.equal(lerPaginaProcesso(undefined as unknown as string), null);
});

test('leitor: entidades, datas e células', () => {
  assert.equal(decodificarEntidades('a&nbsp;b &amp; &#233;&#xE7;&#13;x'), 'a b & éç x');
  assert.equal(decodificarEntidades('&#99999999;'), '&#99999999;');
  assert.equal(dataIso('24/07/2026'), '2026-07-24');
  assert.equal(dataIso('31/02/2026'), null);
  assert.equal(dataIso('12/11/2026 12:00', true), '2026-11-12T12:00');
  assert.equal(dataIso('12/11/2026 25:00', true), null);
  assert.deepEqual(linhasDaTabela('<table><tr><th>x</th></tr><tr><td>a<td>b</td></tr></table>'), [['a', 'b']]);
  assert.equal(semDadoPessoal('cpf 123.456.789-09 e fulano@x.com.br'), 'cpf [CPF] e [e-mail]');
  assert.equal(semDadoPessoal('Processo atribuído para Fulano de Tal'), 'Processo atribuído para [pessoa]');
  assert.equal(semDadoPessoal('Assinado documento 12 por Fulano de Tal (fulano.tal)'), 'Assinado documento 12 por [pessoa]');
  assert.equal(semDadoPessoal('Processo remetido pela unidade SECAP/GER'), 'Processo remetido pela unidade SECAP/GER');
  assert.equal(decodificarEntidades('Parecer Jur&iacute;dico &Aacute;rea &ccedil;&atilde;o n&ordm;'), 'Parecer Jurídico Área ção nº');
  assert.equal(textoDe('a\u001b[31mb'), 'a [31mb');
  assert.equal(tabelaPorId('<table data-id="tblX"><tr><td>a</td></tr></table>', 'tblX'), null);
  assert.equal(marcoDoDocumento(textoDe('Parecer Jur&iacute;dico 9'))?.id, 'juridico');
});

test('marcos: começo do tipo, fronteira de palavra e exceções', () => {
  assert.equal(marcoDoDocumento('Edital')?.id, 'edital');
  assert.equal(marcoDoDocumento('Parecer Jurídico 4665')?.id, 'juridico');
  assert.equal(marcoDoDocumento('Minuta de Contrato 8')?.id, 'minuta');
  assert.equal(marcoDoDocumento('Contrato 12')?.id, 'contrato-doc');
  assert.equal(marcoDoDocumento('Termo de Contrato 3')?.id, 'contrato');
  assert.equal(marcoDoDocumento('Aviso de Recebimento'), null);
  assert.equal(marcoDoDocumento('Publicação de Portaria'), null);
  assert.equal(marcoDoDocumento('Ordem de Serviço de Reinício')?.id, 'reinicio');
  assert.equal(marcoDoDocumento('Ordem de Serviço de Paralisação')?.id, 'paralisacao');
  assert.equal(marcoDoDocumento('Ordem de Serviço de Início')?.id, 'os');
  assert.equal(marcoDoDocumento('Edital')?.confianca, 'media');
  assert.equal(marcoDoDocumento('Contrato Social'), null);
  assert.equal(marcoDoDocumento('Contratação direta'), null);
  assert.equal(marcoDoDocumento('Anexo Documento de Formalização de Demanda'), null);
  assert.equal(marcoDoDocumento('Ordem de Serviço - AGMGO 15')?.id, 'os-doc');
  assert.equal(marcoDoDocumento('Aviso de Licitação')?.id, 'aviso');
  assert.equal(marcoDoDocumento('Termo de Homologação')?.id, 'homologacao');
  assert.equal(marcoDoDocumento('Despacho 41'), null);
});

test('marcos do exemplo: na ordem do ciclo, primeiro documento mais antigo', () => {
  const p = lerPaginaProcesso(paginaExemplo())!;
  const ids = marcosDoProcesso(p).map((m) => m.marco.id);
  assert.deepEqual(ids, ['dfd', 'etp', 'tr', 'risco', 'precos', 'minuta', 'juridico', 'edital', 'aviso', 'julgamento']);
  assert.ok(!ids.includes('contrato') && !ids.includes('contrato-doc'));
});

test('sugestão de etapa: só propõe avançar; atrás e igual não mudam nada', () => {
  const p = lerPaginaProcesso(paginaExemplo())!;
  const s = sugerirEtapa(p, '02');
  assert.equal(s.tipo, 'avancar');
  if (s.tipo === 'avancar') {
    assert.equal(s.etapa, '03');
    assert.equal(s.conferir, false); // edital/ata de julgamento têm confiança alta
  }
  assert.equal(sugerirEtapa(p, '03').tipo, 'igual');
  assert.equal(sugerirEtapa(p, '05').tipo, 'atras');
  assert.equal(sugerirEtapa(p, null).tipo, 'avancar');
  const vazio: ProcessoSei = { ...p, documentos: [{ numero: '1', tipo: 'Despacho', data: null, unidade: 'X', publico: true }] };
  assert.equal(sugerirEtapa(vazio, '02').tipo, 'sem_marco');
});

test('sugestão: marco de confiança média pede conferência', () => {
  const p: ProcessoSei = { numero: null, tipo: null, geradoEm: null, totalDocumentos: null, totalAndamentos: null, andamentos: [],
    documentos: [{ numero: '1', tipo: 'Edital', data: '2026-01-01', unidade: 'X', publico: true }] };
  const s = sugerirEtapa(p, '02');
  assert.equal(s.tipo, 'avancar');
  if (s.tipo === 'avancar') assert.equal(s.conferir, true);
});

test('paralisação aberta só sem reinício depois', () => {
  const base: ProcessoSei = { numero: null, tipo: null, geradoEm: null, totalDocumentos: null, totalAndamentos: null, andamentos: [], documentos: [] };
  const doc = (tipo: string, data: string) => ({ numero: '1', tipo, data, unidade: 'X', publico: false });
  assert.equal(paralisacaoAberta({ ...base, documentos: [doc('Termo de Paralisação de Obras', '2026-01-10')] })?.data, '2026-01-10');
  assert.equal(paralisacaoAberta({ ...base, documentos: [doc('Termo de Paralisação de Obras', '2026-01-10'), doc('Termo de Reinício', '2026-02-01')] }), null);
  assert.equal(paralisacaoAberta({ ...base, documentos: [doc('Termo de Reinício', '2025-12-01'), doc('Termo de Paralisação de Obras', '2026-01-10')] })?.data, '2026-01-10');
  assert.equal(paralisacaoAberta({ ...base, documentos: [doc('Termo de Paralisação de Obras', '2026-01-10'), doc('Ordem de Serviço de Reinício', '2026-03-01')] }), null);
  assert.equal(paralisacaoAberta(base), null);
});

test('onde está: unidade do último andamento e dias desde que chegou nela', () => {
  const p = lerPaginaProcesso(paginaExemplo())!;
  const o = ondeEsta(p, '2026-11-16')!;
  assert.equal(o.unidade, 'SEC-EXEMPLO/CPL');
  assert.equal(o.desde, '2026-09-30'); // 3 andamentos seguidos na CPL
  assert.equal(o.dias, 47);
  assert.equal(ondeEsta(p, '2026-01-01')!.dias, null);
  assert.equal(ondeEsta({ ...p, andamentos: [] }, '2026-11-16'), null);
});

test('link: só a página pública do processo, em https, do SEI conhecido', () => {
  const ok = validarLinkSei(`  ${LINK}  `);
  assert.deepEqual(ok, { ok: true, url: LINK });
  assert.equal(validarLinkSei(LINK.replace('https:', 'http:')).ok, false);
  assert.equal(validarLinkSei(LINK.replace('sei.goiania', 'sei.goiania.go.gov.br.evil')).ok, false);
  assert.equal(validarLinkSei('https://evil.com/sei/modulos/pesquisa/md_pesq_processo_exibir.php?AbCdEfGhIjKlMnOpQrSt').ok, false);
  assert.equal(validarLinkSei(LINK.replace('processo_exibir', 'processo_pesquisar')).ok, false);
  assert.equal(validarLinkSei(LINK.replace('exibir', 'outro')).ok, false);
  assert.equal(validarLinkSei(`${LINK}#x`).ok, false);
  assert.equal(validarLinkSei(`${LINK}&a=<script>`).ok, false);
  assert.equal(validarLinkSei(LINK.replace('https://', 'https://user:pw@')).ok, false);
  assert.equal(validarLinkSei(LINK.replace('.gov.br/', '.gov.br:8443/')).ok, false);
  assert.equal(validarLinkSei('javascript:alert(1)').ok, false);
  assert.equal(validarLinkSei('').ok, false);
  assert.equal(validarLinkSei(`${LINK}${'a'.repeat(700)}`).ok, false);
  assert.deepEqual(validarLinkSei(LINK.replace('sei.goiania.go.gov.br', 'SEI.GOIANIA.GO.GOV.BR')), { ok: true, url: LINK });
  assert.equal(mascararLinkSei(LINK), 'sei.goiania.go.gov.br · processo AbCdEf…');
  assert.equal(mascararLinkSei('lixo'), 'link inválido');
});
