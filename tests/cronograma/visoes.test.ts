// Testes das visões dos Cronogramas (status na data, resumo, SPI e "onde está parado"). Data fixa: nada depende do relógio.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Cronograma, EtapaCronograma } from '../../src/lib/cronograma/tipos.ts';
import { farolRitmo, ondeEstaParado, resumoCronograma, statusNaData } from '../../src/lib/cronograma/visoes.ts';

const HOJE = '2026-06-10';

function etapa(nome: string, fase: string, o: Partial<EtapaCronograma>): EtapaCronograma {
  return {
    ordem: 1, nome, fase, unidade: null, responsavel: null, situacao_planilha: null, duracao_prevista: null,
    inicio_previsto: null, fim_previsto: null, inicio_real: null, fim_real: null, status: 'a_fazer', ciclo: null,
    pendencias: [], origem: { aba: 'T', linha: 1 }, ...o,
  };
}
function cron(id: string, fases: [string, EtapaCronograma[]][]): Cronograma {
  return {
    id, aba: id, titulo: `Titulo ${id}`, endereco: null, sei: [], projeto_id: null, casamento: null, pendencias: [],
    fases: fases.map(([nome, etapas], i) => ({ nome, ordem: i + 1, etapas })),
  };
}

const c1 = cron('C-1', [
  ['Fase A', [
    etapa('e1', 'Fase A', { duracao_prevista: 10, inicio_previsto: '2026-05-01', fim_previsto: '2026-05-11', inicio_real: '2026-05-02', fim_real: '2026-05-12' }),
    etapa('e2', 'Fase A', { duracao_prevista: 10, inicio_previsto: '2026-06-01', fim_previsto: '2026-06-21', inicio_real: '2026-06-02' }),
  ]],
  ['Fase B', [
    etapa('e3', 'Fase B', { unidade: 'PGM', responsavel: 'Ana', inicio_previsto: '2026-06-05', fim_previsto: '2026-06-09' }),
    etapa('e4', 'Fase B', { duracao_prevista: 10, inicio_previsto: '2026-06-12', fim_previsto: '2026-06-17' }),
  ]],
]);
const c2 = cron('C-2', [
  ['Fase A', [
    etapa('x', 'Fase A', { unidade: 'PGM', responsavel: 'Ana', inicio_previsto: '2026-05-01', fim_previsto: '2026-05-31', inicio_real: '2026-05-02' }),
    etapa('y', 'Fase A', { inicio_previsto: '2026-05-20', fim_previsto: '2026-06-05' }),
    etapa('z', 'Fase A', { inicio_previsto: '2026-05-01', fim_previsto: '2026-05-10', inicio_real: '2026-05-01', fim_real: '2026-05-09' }),
  ]],
]);

test('statusNaData segue a regra do importador', () => {
  assert.equal(statusNaData({ inicio_previsto: null, fim_previsto: null, inicio_real: null, fim_real: '2026-01-01' }, HOJE), 'concluida');
  assert.equal(statusNaData({ inicio_previsto: '2026-05-01', fim_previsto: '2026-06-01', inicio_real: '2026-05-02', fim_real: null }, HOJE), 'atrasada');
  assert.equal(statusNaData({ inicio_previsto: '2026-05-01', fim_previsto: '2026-06-20', inicio_real: '2026-05-02', fim_real: null }, HOJE), 'em_andamento');
  assert.equal(statusNaData({ inicio_previsto: '2026-06-01', fim_previsto: '2026-06-20', inicio_real: null, fim_real: null }, HOJE), 'inicio_atrasado');
  assert.equal(statusNaData({ inicio_previsto: '2026-06-10', fim_previsto: '2026-06-20', inicio_real: null, fim_real: null }, HOJE), 'a_fazer');
  assert.equal(statusNaData({ inicio_previsto: null, fim_previsto: null, inicio_real: null, fim_real: null }, HOJE), 'a_fazer');
});

test('resumoCronograma: percentuais, SPI, fase atual, atrasadas e próximos 7 dias', () => {
  const r = resumoCronograma(c1, HOJE);
  assert.equal(r.etapas, 4);
  assert.equal(r.concluidas, 1);
  // pesos: 10 + 10 + 1 (sem duração) + 10 = 31
  assert.ok(Math.abs(r.realizadoPct - (10 / 31) * 100) < 1e-9);
  // previsto: e1 inteira (10) + e2 9/20 de 10 (4,5) + e3 inteira (1) + e4 ainda não começou (0)
  assert.ok(Math.abs(r.previstoPct - (15.5 / 31) * 100) < 1e-9);
  assert.ok(Math.abs((r.spi as number) - 10 / 15.5) < 1e-9);
  assert.equal(r.ritmo, 'vermelho');
  assert.equal(r.faseAtual, 'Fase A');
  assert.equal(r.atrasadas, 1); // e3: início atrasado
  assert.equal(r.proximos7, 1); // e4 vence em 17/06
  assert.equal(r.entregaPrevista, '2026-06-21');
});

test('resumoCronograma: tudo concluído e sem previsão', () => {
  const pronto = cron('C-3', [['F', [etapa('a', 'F', { inicio_previsto: '2026-01-01', fim_previsto: '2026-01-10', fim_real: '2026-01-09' })]]]);
  const r = resumoCronograma(pronto, HOJE);
  assert.equal(r.faseAtual, 'Concluído');
  assert.equal(r.realizadoPct, 100);
  assert.equal(r.ritmo, 'verde');
  const futuro = cron('C-4', [['F', [etapa('a', 'F', { inicio_previsto: '2027-01-01', fim_previsto: '2027-01-10' })]]]);
  const f = resumoCronograma(futuro, HOJE);
  assert.equal(f.previstoPct, 0);
  assert.equal(f.spi, null);
  assert.equal(f.ritmo, null);
});

test('farol do SPI nos limites', () => {
  assert.equal(farolRitmo(0.95), 'verde');
  assert.equal(farolRitmo(0.9499), 'amarelo');
  assert.equal(farolRitmo(0.85), 'amarelo');
  assert.equal(farolRitmo(0.8499), 'vermelho');
  assert.equal(farolRitmo(null), null);
});

test('ondeEstaParado agrupa por unidade e por responsável, do maior atraso acumulado ao menor', () => {
  const { porUnidade, porResponsavel } = ondeEstaParado([c1, c2], HOJE);
  assert.deepEqual(porUnidade.map((u) => [u.unidade, u.itens, u.diasAcumulados]), [['PGM', 2, 11], ['Sem unidade', 1, 5]]);
  assert.deepEqual(porUnidade[0].maisAntigo, { cronograma: 'Titulo C-2', etapa: 'x', dias: 10 });
  // Sem unidade: só y (venceu há 5 dias); e2 e e4 ainda estão no prazo.
  assert.equal(porUnidade[1].maisAntigo.etapa, 'y');
  assert.deepEqual(porResponsavel.map((r) => [r.responsavel, r.itens, r.diasAcumulados]), [['Ana', 2, 11], ['Sem responsável', 1, 5]]);
});
