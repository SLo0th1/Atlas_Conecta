process.env.GOVNEXA_EXEMPLO = '1'; // usa os dados fictícios de data/exemplo, não a carga real
// Testes das visões da Carteira de Projetos (Kanban, órgãos, farol, saldo, Gantt).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Carteira, Projeto } from '../../src/lib/carteira/tipos.ts';
import { farol, resumoPorMacroetapa, resumoPorOrgao, saldoSemFonte, segmentosGantt } from '../../src/lib/carteira/visoes.ts';

const carteira = JSON.parse(readFileSync('data/exemplo/carteira/carteira.json', 'utf8')) as Carteira;

function sintetico(mudar: (p: Projeto) => void): Projeto {
  const p = JSON.parse(JSON.stringify(carteira.projetos[0])) as Projeto;
  p.pendencias = [];
  mudar(p);
  return p;
}

test('resumo por macroetapa soma todos os projetos', () => {
  const g = resumoPorMacroetapa(carteira);
  assert.equal(g.reduce((s, x) => s + x.qtd, 0), carteira.projetos.length);
  assert.deepEqual(g.slice(0, 7).map((x) => x.codigo), ['00', '01', '02', '03', '04', '05', '06']);
});

test('resumo por órgão: percentuais somam 100 e ordem por valor', () => {
  const o = resumoPorOrgao(carteira);
  assert.ok(Math.abs(o.reduce((s, x) => s + x.percentual, 0) - 100) < 0.001);
  for (let i = 1; i < o.length; i++) assert.ok(o[i - 1].valor >= o[i].valor);
  assert.equal(o.reduce((s, x) => s + x.qtd, 0), carteira.projetos.length);
});

test('farol: vencido é vermelho, pendência amarelo, ok verde, concluído nunca vermelho', () => {
  const hoje = '2026-11-15';
  const vencido = sintetico((p) => { p.macroetapa = '01'; p.datas.planejamento = '2026-10-01'; });
  assert.equal(farol(vencido, hoje).cor, 'vermelho');
  assert.equal(farol(vencido, hoje).motivo, 'Prazo da macroetapa vencido');
  const entrega = sintetico((p) => { p.macroetapa = '03'; p.datas.contratacao = '2027-01-01'; p.datas.encerramento = '2026-11-01'; });
  assert.equal(farol(entrega, hoje).motivo, 'Entrega prevista vencida');
  const pend = sintetico((p) => { p.macroetapa = '01'; p.datas.planejamento = '2027-06-01'; p.datas.encerramento = '2028-01-01'; p.pendencias = ['Falta valor']; });
  assert.equal(farol(pend, hoje).cor, 'amarelo');
  const perto = sintetico((p) => { p.macroetapa = '01'; p.datas.planejamento = '2026-11-20'; p.datas.encerramento = '2028-01-01'; });
  assert.equal(farol(perto, hoje).cor, 'amarelo');
  const ok = sintetico((p) => { p.macroetapa = '01'; p.datas.planejamento = '2027-06-01'; p.datas.encerramento = '2028-01-01'; });
  assert.deepEqual(farol(ok, hoje), { cor: 'verde', motivo: 'No prazo' });
  const concluido = sintetico((p) => { p.macroetapa = '06'; p.datas.encerramento = '2026-01-01'; });
  assert.notEqual(farol(concluido, hoje).cor, 'vermelho');
});

test('saldo sem fonte: null sem fontes, calculado quando há', () => {
  const sem = sintetico((p) => { p.valores.total = 100; p.valores.captado = null; p.valores.contrapartida = null; p.valores.custeio_municipio = null; });
  assert.equal(saldoSemFonte(sem), null);
  const com = sintetico((p) => { p.valores.total = 100; p.valores.captado = 30; p.valores.contrapartida = null; p.valores.custeio_municipio = 20; });
  assert.equal(saldoSemFonte(com), 50);
  const excesso = sintetico((p) => { p.valores.total = 100; p.valores.captado = 130; });
  assert.equal(saldoSemFonte(excesso), 0);
  const semValor = sintetico((p) => { p.valores.total = null; p.valores.obra = null; });
  assert.equal(saldoSemFonte(semValor), null);
});

test('segmentos do Gantt pulam datas faltantes e usam execução em dias', () => {
  const completo = sintetico((p) => {
    p.datas = { inicio: '2026-01-01', pecas_tecnicas: '2026-02-01', planejamento: '2026-03-01', preparatorio: '2026-04-01', contratacao: '2026-05-01', mobilizacao: '2026-06-01', execucao_dias: 30, encerramento: null };
  });
  const s = segmentosGantt(completo);
  assert.equal(s.length, 6);
  assert.deepEqual(s[5], { codigo: '05', inicio: '2026-06-01', fim: '2026-07-01' });
  const faltando = sintetico((p) => {
    p.datas = { inicio: '2026-01-01', pecas_tecnicas: '2026-02-01', planejamento: null, preparatorio: '2026-04-01', contratacao: null, mobilizacao: null, execucao_dias: null, encerramento: null };
  });
  assert.deepEqual(segmentosGantt(faltando).map((x) => x.codigo), ['00']);
  const invertido = sintetico((p) => {
    p.datas = { inicio: '2026-05-01', pecas_tecnicas: '2026-02-01', planejamento: null, preparatorio: null, contratacao: null, mobilizacao: null, execucao_dias: null, encerramento: null };
  });
  assert.deepEqual(segmentosGantt(invertido), []);
});
