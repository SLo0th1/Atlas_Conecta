process.env.GOVNEXA_EXEMPLO = '1'; // usa os dados fictícios de data/exemplo
// Testes das regras da Sala de guerra: candidatos, indicadores/farol e pauta da reunião (data de referência fixa).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Carteira, Projeto } from '../../src/lib/carteira/tipos.ts';
import type { Cronograma, EtapaCronograma } from '../../src/lib/cronograma/tipos.ts';
import type { ItemRaid, Sala } from '../../src/lib/sala/tipos.ts';
import { candidatosSala, indicadoresSala, pautaReuniao } from '../../src/lib/sala/visoes.ts';

const HOJE = '2026-11-15';
const carteira = JSON.parse(readFileSync('data/exemplo/carteira/carteira.json', 'utf8')) as Carteira;
const salasExemplo = (JSON.parse(readFileSync('data/exemplo/sala-guerra/salas.json', 'utf8')) as { salas: Sala[] }).salas;

/** Projeto sintético: prazo da macroetapa no futuro, sem pendência, valor totalmente coberto por fonte (nenhum motivo, a menos que se peça). */
function proj(id: string, mudar: (p: Projeto) => void = () => {}): Projeto {
  const p = JSON.parse(JSON.stringify(carteira.projetos[0])) as Projeto;
  p.id = id;
  p.nome = `Projeto ${id}`;
  p.pendencias = [];
  p.prioridade = 'Média';
  p.macroetapa = '04';
  p.datas = { ...p.datas, mobilizacao: '2027-06-01', encerramento: '2028-06-01' };
  p.valores = { ...p.valores, total: 1000, obra: 1000, captado: 1000, contrapartida: null, custeio_municipio: null };
  mudar(p);
  return p;
}
const cart = (...projetos: Projeto[]): Carteira => ({ ...carteira, projetos });

function etapa(nome: string, fim: string, extra: Partial<EtapaCronograma> = {}): EtapaCronograma {
  return {
    ordem: 1, nome, fase: 'Fase', unidade: 'PGM', responsavel: null, situacao_planilha: null, duracao_prevista: 10,
    inicio_previsto: '2026-01-01', fim_previsto: fim, inicio_real: '2026-01-01', fim_real: null, status: 'atrasada',
    ciclo: null, pendencias: [], origem: { aba: 'x', linha: 1 }, ...extra,
  };
}
const crono = (projeto: string, ...etapas: EtapaCronograma[]): Cronograma => ({
  id: `C-${projeto}`, aba: 'x', titulo: `Cronograma ${projeto}`, endereco: null, sei: [], projeto_id: projeto, casamento: 'sei',
  fases: [{ nome: 'Fase', ordem: 1, etapas }], pendencias: [],
});

test('candidato: prioridade alta com prazo vencido (+3) entra sozinho; prioridade média não', () => {
  const alta = proj('P-1', (p) => { p.prioridade = 'Alta'; p.macroetapa = '01'; p.datas.planejamento = '2026-10-01'; });
  const media = proj('P-2', (p) => { p.macroetapa = '01'; p.datas.planejamento = '2026-10-01'; });
  const r = candidatosSala(cart(alta, media), [], HOJE);
  assert.deepEqual(r.map((c) => c.projeto.id), ['P-1']);
  assert.deepEqual(r[0].motivos, ['Prioridade alta com prazo de etapa vencido']);
  assert.equal(r[0].peso, 3);
});

test('candidato: ritmo vermelho (+2) e etapa parada há mais de 30 dias (+2) somam 4', () => {
  const p = proj('P-3');
  const c = crono('P-3', etapa('Parecer jurídico', '2026-09-01'));
  const r = candidatosSala(cart(p), [c], HOJE);
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].motivos, ['Cronograma em ritmo vermelho (realizado abaixo do previsto)', 'Etapa parada há mais de 30 dias: Parecer jurídico (PGM)']);
  assert.equal(r[0].peso, 4);
});

test('candidato: etapa vencida há 30 dias ou menos não conta como parada', () => {
  const p = proj('P-4');
  const c = crono('P-4', etapa('Parecer jurídico', '2026-10-16'), etapa('Outra', '2027-01-01', { inicio_real: null, status: 'a_fazer', inicio_previsto: '2026-12-01' }));
  const r = candidatosSala(cart(p), [c], HOJE);
  assert.ok(r.every((x) => !x.motivos.some((m) => m.startsWith('Etapa parada'))));
});

test('candidato: contratação com saldo sem fonte (+2) sozinho fica abaixo do corte; com entrega próxima e em risco (+1) chega a 3', () => {
  const so = proj('P-5', (p) => { p.macroetapa = '03'; p.valores.captado = null; p.valores.custeio_municipio = 100; p.datas.contratacao = '2027-03-01'; });
  assert.deepEqual(candidatosSala(cart(so), [], HOJE), []);
  const com = proj('P-6', (p) => {
    p.macroetapa = '02'; p.prioridade = 'Muito Alta'; p.valores.captado = null; p.valores.custeio_municipio = 100;
    p.datas.preparatorio = '2027-03-01'; p.datas.encerramento = '2027-01-10'; p.pendencias = ['dado faltando'];
  });
  const r = candidatosSala(cart(com), [], HOJE);
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].motivos, ['Em contratação com saldo sem fonte', 'Entrega próxima e em risco']);
  assert.equal(r[0].peso, 3);
});

test('candidato: entrega próxima só vale para Muito Alta, em até 90 dias e com farol diferente de verde', () => {
  const base = (mudar: (p: Projeto) => void) => proj('P-7', (p) => { p.prioridade = 'Muito Alta'; p.datas.encerramento = '2027-01-10'; p.pendencias = ['x']; mudar(p); });
  const peso = (p: Projeto) => candidatosSala(cart(p), [], HOJE).length;
  assert.equal(peso(base(() => {})), 0); // só +1: abaixo do corte
  const doisMotivos = (p: Projeto) => { p.macroetapa = '03'; p.valores.captado = null; p.valores.custeio_municipio = 100; p.datas.contratacao = '2027-03-01'; };
  assert.equal(peso(base(doisMotivos)), 1); // +2 +1 = 3
  assert.equal(peso(base((p) => { doisMotivos(p); p.datas.encerramento = '2027-03-01'; })), 0); // entrega a mais de 90 dias
  assert.equal(peso(base((p) => { doisMotivos(p); p.pendencias = []; })), 0); // farol verde
  assert.equal(peso(base((p) => { doisMotivos(p); p.prioridade = 'Alta'; })), 0); // não é Muito Alta
});

test('candidato: projeto concluído nunca entra e quem já está em sala aberta ou em andamento é excluído', () => {
  const venc = (id: string) => proj(id, (p) => { p.prioridade = 'Alta'; p.macroetapa = '01'; p.datas.planejamento = '2026-10-01'; });
  const concluido = proj('P-8', (p) => { p.prioridade = 'Alta'; p.macroetapa = '06'; });
  const c = cart(venc('P-9'), venc('P-10'), concluido);
  assert.deepEqual(candidatosSala(c, [], HOJE).map((x) => x.projeto.id).sort(), ['P-10', 'P-9']);
  const sala = (id: string, situacao: Sala['situacao']): Sala => ({ ...salasExemplo[0], id: `S-${id}`, projetos: [id], situacao });
  assert.deepEqual(candidatosSala(c, [], HOJE, [sala('P-9', 'aberta')]).map((x) => x.projeto.id), ['P-10']);
  assert.deepEqual(candidatosSala(c, [], HOJE, [sala('P-9', 'em_andamento')]).map((x) => x.projeto.id), ['P-10']);
  assert.deepEqual(candidatosSala(c, [], HOJE, [sala('P-9', 'encerrada')]).map((x) => x.projeto.id).sort(), ['P-10', 'P-9']);
});

test('candidato: ordena por peso e, no empate, pela entrega mais próxima', () => {
  const venc = (id: string, enc: string) => proj(id, (p) => { p.prioridade = 'Alta'; p.macroetapa = '01'; p.datas.planejamento = '2026-10-01'; p.datas.encerramento = enc; });
  const forte = proj('P-F', (p) => { p.prioridade = 'Alta'; p.macroetapa = '01'; p.datas.planejamento = '2026-10-01'; p.datas.encerramento = '2029-01-01'; });
  const r = candidatosSala(cart(venc('P-B', '2028-01-01'), venc('P-A', '2027-01-01'), forte), [crono('P-F', etapa('X', '2026-09-01'))], HOJE);
  assert.deepEqual(r.map((x) => x.projeto.id), ['P-F', 'P-A', 'P-B']);
});

const item = (id: string, tipo: ItemRaid['tipo'], extra: Partial<ItemRaid> = {}): ItemRaid => ({
  id, tipo, descricao: `Item ${id}`, responsavel: 'Responsável 1', prazo: null, situacao: 'aberto', criado_em: '2026-11-01', ...extra,
});
const salaCom = (raid: ItemRaid[], extra: Partial<Sala> = {}): Sala => ({
  ...salasExemplo[0], projetos: ['P-903'], aberta_em: '2026-11-01', prazo: '2027-03-01', escalonamento: 2, raid, reunioes: [], marcos: [], ...extra,
});

test('indicadores: contagens e farol vermelho por ação vencida', () => {
  const s = salaCom([
    item('A1', 'acao', { prazo: '2026-11-10' }),
    item('A2', 'acao', { prazo: '2026-11-30', situacao: 'em_andamento' }),
    item('A3', 'acao', { prazo: '2026-11-01', situacao: 'concluido' }),
    item('P1', 'problema'),
    item('R1', 'risco', { impacto: 'alto' }),
    item('R2', 'risco', { impacto: 'medio' }),
  ]);
  const i = indicadoresSala(s, carteira, [], HOJE);
  assert.equal(i.acoesAbertas, 2);
  assert.equal(i.acoesVencidas, 1);
  assert.equal(i.problemasAbertos, 1);
  assert.equal(i.riscosAltos, 1);
  assert.equal(i.diasParaPrazo, 106);
  assert.equal(i.farol.cor, 'vermelho');
  assert.match(i.farol.motivo, /vencida/);
});

test('indicadores: farol vermelho por prazo vencido e por problema aberto no gabinete', () => {
  assert.equal(indicadoresSala(salaCom([], { prazo: '2026-11-14' }), carteira, [], HOJE).farol.cor, 'vermelho');
  assert.equal(indicadoresSala(salaCom([item('P1', 'problema')], { escalonamento: 3 }), carteira, [], HOJE).farol.cor, 'vermelho');
  assert.equal(indicadoresSala(salaCom([item('P1', 'problema')], { escalonamento: 2 }), carteira, [], HOJE).farol.cor, 'verde');
});

test('indicadores: amarelo por prazo em até 7 dias ou risco alto; verde no resto; prazo no dia não está vencido', () => {
  assert.equal(indicadoresSala(salaCom([], { prazo: '2026-11-22' }), carteira, [], HOJE).farol.cor, 'amarelo');
  assert.equal(indicadoresSala(salaCom([], { prazo: '2026-11-23' }), carteira, [], HOJE).farol.cor, 'verde');
  assert.equal(indicadoresSala(salaCom([item('R1', 'risco', { impacto: 'alto' })]), carteira, [], HOJE).farol.cor, 'amarelo');
  assert.equal(indicadoresSala(salaCom([], { prazo: HOJE }), carteira, [], HOJE).farol.cor, 'amarelo');
  assert.equal(indicadoresSala(salaCom([item('A1', 'acao', { prazo: HOJE })]), carteira, [], HOJE).farol.cor, 'verde');
});

test('indicadores: soma as etapas atrasadas dos cronogramas dos projetos da sala', () => {
  const cs = [crono('P-903', etapa('A', '2026-09-01'), etapa('B', '2026-10-01')), crono('P-999', etapa('C', '2026-09-01'))];
  assert.equal(indicadoresSala(salaCom([]), carteira, cs, HOJE).etapasAtrasadas, 2);
});

test('pauta: objetivo, ações vencidas, ações da semana, problemas, riscos altos, decisões, marcos, mudanças (nesta ordem)', () => {
  const s = salaCom(
    [
      item('D1', 'decisao'),
      item('R1', 'risco', { impacto: 'alto' }),
      item('R2', 'risco', { impacto: 'baixo' }),
      item('P1', 'problema'),
      item('A2', 'acao', { prazo: '2026-11-18' }),
      item('A1', 'acao', { prazo: '2026-11-10' }),
      item('A3', 'acao', { prazo: '2026-12-30' }),
      item('A4', 'acao', { prazo: '2026-11-05', situacao: 'concluido' }),
    ],
    { marcos: [{ data: '2026-11-20', descricao: 'Marco perto', feito: false }, { data: '2026-12-30', descricao: 'Marco longe', feito: false }, { data: '2026-11-16', descricao: 'Marco feito', feito: true }], reunioes: [{ data: '2026-11-10', pauta: [], decisoes: [], encaminhamentos: [] }] },
  );
  const historico = [
    { id: 'h1', projeto_id: 'P-903', tipo: 'mover_macroetapa' as const, origem: 'kanban' as const, autor: 'Responsável 1', em: '2026-11-12T12:00:00Z', de: '02' as const, para: '03' as const },
    { id: 'h2', projeto_id: 'P-903', tipo: 'mover_macroetapa' as const, origem: 'kanban' as const, autor: 'Responsável 1', em: '2026-11-09T12:00:00Z', de: '01' as const, para: '02' as const },
    { id: 'h3', projeto_id: 'P-900', tipo: 'mover_macroetapa' as const, origem: 'kanban' as const, autor: 'Responsável 1', em: '2026-11-12T12:00:00Z', de: '01' as const, para: '02' as const },
  ];
  const p = pautaReuniao(s, carteira, HOJE, historico);
  assert.equal(p.length, 8);
  assert.match(p[0], /^Objetivo e prazo: /);
  assert.match(p[1], /^Ação vencida: Item A1/);
  assert.match(p[2], /^Ação que vence em 7 dias: Item A2/);
  assert.match(p[3], /^Problema aberto: Item P1/);
  assert.match(p[4], /^Risco de impacto alto: Item R1/);
  assert.match(p[5], /^Decisão pendente: Item D1/);
  assert.match(p[6], /^Próximo marco: Marco perto/);
  assert.match(p[7], /^O que mudou desde a última reunião \(10\/11\/2026\): /);
  assert.ok(!p.join('|').includes('Item A3') && !p.join('|').includes('Item A4') && !p.join('|').includes('Item R2'));
  assert.equal(p.filter((t) => t.startsWith('O que mudou')).length, 1); // só h1: h2 é anterior à reunião e h3 é de outro projeto
});

test('pauta: sem nada além do objetivo devolve só o primeiro item', () => {
  const p = pautaReuniao(salaCom([]), carteira, HOJE, []);
  assert.equal(p.length, 1);
  assert.match(p[0], /^Objetivo e prazo: .* Prazo 01\/03\/2027 \(faltam 106 dias\)\.$/);
});

test('salas de exemplo: 3 salas fictícias, projetos existentes na carteira e papéis no lugar de nomes', () => {
  assert.equal(salasExemplo.length, 3);
  const ids = new Set(carteira.projetos.map((p) => p.id));
  for (const s of salasExemplo) for (const id of s.projetos) assert.ok(ids.has(id), `${s.id}: projeto ${id} não existe`);
  assert.deepEqual(salasExemplo.map((s) => s.situacao), ['aberta', 'em_andamento', 'encerrada']);
  assert.equal(salasExemplo[2].licoes?.length, 3);
});
