// Testes do motor de parecer determinístico (docs/projetos-ia.md, seção 6). Execução: node --test tests/projetos/parecer.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contextoExemploComFalhas, contextoExemploRegular, HOJE_EXEMPLO, projetoExemploCompleto, projetoExemploComFalhas } from '../../src/lib/projetos/exemplo.ts';
import { gerarParecer, hashConteudo, MARCADOR_AUSENTE, REGRAS } from '../../src/lib/projetos/parecer.ts';
import type { ContextoParecer, Projeto } from '../../src/lib/projetos/tipos.ts';

const HOJE = HOJE_EXEMPLO;
const projeto = (): Projeto => structuredClone(projetoExemploCompleto());
const contexto = (): ContextoParecer => structuredClone(contextoExemploRegular);
const rodar = (p: Projeto, c: ContextoParecer) => gerarParecer(p, c, HOJE);
const regra = (p: Projeto, c: ContextoParecer, id: string) => {
  const r = rodar(p, c).resultados.find((x) => x.id === id);
  assert.ok(r, `regra ${id} existe`);
  return r;
};
/** Edita o projeto sem a aprovação (para testar regras sem acionar R21). */
const semAprovacao = (): Projeto => {
  const p = projeto();
  delete p.aprovacao;
  return p;
};

test('21 regras, ids R01..R21, cada resultado traz título, mensagem e como corrigir', () => {
  assert.equal(REGRAS.length, 21);
  const par = rodar(projeto(), contexto());
  assert.deepEqual(par.resultados.map((r) => r.id), Array.from({ length: 21 }, (_, i) => `R${String(i + 1).padStart(2, '0')}`));
  for (const r of par.resultados) {
    assert.ok(r.titulo && r.mensagem && r.comoCorrigir, r.id);
    assert.ok(['ok', 'falha', 'sem_dado'].includes(r.resultado));
    assert.ok(['bloqueante', 'alerta', 'informativo'].includes(r.gravidade));
  }
});

test('exemplo completo e aprovado: tudo ok, completo e pronto para envio; pureza (mesma entrada, mesma saída)', () => {
  const par = rodar(projeto(), contexto());
  assert.deepEqual(par.resultados.filter((r) => r.resultado !== 'ok').map((r) => r.id), []);
  assert.equal(par.percentual, 100);
  assert.equal(par.completo, true);
  assert.equal(par.prontoParaEnvio, true);
  assert.deepEqual(rodar(projeto(), contexto()), par);
});

test('exemplo com falhas: bloqueia, não é completo nem pronto', () => {
  const par = rodar(projetoExemploComFalhas(), contextoExemploComFalhas);
  assert.equal(par.completo, false);
  assert.equal(par.prontoParaEnvio, false);
  assert.ok(par.bloqueantesPendentes.length >= 8);
  assert.ok(par.faltaParaEnvio.length >= 2);
});

test('R01 CAUC geral', () => {
  const c = contexto();
  assert.equal(regra(projeto(), c, 'R01').resultado, 'ok');
  c.cauc!.situacaoGeral = 'com_pendencias';
  const r = regra(projeto(), c, 'R01');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'bloqueante');
});

test('R02 CAUC por item: pendente = bloqueante, indisponível = alerta, validade vencida = falha', () => {
  const c = contexto();
  assert.equal(regra(projeto(), c, 'R02').resultado, 'ok');
  c.cauc!.itens[1].situacao = 'pendente';
  let r = regra(projeto(), c, 'R02');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'bloqueante');
  assert.match(r.detalhes[0], /item 1\.3/);
  const c2 = contexto();
  c2.cauc!.itens[0].situacao = 'indisponivel';
  r = regra(projeto(), c2, 'R02');
  assert.equal(r.resultado, 'sem_dado');
  assert.equal(r.gravidade, 'alerta');
  const c3 = contexto();
  c3.cauc!.itens[0].validade = '2026-11-01';
  assert.equal(regra(projeto(), c3, 'R02').resultado, 'falha');
});

test('R03 meta sem indicador', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R03').resultado, 'ok');
  p.metas.push({ id: 'm2', descricao: 'Outra meta', prazoMes: 6 });
  const r = regra(p, contexto(), 'R03');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'bloqueante');
  p.metas = [];
  assert.equal(regra(p, contexto(), 'R03').resultado, 'sem_dado');
});

test('R04 indicador incompleto; linha de base ausente na fonte = alerta', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R04').resultado, 'ok');
  p.indicadores[0].valorAlvo = null;
  let r = regra(p, contexto(), 'R04');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'bloqueante');
  const q = semAprovacao();
  q.indicadores[0].linhaBase = MARCADOR_AUSENTE;
  r = regra(q, contexto(), 'R04');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'alerta');
  const s = semAprovacao();
  s.indicadores = [];
  assert.equal(regra(s, contexto(), 'R04').resultado, 'sem_dado');
});

test('R05 prazo: vencido = bloqueante, <=7 dias = alerta, aberto = ok, sem programa = sem_dado', () => {
  const c = contexto();
  assert.equal(regra(projeto(), c, 'R05').resultado, 'ok');
  c.programa!.prazos.proposta_ate = '2026-11-01';
  let r = regra(projeto(), c, 'R05');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'bloqueante');
  c.programa!.prazos.proposta_ate = '2026-11-14';
  r = regra(projeto(), c, 'R05');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'alerta');
  delete c.programa;
  assert.equal(regra(projeto(), c, 'R05').resultado, 'sem_dado');
});

test('R06 proponente elegível', () => {
  const c = contexto();
  assert.equal(regra(projeto(), c, 'R06').resultado, 'ok');
  c.programa!.publico = ['Administração Pública Estadual ou do Distrito Federal'];
  assert.equal(regra(projeto(), c, 'R06').resultado, 'falha');
  const c2 = contexto();
  c2.programa!.ufs = ['MG'];
  assert.equal(regra(projeto(), c2, 'R06').resultado, 'falha');
  const c3 = contexto();
  delete c3.uf;
  assert.equal(regra(projeto(), c3, 'R06').resultado, 'sem_dado');
});

test('R07 programa só de emenda', () => {
  const c = contexto();
  assert.equal(regra(projeto(), c, 'R07').resultado, 'ok');
  c.programa!.prazos = { proposta_ate: null, emendas_ate: '2026-12-01', beneficiario_especifico_ate: null };
  const p = semAprovacao();
  assert.equal(regra(p, c, 'R07').resultado, 'sem_dado');
  p.emendaIndicada = 'nao_sei';
  assert.equal(regra(p, c, 'R07').resultado, 'falha');
  p.emendaIndicada = 'sim';
  assert.equal(regra(p, c, 'R07').resultado, 'ok');
});

test('R08 projeto básico / termo de referência', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R08').resultado, 'ok');
  p.anexos = p.anexos.filter((a) => a.tipo !== 'projeto_basico');
  assert.equal(regra(p, contexto(), 'R08').resultado, 'falha');
  const c = contexto();
  delete c.requisitos;
  assert.equal(regra(p, c, 'R08').resultado, 'falha'); // objeto de obra/serviço sem anexo, mesmo sem requisito
  p.objetoObraOuServico = undefined;
  const r = regra(p, c, 'R08');
  assert.equal(r.resultado, 'sem_dado');
  assert.equal(r.gravidade, 'alerta');
});

test('R09 documentos exigidos', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R09').resultado, 'ok');
  p.anexos = p.anexos.filter((a) => a.tipo !== 'certidao');
  const r = regra(p, contexto(), 'R09');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'bloqueante');
  const c = contexto();
  c.requisitos!.confirmadoPor = undefined; // não confirmado = não vale
  assert.equal(regra(p, c, 'R09').resultado, 'sem_dado');
});

test('R10 faixa de valor do repasse', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R10').resultado, 'ok');
  const c = contexto();
  c.requisitos!.valorMax = 900_000;
  assert.equal(regra(p, c, 'R10').resultado, 'falha');
  const c2 = contexto();
  c2.requisitos!.valorMin = 1_500_000;
  assert.equal(regra(p, c2, 'R10').resultado, 'falha');
  const c3 = contexto();
  delete c3.requisitos;
  const r = regra(p, c3, 'R10');
  assert.equal(r.resultado, 'sem_dado');
  assert.equal(r.gravidade, 'alerta');
});

test('R11 contrapartida mínima', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R11').resultado, 'ok');
  const c = contexto();
  c.requisitos!.contrapartidaMinPct = 5;
  const r = regra(p, c, 'R11');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'bloqueante');
  const c2 = contexto();
  c2.requisitos!.contrapartidaMinPct = undefined;
  assert.equal(regra(p, c2, 'R11').resultado, 'sem_dado');
});

test('R12 capacidade fiscal (SICONFI)', () => {
  const c = contexto();
  assert.equal(regra(projeto(), c, 'R12').resultado, 'ok');
  c.siconfi!.despesaPessoalPctRcl = 49;
  let r = regra(projeto(), c, 'R12');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'alerta');
  assert.match(r.mensagem, /49/);
  c.siconfi!.despesaPessoalPctRcl = 52;
  assert.equal(regra(projeto(), c, 'R12').gravidade, 'alerta');
  c.siconfi!.despesaPessoalPctRcl = 55;
  r = regra(projeto(), c, 'R12');
  assert.equal(r.gravidade, 'bloqueante');
  assert.equal(r.resultado, 'falha');
  delete c.siconfi;
  assert.equal(regra(projeto(), c, 'R12').resultado, 'sem_dado');
});

test('R13 cronograma coerente', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R13').resultado, 'ok');
  p.etapas[1].mesFim = 9; // além do prazo da meta (6)
  assert.equal(regra(p, contexto(), 'R13').resultado, 'falha');
  const q = semAprovacao();
  q.parcelas[0].mes = 5; // fora da etapa e1 (1..3)
  assert.equal(regra(q, contexto(), 'R13').resultado, 'falha');
  const s = semAprovacao();
  s.etapas[0].mesInicio = 4;
  s.etapas[0].mesFim = 2;
  assert.equal(regra(s, contexto(), 'R13').resultado, 'falha');
  const v = semAprovacao();
  v.etapas = [];
  assert.equal(regra(v, contexto(), 'R13').resultado, 'sem_dado');
});

test('R14 soma financeira (tolerância de R$ 0,01)', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R14').resultado, 'ok');
  p.valorGlobal = 1_021_000.01;
  assert.equal(regra(p, contexto(), 'R14').resultado, 'ok');
  p.valorGlobal = 1_021_000.5;
  assert.equal(regra(p, contexto(), 'R14').resultado, 'falha');
  p.parcelas = [];
  assert.equal(regra(p, contexto(), 'R14').resultado, 'sem_dado');
});

test('R15 seções obrigatórias', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R15').resultado, 'ok');
  p.secoes = p.secoes.filter((s) => s.tipo !== 'justificativa');
  const r = regra(p, contexto(), 'R15');
  assert.equal(r.resultado, 'falha');
  assert.match(r.detalhes[0], /Justificativa/);
});

test('R16 texto de IA não revisado', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R16').resultado, 'ok');
  p.secoes[1].blocos.push({ texto: 'texto gerado', origem: 'ia', revisado: false });
  assert.equal(regra(p, contexto(), 'R16').resultado, 'falha');
  p.secoes[1].blocos[1].revisado = true;
  assert.equal(regra(p, contexto(), 'R16').resultado, 'ok');
});

test('R17 números com fonte', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R17').resultado, 'ok');
  p.secoes[1].numeros!.push({ texto: '300' });
  assert.equal(regra(p, contexto(), 'R17').resultado, 'falha');
  const c = contexto();
  c.citacoes![0].valorAtual = 5300; // dado oficial mudou
  assert.equal(regra(semAprovacao(), c, 'R17').resultado, 'falha');
  const c2 = contexto();
  c2.citacoes![0].valorAtual = null;
  assert.equal(regra(semAprovacao(), c2, 'R17').resultado, 'sem_dado');
});

test('R18 frescor: >30 dias alerta, >60 bloqueante, sem data = sem_dado', () => {
  const c = contexto();
  assert.equal(regra(projeto(), c, 'R18').resultado, 'ok');
  c.siconfi!.dataColeta = '2026-09-25T00:00:00Z'; // 45 dias
  let r = regra(projeto(), c, 'R18');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'alerta');
  assert.match(regra(projeto(), c, 'R12').mensagem, /coletados há 45 dias/);
  c.cauc!.dataColeta = '2026-08-01T00:00:00Z'; // 100 dias
  r = regra(projeto(), c, 'R18');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'bloqueante');
  const c2 = contexto();
  c2.programa!.dataColeta = undefined;
  assert.equal(regra(projeto(), c2, 'R18').resultado, 'sem_dado');
  assert.equal(regra(projeto(), {}, 'R18').resultado, 'sem_dado');
});

test('R19 marcador de dado ausente no texto', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R19').resultado, 'ok');
  p.secoes[1].blocos[0].texto += ` Leitos: ${MARCADOR_AUSENTE}.`;
  const r = regra(p, contexto(), 'R19');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'alerta');
});

test('R20 metas coerentes com o objeto (informativo)', () => {
  const p = semAprovacao();
  assert.equal(regra(p, contexto(), 'R20').resultado, 'ok');
  p.metas[0].descricao = 'Construir ciclovia';
  const r = regra(p, contexto(), 'R20');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'informativo');
  p.secoes = p.secoes.filter((s) => s.tipo !== 'objeto');
  assert.equal(regra(p, contexto(), 'R20').resultado, 'sem_dado');
});

test('R21 conteúdo alterado depois da aprovação', () => {
  assert.equal(regra(projeto(), contexto(), 'R21').resultado, 'ok');
  const p = projeto();
  p.titulo += ' (editado)';
  const r = regra(p, contexto(), 'R21');
  assert.equal(r.resultado, 'falha');
  assert.equal(r.gravidade, 'bloqueante');
  const q = projeto();
  delete q.aprovacao!.hashConteudo;
  assert.equal(regra(q, contexto(), 'R21').resultado, 'sem_dado');
  // justificativas e aprovação não mudam o hash
  const h = hashConteudo(projeto());
  const s = projeto();
  s.justificativas = { R12: 'texto' };
  assert.equal(hashConteudo(s), h);
});

test('dado ausente NUNCA conta como ok: contexto vazio gera sem_dado e bloqueia', () => {
  const vazioP = semAprovacao();
  vazioP.objetoObraOuServico = undefined;
  vazioP.anexos = [];
  const par = rodar(vazioP, {});
  const por = (id: string) => par.resultados.find((r) => r.id === id)!;
  for (const id of ['R01', 'R02', 'R05', 'R06', 'R07', 'R08', 'R09', 'R10', 'R11', 'R12', 'R18']) {
    assert.notEqual(por(id).resultado, 'ok', id);
  }
  assert.equal(por('R01').resultado, 'sem_dado');
  assert.equal(par.completo, false);
  assert.ok(par.bloqueantesPendentes.includes('R01'));
});

test('alerta justificado libera "completo"; bloqueante não é liberado por justificativa', () => {
  const c = contexto();
  c.siconfi!.despesaPessoalPctRcl = 49; // alerta R12
  const p = projeto();
  p.justificativas = { R12: 'Ciente: despesa de pessoal acima do limite de alerta; plano de ajuste aprovado.' };
  p.aprovacao!.hashConteudo = hashConteudo(p);
  let par = rodar(p, c);
  assert.deepEqual(par.alertasJustificados, ['R12']);
  assert.equal(par.completo, true);
  assert.equal(par.prontoParaEnvio, true);
  const sem = projeto();
  par = rodar(sem, c);
  assert.deepEqual(par.alertasPendentes, ['R12']);
  assert.equal(par.completo, false);
  const c2 = contexto();
  c2.cauc!.situacaoGeral = 'com_pendencias';
  const q = projeto();
  q.justificativas = { R01: 'tentativa de justificar bloqueante' };
  q.aprovacao!.hashConteudo = hashConteudo(q);
  assert.equal(rodar(q, c2).completo, false);
});

test('bloqueio de envio: completo sem aprovação não está pronto; aprovação incompleta ou desatualizada também não', () => {
  let par = rodar(semAprovacao(), contexto());
  assert.equal(par.completo, true);
  assert.equal(par.prontoParaEnvio, false);
  assert.ok(par.faltaParaEnvio.some((x) => /aprovação/i.test(x)));

  const p = projeto();
  p.aprovacao!.cargo = '';
  par = rodar(p, contexto());
  assert.equal(par.prontoParaEnvio, false);

  const q = projeto();
  q.titulo += ' mudou';
  par = rodar(q, contexto());
  assert.equal(par.completo, false); // R21 falha
  assert.equal(par.prontoParaEnvio, false);

  // aprovado, mas com bloqueante aberto: não pode enviar
  const c = contexto();
  c.cauc!.situacaoGeral = 'com_pendencias';
  par = rodar(projeto(), c);
  assert.equal(par.aprovacaoRegistrada, true);
  assert.equal(par.prontoParaEnvio, false);
});
