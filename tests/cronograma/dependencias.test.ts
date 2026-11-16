process.env.GOVNEXA_EXEMPLO = '1'; // usa os dados fictícios de data/exemplo, não a carga real
// Testes das dependências entre etapas e do atraso em cascata. Data fixa: nada depende do relógio.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Cronograma, EtapaCronograma } from '../../src/lib/cronograma/tipos.ts';
import { analisarDependencias, cascataDoProjeto, etapasTravadasPor, predecessoras, travadasPorUnidade } from '../../src/lib/cronograma/dependencias.ts';
import { carregarCronogramas } from '../../src/lib/cronograma/carga.ts';
import { itensParados } from '../../src/lib/cronograma/visoes.ts';

const HOJE = '2026-06-10';

function etapa(nome: string, fase: string, ordem: number, o: Partial<EtapaCronograma> = {}): EtapaCronograma {
  return {
    ordem, nome, fase, unidade: null, responsavel: null, situacao_planilha: null, duracao_prevista: null,
    inicio_previsto: null, fim_previsto: null, inicio_real: null, fim_real: null, status: 'a_fazer', ciclo: null,
    pendencias: [], origem: { aba: 'T', linha: ordem }, ...o,
  };
}
function cron(fases: [string, EtapaCronograma[]][]): Cronograma {
  return {
    id: 'C-T', aba: 'T', titulo: 'T', endereco: null, sei: [], projeto_id: null, casamento: null, pendencias: [],
    fases: fases.map(([nome, etapas], i) => ({ nome, ordem: i + 1, etapas })),
  };
}

// Sequência simples: a → b → c, cada uma começa quando a anterior termina.
const seq = cron([
  ['F1', [
    etapa('a', 'F1', 1, { inicio_previsto: '2026-05-01', fim_previsto: '2026-05-11', inicio_real: '2026-05-01', fim_real: '2026-05-16' }), // 5 dias atrasada
    etapa('b', 'F1', 2, { inicio_previsto: '2026-05-11', fim_previsto: '2026-05-21' }),
  ]],
  ['F2', [etapa('c', 'F2', 1, { inicio_previsto: '2026-05-21', fim_previsto: '2026-06-30' })]],
]);

test('sequência: cada etapa depende da anterior na ordem do cronograma, inclusive entre fases', () => {
  assert.deepEqual(predecessoras(seq), [[], [0], [1]]);
});

test('ordem: a fase e a posição mandam, não a ordem em que chegaram no arquivo', () => {
  const c = cron([['F1', [etapa('segunda', 'F1', 2, { inicio_previsto: '2026-05-11', fim_previsto: '2026-05-21' }), etapa('primeira', 'F1', 1, { inicio_previsto: '2026-05-01', fim_previsto: '2026-05-11' })]]]);
  const d = analisarDependencias(c, HOJE);
  assert.equal(d[0].etapa.nome, 'primeira');
  assert.deepEqual(d[1].predecessoras, [0]);
});

test('paralelas: mesma fase e início antes do fim das outras não dependem entre si; a seguinte depende de todas', () => {
  const c = cron([
    ['F1', [
      etapa('base', 'F1', 1, { inicio_previsto: '2026-04-01', fim_previsto: '2026-04-10' }),
      etapa('p1', 'F1', 2, { inicio_previsto: '2026-04-10', fim_previsto: '2026-04-30' }),
      etapa('p2', 'F1', 3, { inicio_previsto: '2026-04-10', fim_previsto: '2026-04-20' }),
      etapa('depois', 'F1', 4, { inicio_previsto: '2026-04-30', fim_previsto: '2026-05-10' }),
    ]],
    // Começa antes do fim de 'depois', mas é de outra fase: continua sequencial.
    ['F2', [etapa('outraFase', 'F2', 1, { inicio_previsto: '2026-05-05', fim_previsto: '2026-05-20' })]],
  ]);
  assert.deepEqual(predecessoras(c), [[], [0], [0], [1, 2], [3]]);
});

test('sem datas: vale a ordem da planilha (sequencial)', () => {
  const c = cron([['F1', [etapa('x', 'F1', 1), etapa('y', 'F1', 2), etapa('z', 'F1', 3, { inicio_previsto: '2026-01-01' })]]]);
  assert.deepEqual(predecessoras(c), [[], [0], [1]]);
});

test('aguardando: etapa não iniciada cuja anterior não terminou; travada quando o início previsto já passou', () => {
  const c = cron([['F1', [
    etapa('feita', 'F1', 1, { inicio_previsto: '2026-05-01', fim_previsto: '2026-05-05', inicio_real: '2026-05-01', fim_real: '2026-05-05' }),
    etapa('emCurso', 'F1', 2, { inicio_previsto: '2026-05-05', fim_previsto: '2026-06-01', inicio_real: '2026-05-06' }),
    etapa('esperaVencida', 'F1', 3, { inicio_previsto: '2026-06-01', fim_previsto: '2026-06-20' }),
    etapa('esperaFutura', 'F1', 4, { inicio_previsto: '2026-06-20', fim_previsto: '2026-07-01' }),
  ]]]);
  const d = analisarDependencias(c, HOJE);
  assert.deepEqual(d[0].aguardando, []); // primeira etapa
  assert.deepEqual(d[1].aguardando, []); // anterior terminou (e esta já começou)
  assert.deepEqual(d[2].aguardando, [1]);
  assert.equal(d[2].travada, true);
  assert.deepEqual(d[3].aguardando, [2]);
  assert.equal(d[3].travada, false);
  // Já começou: não está aguardando, mesmo com a anterior aberta.
  const c2 = cron([['F1', [etapa('aberta', 'F1', 1, { inicio_real: '2026-05-01' }), etapa('adiantada', 'F1', 2, { inicio_real: '2026-05-02' })]]]);
  assert.deepEqual(analisarDependencias(c2, HOJE)[1].aguardando, []);
  // Quantas etapas seguintes ainda não começaram e dependem de cada uma.
  assert.deepEqual(etapasTravadasPor(c), [0, 2, 1, 0]);
});

test('cascata: o atraso da anterior empurra o fim projetado das seguintes', () => {
  const d = analisarDependencias(seq, '2026-05-01');
  assert.equal(d[0].atrasoAcumulado, 5);
  assert.equal(d[1].atrasoHerdado, 5);
  assert.equal(d[1].fimProjetado, '2026-05-26');
  assert.equal(d[2].fimProjetado, '2026-07-05');
  assert.equal(d[2].atrasoAcumulado, 5);
  const p = cascataDoProjeto(seq, '2026-05-01');
  assert.equal(p.fimPrevisto, '2026-06-30');
  assert.equal(p.fimProjetado, '2026-07-05');
  assert.equal(p.diasDeAtraso, 5);
  assert.deepEqual(p.gargalo, { indice: 0, nome: 'a', dias: 5 });
  assert.deepEqual(p.caminho, [0, 1, 2]);
});

test('cascata: etapa só com fim previsto (sem início) também é empurrada pelo atraso herdado', () => {
  const c = cron([['F1', [
    etapa('a', 'F1', 1, { inicio_previsto: '2026-05-01', fim_previsto: '2026-05-11', inicio_real: '2026-05-01', fim_real: '2026-05-16' }),
    etapa('soFim', 'F1', 2, { fim_previsto: '2026-07-01' }),
  ]]]);
  assert.equal(analisarDependencias(c, HOJE)[1].fimProjetado, '2026-07-06');
});

test('cascata: etapa em curso com prazo vencido não termina antes de hoje; a que não começou não começa antes de hoje', () => {
  const c = cron([['F1', [
    etapa('lenta', 'F1', 1, { inicio_previsto: '2026-05-01', fim_previsto: '2026-05-31', inicio_real: '2026-05-01' }),
    etapa('depois', 'F1', 2, { inicio_previsto: '2026-05-31', fim_previsto: '2026-06-10' }),
  ]]]);
  const d = analisarDependencias(c, HOJE);
  assert.equal(d[0].fimProjetado, HOJE); // 10 dias de atraso até hoje
  assert.equal(d[0].atrasoAcumulado, 10);
  assert.equal(d[1].fimProjetado, '2026-06-20'); // começa hoje + 10 dias de duração
  const p = cascataDoProjeto(c, HOJE);
  assert.equal(p.diasDeAtraso, 10);
  assert.equal(p.gargalo?.nome, 'lenta');
});

test('cascata: só o caminho que define o fim conta; a paralela folgada não segura o projeto', () => {
  const c = cron([['F1', [
    etapa('rapida', 'F1', 1, { inicio_previsto: '2026-05-01', fim_previsto: '2026-05-10', inicio_real: '2026-05-01', fim_real: '2026-05-12' }), // 2 dias
    etapa('demorada', 'F1', 2, { inicio_previsto: '2026-05-01', fim_previsto: '2026-05-10', inicio_real: '2026-05-01', fim_real: '2026-05-20' }), // 10 dias
    etapa('fim', 'F1', 3, { inicio_previsto: '2026-06-15', fim_previsto: '2026-07-10' }),
  ]]]);
  const d = analisarDependencias(c, HOJE);
  assert.equal(d[2].atrasoHerdado, 10); // o maior atraso entre as predecessoras
  const p = cascataDoProjeto(c, HOJE, d);
  assert.deepEqual(p.caminho, [1, 2]);
  assert.equal(p.gargalo?.nome, 'demorada');
});

test('nunca antecipar: terminar antes do previsto não puxa as seguintes para trás', () => {
  const c = cron([['F1', [
    etapa('adiantada', 'F1', 1, { inicio_previsto: '2026-05-01', fim_previsto: '2026-05-20', inicio_real: '2026-05-01', fim_real: '2026-05-10' }),
    etapa('seguinte', 'F1', 2, { inicio_previsto: '2026-06-15', fim_previsto: '2026-07-01' }),
  ]]]);
  const d = analisarDependencias(c, HOJE);
  assert.equal(d[0].atrasoAcumulado, 0);
  assert.equal(d[1].atrasoHerdado, 0);
  assert.equal(d[1].fimProjetado, '2026-07-01');
  const p = cascataDoProjeto(c, HOJE, d);
  assert.equal(p.diasDeAtraso, 0);
  assert.equal(p.gargalo, null);
});

test('ausência de datas: sem fim previsto o fim projetado é null; a cascata segue com o atraso conhecido', () => {
  const c = cron([['F1', [
    etapa('atrasou', 'F1', 1, { inicio_previsto: '2026-05-01', fim_previsto: '2026-05-10', inicio_real: '2026-05-01', fim_real: '2026-05-17' }), // 7 dias
    etapa('semData', 'F1', 2),
    etapa('final', 'F1', 3, { inicio_previsto: '2026-07-01', fim_previsto: '2026-07-10' }),
  ]]]);
  const d = analisarDependencias(c, HOJE);
  assert.equal(d[1].fimProjetado, null);
  assert.equal(d[1].atrasoAcumulado, null);
  assert.equal(d[1].atrasoProprio, null);
  assert.equal(d[2].atrasoHerdado, 7);
  assert.equal(d[2].fimProjetado, '2026-07-17');
  // Cronograma sem nenhuma data: tudo null, nada de zero inventado.
  const vazio = cascataDoProjeto(cron([['F1', [etapa('x', 'F1', 1), etapa('y', 'F1', 2)]]]), HOJE);
  assert.deepEqual(vazio, { fimPrevisto: null, fimProjetado: null, diasDeAtraso: null, gargalo: null, caminho: [] });
});

test('onde está parado: etapas seguintes travadas por unidade, sem contar duas vezes', () => {
  const c = cron([['F1', [
    etapa('a', 'F1', 1, { unidade: 'PGM', inicio_previsto: '2026-05-01', fim_previsto: '2026-05-10', inicio_real: '2026-05-01' }),
    etapa('b', 'F1', 2, { unidade: 'PGM', inicio_previsto: '2026-05-10', fim_previsto: '2026-05-20' }),
    etapa('c', 'F1', 3, { unidade: 'AMMA', inicio_previsto: '2026-06-20', fim_previsto: '2026-07-01' }),
  ]]]);
  const parados = itensParados([c], HOJE); // a (prazo vencido) e b (início vencido)
  assert.equal(parados.length, 2);
  const mapa = travadasPorUnidade([c], parados);
  assert.equal(mapa.get('PGM'), 2); // b e c, sem repetir c
  assert.equal(mapa.get('AMMA'), undefined);
});

test('dados de exemplo: a cascata aponta um gargalo e nunca projeta antes do previsto', () => {
  for (const c of carregarCronogramas().cronogramas) {
    const d = analisarDependencias(c, '2026-11-16');
    for (const x of d) if (x.fimProjetado && x.etapa.fim_previsto && !x.etapa.fim_real) assert.ok(x.fimProjetado >= x.etapa.fim_previsto, x.etapa.nome);
    const p = cascataDoProjeto(c, '2026-11-16', d);
    assert.ok((p.diasDeAtraso ?? 0) > 0, c.id);
    assert.ok(p.gargalo, c.id);
  }
});
