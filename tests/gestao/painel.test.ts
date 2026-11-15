process.env.GOVNEXA_EXEMPLO = '1'; // usa os dados fictícios de data/exemplo
// Testes do Painel do prefeito (Gestão): totais, % financeiro, listas limitadas e ordenadas. Data de referência fixa.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Carteira, Projeto } from '../../src/lib/carteira/tipos.ts';
import { valorProjeto } from '../../src/lib/carteira/visoes.ts';
import type { Cronograma } from '../../src/lib/cronograma/tipos.ts';
import type { Sala } from '../../src/lib/sala/tipos.ts';
import { montarPainel, reaisAbreviado, resumoCaptacao } from '../../src/lib/gestao/painel.ts';

const HOJE = '2026-11-15';
const carteira = JSON.parse(readFileSync('data/exemplo/carteira/carteira.json', 'utf8')) as Carteira;
const cronogramas = (JSON.parse(readFileSync('data/exemplo/cronogramas/cronogramas.json', 'utf8')) as { cronogramas: Cronograma[] }).cronogramas;
const salas = (JSON.parse(readFileSync('data/exemplo/sala-guerra/salas.json', 'utf8')) as { salas: Sala[] }).salas;

function proj(id: string, mudar: (p: Projeto) => void = () => {}): Projeto {
  const p = JSON.parse(JSON.stringify(carteira.projetos[0])) as Projeto;
  p.id = id;
  p.nome = `Projeto ${id}`;
  p.pendencias = [];
  p.prioridade = 'Média';
  p.macroetapa = '04';
  p.datas = { ...p.datas, planejamento: '2027-06-01', preparatorio: '2027-06-01', contratacao: '2027-06-01', mobilizacao: '2027-06-01', encerramento: '2028-06-01' };
  p.valores = { ...p.valores, total: 1000, obra: 1000, executado: null };
  mudar(p);
  return p;
}
const cart = (...projetos: Projeto[]): Carteira => ({ ...carteira, projetos });

test('totais do painel batem com a carteira', () => {
  const painel = montarPainel(carteira, cronogramas, salas, null, HOJE);
  assert.equal(painel.carteira.total, carteira.projetos.length);
  assert.equal(painel.carteira.valor, carteira.projetos.reduce((s, p) => s + (valorProjeto(p) ?? 0), 0));
  assert.equal(painel.carteira.porMacroetapa.reduce((s, g) => s + g.qtd, 0), carteira.projetos.length);
  assert.equal(painel.carteira.porMacroetapa.reduce((s, g) => s + g.valor, 0), painel.carteira.valor);
  assert.equal(painel.carteira.prioridadeMuitoAlta, carteira.projetos.filter((p) => p.prioridade === 'Muito Alta').length);
  assert.equal(painel.contratacao.qtd, carteira.projetos.filter((p) => p.macroetapa === '02' || p.macroetapa === '03').length);
  assert.equal(painel.execucao.qtd, carteira.projetos.filter((p) => p.macroetapa === '05').length);
  assert.equal(painel.recursos, null);
});

test('percentual financeiro: executado dividido pelo total; sem dado vira null', () => {
  const c = cart(
    proj('P-1', (p) => { p.macroetapa = '05'; p.valores.total = 1000; p.valores.executado = 250; }),
    proj('P-2', (p) => { p.macroetapa = '05'; p.valores.executado = null; }),
    proj('P-3', (p) => { p.macroetapa = '05'; p.valores.total = null; p.valores.obra = null; p.valores.executado = 10; }),
    proj('P-4', (p) => { p.macroetapa = '05'; p.valores.total = 100; p.valores.executado = 500; }),
  );
  const { lista } = montarPainel(c, [], [], null, HOJE).execucao;
  assert.equal(lista.find((i) => i.id === 'P-1')?.percentual, 25);
  assert.equal(lista.find((i) => i.id === 'P-2')?.percentual, null);
  assert.equal(lista.find((i) => i.id === 'P-3')?.percentual, null);
  assert.equal(lista.find((i) => i.id === 'P-4')?.percentual, null); // executado acima do total: dado incoerente
});

test('contratação ordenada pela data prevista (sem data por último) e só as macroetapas 02 e 03', () => {
  const c = cart(
    proj('P-1', (p) => { p.macroetapa = '03'; p.datas.contratacao = '2027-03-01'; }),
    proj('P-2', (p) => { p.macroetapa = '02'; p.datas.contratacao = '2027-01-01'; }),
    proj('P-3', (p) => { p.macroetapa = '03'; p.datas.contratacao = null; }),
    proj('P-4', (p) => { p.macroetapa = '05'; }),
  );
  const { lista, qtd, valor } = montarPainel(c, [], [], null, HOJE).contratacao;
  assert.deepEqual(lista.map((i) => i.id), ['P-2', 'P-1', 'P-3']);
  assert.equal(qtd, 3);
  assert.equal(valor, 3000);
});

test('atenção: no máximo 5 vermelhos, por prioridade; candidatos no máximo 3', () => {
  const vermelho = (id: string, prioridade: string) => proj(id, (p) => { p.prioridade = prioridade; p.datas.mobilizacao = '2026-01-01'; p.macroetapa = '04'; });
  const c = cart(vermelho('P-1', 'Baixa'), vermelho('P-2', 'Muito Alta'), vermelho('P-3', 'Alta'), vermelho('P-4', 'Média'), vermelho('P-5', 'Muito Alta'), vermelho('P-6', 'Alta'), vermelho('P-7', 'Baixa'));
  const { atencao } = montarPainel(c, [], [], null, HOJE);
  assert.equal(atencao.vermelhos.qtd, 7);
  assert.equal(atencao.vermelhos.top.length, 5);
  assert.deepEqual(atencao.vermelhos.top.map((i) => i.prioridade), ['Muito Alta', 'Muito Alta', 'Alta', 'Alta', 'Média']);
  assert.ok(atencao.vermelhos.top.every((i) => i.motivo.length > 0));
  assert.ok(atencao.candidatosSala.top.length <= 3);
  assert.ok(atencao.candidatosSala.top.every((x) => x.porque.startsWith('Sugerido porque')));
});

test('entregas em 90 dias: só futuras dentro do prazo, da mais próxima à mais distante', () => {
  const c = cart(
    proj('P-1', (p) => { p.datas.encerramento = '2027-03-01'; }),
    proj('P-2', (p) => { p.datas.encerramento = '2026-12-01'; }),
    proj('P-3', (p) => { p.datas.encerramento = '2026-11-14'; }),
    proj('P-4', (p) => { p.datas.encerramento = '2026-12-20'; p.macroetapa = '06'; }),
    proj('P-5', (p) => { p.datas.encerramento = '2026-11-15'; }),
  );
  const { lista, qtd } = montarPainel(c, [], [], null, HOJE).entregas;
  assert.deepEqual(lista.map((i) => i.id), ['P-5', 'P-2']);
  assert.deepEqual(lista.map((i) => i.dias), [0, 16]);
  assert.equal(qtd, 2);
});

test('onde está parado: no máximo 5 unidades; recursos vêm do módulo da Captação', () => {
  const painel = montarPainel(carteira, cronogramas, salas, resumoCaptacao(), HOJE);
  assert.ok(painel.parado.length <= 5);
  const r = painel.recursos;
  if (r) assert.ok(r.pactuado >= r.liberado && r.emExecucao >= r.semDesembolso);
});

test('R$ abreviado', () => {
  assert.equal(reaisAbreviado(1_250_000_000), 'R$ 1,3 bi');
  assert.equal(reaisAbreviado(350_000_000), 'R$ 350 mi');
  assert.equal(reaisAbreviado(12_500), 'R$ 12,5 mil');
  assert.equal(reaisAbreviado(900), 'R$ 900');
});
