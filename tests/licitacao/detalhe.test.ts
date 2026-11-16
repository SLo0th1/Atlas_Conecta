import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerPaginaProcesso } from '../../src/lib/sei/leitor.ts';
import { paginaExemplo } from '../../src/lib/sei/exemplo.ts';
import { htmlDoArquivo, quotedPrintable, TAMANHO_MAXIMO_ARQUIVO } from '../../src/lib/sei/arquivo.ts';
import { digitosProcesso, montarLicitacao } from '../../src/lib/licitacao/detalhe.ts';
import { copiaLimpa, processoValido } from '../../src/lib/licitacao/simulacao.ts';
import type { ProcessoSei } from '../../src/lib/sei/tipos.ts';

const GOIANIA = 5208707;
const exemplo = (): ProcessoSei => lerPaginaProcesso(paginaExemplo())!;
const fase = (d: ReturnType<typeof montarLicitacao>, id: string) => d.fases.find((f) => f.def.id === id)!;
const doc = (tipo: string, data: string) => ({ numero: '1', tipo, data, unidade: 'X', publico: true });
const vazio: ProcessoSei = { numero: '1', tipo: null, geradoEm: null, totalDocumentos: null, totalAndamentos: null, documentos: [], andamentos: [] };

test('fases do exemplo: datas reais, fase atual e dias entre etapas', () => {
  const d = montarLicitacao(exemplo(), '2026-11-16', GOIANIA);
  assert.equal(fase(d, 'demanda').data, '2026-07-01');
  assert.equal(fase(d, 'etp').diasDesdeAnterior, 14);
  assert.equal(fase(d, 'risco').diasDesdeAnterior, null); // feita em paralelo (data anterior à pesquisa de preços)
  assert.equal(fase(d, 'minuta').diasDesdeAnterior, 8); // conta a partir da data mais recente (28/07)
  assert.equal(fase(d, 'publicacao').data, '2026-08-25');
  assert.equal(fase(d, 'publicacao').documento, 'Aviso de Licitação'); // aviso tem preferência sobre o edital
  assert.equal(fase(d, 'julgamento').situacao, 'feita');
  assert.equal(d.faseAtual?.def.id, 'homologacao');
  assert.equal(fase(d, 'contrato').situacao, 'pendente'); // "Contrato Social" não conta
  assert.equal(fase(d, 'tr').publico, false);
  assert.deepEqual(d.duracao, { interna: 55, externa: null, total: 138, totalAteHoje: true, conferir: false });
});

test('fase sem documento antes da última feita; opcional não vira fase atual', () => {
  const p = { ...vazio, documentos: [doc('Documento de Formalização da Demanda', '2026-01-02'), doc('Edital', '2026-03-01')] };
  const d = montarLicitacao(p, '2026-04-01', GOIANIA);
  assert.equal(fase(d, 'etp').situacao, 'sem_documento');
  assert.equal(fase(d, 'publicacao').situacao, 'feita');
  assert.equal(fase(d, 'publicacao').conferir, true); // só o edital (confiança média)
  assert.equal(d.faseAtual?.def.id, 'julgamento');
  const p2 = { ...vazio, documentos: [doc('Termo de Referência', '2026-01-02'), doc('Mapa de Preços', '2026-01-05')] };
  assert.equal(montarLicitacao(p2, '2026-02-01', GOIANIA).faseAtual?.def.id, 'minuta'); // pula a matriz de risco (opcional)
  const tudo = { ...vazio, documentos: [doc('Ordem de Serviço de Início', '2026-05-01')] };
  assert.equal(montarLicitacao(tudo, '2026-06-01', GOIANIA).faseAtual, null);
});

test('prazo mínimo de publicidade: ok, alerta e sem dado', () => {
  const ok = montarLicitacao(exemplo(), '2026-11-16', GOIANIA).prazos.find((c) => c.id === 'publicidade')!;
  assert.equal(ok.situacao, 'ok');
  const curto = { ...vazio, documentos: [doc('Aviso de Licitação', '2026-03-02'), doc('Ata de Julgamento', '2026-03-06')] };
  const a = montarLicitacao(curto, '2026-04-01', GOIANIA).prazos.find((c) => c.id === 'publicidade')!;
  assert.equal(a.situacao, 'alerta');
  // obras especiais (25 dias úteis): o exemplo (25/08 → 30/09) também cumpre
  const esp = montarLicitacao(exemplo(), '2026-11-16', GOIANIA, 'publicidade_servicos_especiais_obras_especiais').prazos[0];
  assert.match(esp.rotulo, /25 dias úteis/);
  const integ = montarLicitacao(exemplo(), '2026-11-16', GOIANIA, 'publicidade_integrada').prazos[0];
  assert.equal(integ.situacao, 'alerta'); // 60 dias úteis não cabem entre 25/08 e 30/09
  assert.equal(montarLicitacao(vazio, '2026-04-01', GOIANIA).prazos[0].situacao, 'sem_dado');
  assert.equal(montarLicitacao(exemplo(), '2026-11-16', GOIANIA, 'id-inexistente').prazos[0].rotulo, ok.rotulo); // id estranho cai no padrão
});

test('duração com contrato: interna, externa e total até o contrato', () => {
  const p = { ...vazio, documentos: [doc('Documento de Formalização da Demanda', '2026-01-01'), doc('Aviso de Licitação', '2026-02-01'), doc('Termo de Contrato', '2026-04-01')] };
  const d = montarLicitacao(p, '2026-12-31', GOIANIA);
  assert.deepEqual(d.duracao, { interna: 31, externa: 59, total: 90, totalAteHoje: false, conferir: false });
});

test('arquivo: Latin-1 original, UTF-8 regravado, MHTML e recusas', () => {
  const html = paginaExemplo();
  const latin = Uint8Array.from(html, (c) => c.charCodeAt(0) & 0xff); // ISO-8859-1, como o SEI envia
  const r1 = htmlDoArquivo(latin);
  assert.ok(r1.ok && lerPaginaProcesso(r1.html)?.tipo === 'Licitação');
  const utf8 = new TextEncoder().encode(html.replace('charset=iso-8859-1', 'charset=utf-8'));
  const r2 = htmlDoArquivo(utf8);
  assert.ok(r2.ok && lerPaginaProcesso(r2.html)?.documentos[2].tipo === 'Estudo Técnico Preliminar - ETP');
  const qp = [...latin].map((b) => (b > 126 || b === 61 ? '=' + b.toString(16).toUpperCase().padStart(2, '0') : String.fromCharCode(b))).join('');
  const mhtml = `From: <Saved by Blink>\r\nMIME-Version: 1.0\r\nContent-Type: multipart/related;\r\n\ttype="text/html";\r\n\tboundary="----X"\r\n\r\n------X\r\nContent-Type: text/html\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n${qp.replace(/(.{70})/g, '$1=\r\n')}\r\n------X--\r\n`;
  const r3 = htmlDoArquivo(Uint8Array.from(mhtml, (c) => c.charCodeAt(0)));
  assert.ok(r3.ok, JSON.stringify(r3));
  if (r3.ok) assert.equal(lerPaginaProcesso(r3.html)?.tipo, 'Licitação');
  assert.equal(htmlDoArquivo(new Uint8Array()).ok, false);
  assert.equal(htmlDoArquivo(new TextEncoder().encode('%PDF-1.7 ...')).ok, false);
  assert.equal(htmlDoArquivo(new TextEncoder().encode('apenas texto')).ok, false);
  assert.equal(htmlDoArquivo(new Uint8Array(TAMANHO_MAXIMO_ARQUIVO + 1)).ok, false);
  assert.deepEqual([...quotedPrintable('a=3Db=\r\nc=E9')], [97, 61, 98, 99, 0xe9]);
});

test('simulação: só aceita processo com a forma certa e copia só os campos conhecidos', () => {
  const p = exemplo();
  assert.ok(processoValido(p));
  assert.ok(!processoValido({ ...p, documentos: [{ ...p.documentos[0], numero: '<img>' }] }));
  assert.ok(!processoValido({ ...p, andamentos: [{ dataHora: 'ontem', unidade: 'X', descricao: 'y' }] }));
  assert.ok(!processoValido({ ...p, totalDocumentos: -1 }));
  assert.ok(!processoValido([]));
  assert.ok(!processoValido(null));
  const sujo = { ...p, extra: 'x', documentos: [{ ...p.documentos[0], extra: 1 }] } as unknown as ProcessoSei;
  const limpo = copiaLimpa(sujo);
  assert.ok(!('extra' in limpo) && !('extra' in limpo.documentos[0]));
  assert.equal(digitosProcesso('26.9.000000446-9'), '2690000004469');
  assert.equal(digitosProcesso(null), '');
});

test('duração: ordem invertida não vira número negativo; contrato genérico pede conferência', () => {
  const inv = { ...vazio, documentos: [doc('Aviso de Licitação', '2026-01-10'), doc('Documento de Formalização da Demanda', '2026-02-01')] };
  const d = montarLicitacao(inv, '2026-01-15', GOIANIA);
  assert.equal(d.duracao.interna, null);
  assert.equal(d.duracao.total, null); // hoje antes da demanda
  const gen = { ...vazio, documentos: [doc('Documento de Formalização da Demanda', '2026-01-01'), doc('Contrato 7', '2026-03-01')] };
  assert.equal(montarLicitacao(gen, '2026-04-01', GOIANIA).duracao.conferir, true);
});

test('arquivo: MHTML em base64, base64 inválido e sem fronteira', () => {
  const html = paginaExemplo();
  const b64 = Buffer.from(html, 'latin1').toString('base64').replace(/(.{76})/g, '$1\r\n');
  const cab = (corpo: string, enc: string) =>
    `MIME-Version: 1.0\r\nContent-Type: multipart/related; type="text/html"; boundary="B"\r\n\r\n--B\r\nContent-Type: text/html; charset="iso-8859-1"\r\nContent-Transfer-Encoding: ${enc}\r\n\r\n${corpo}\r\n--B--\r\n`;
  const ok = htmlDoArquivo(new TextEncoder().encode(cab(b64, 'base64')));
  assert.ok(ok.ok && lerPaginaProcesso(ok.html)?.documentos.length === 13);
  assert.equal(htmlDoArquivo(new TextEncoder().encode(cab('@@@ nao e base64 @@@', 'base64'))).ok, false);
  assert.equal(htmlDoArquivo(new TextEncoder().encode('MIME-Version: 1.0\r\nContent-Type: multipart/related; type="text/html"\r\n\r\n<html></html>')).ok, false);
});

test('simulação: data impossível e número de processo estranho são recusados; descrição não é guardada', () => {
  const p = exemplo();
  assert.ok(!processoValido({ ...p, documentos: [{ ...p.documentos[0], data: '2026-02-31' }] }));
  assert.ok(!processoValido({ ...p, geradoEm: '2026-13-01' }));
  assert.ok(!processoValido({ ...p, andamentos: [{ ...p.andamentos[0], dataHora: '2026-11-05T25:00' }] }));
  assert.ok(!processoValido({ ...p, numero: '<img src=x onerror=alert(1)>' }));
  assert.ok(processoValido({ ...p, numero: null }));
  assert.ok(copiaLimpa(p).andamentos.every((a) => a.descricao === ''));
});
