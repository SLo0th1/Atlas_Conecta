process.env.GOVNEXA_EXEMPLO = '1'; // usa os dados fictícios de data/exemplo
// Testes da pauta da Reunião semanal: motivos de entrada, sem repetição, ordem e mudanças desde a data (hoje fixo).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Carteira, Projeto } from '../../src/lib/carteira/tipos.ts';
import type { RegistroLog } from '../../src/lib/log/tipos.ts';
import { MOTIVO_MUDOU, MOTIVO_PRIORIDADE, MOTIVO_SALA, MOTIVO_VENCIDO, pautaSemanal } from '../../src/lib/reuniao/visoes.ts';
import { faltandoNaReuniao, montarRegistrosReuniao } from '../../src/lib/reuniao/simulacao.ts';

const HOJE = '2026-11-15';
const carteira = JSON.parse(readFileSync('data/exemplo/carteira/carteira.json', 'utf8')) as Carteira;

/** Projeto sintético em dia (farol verde), sem motivo para a pauta, a menos que se peça. */
function proj(id: string, mudar: (p: Projeto) => void = () => {}): Projeto {
  const p = JSON.parse(JSON.stringify(carteira.projetos[0])) as Projeto;
  p.id = id;
  p.nome = `Projeto ${id}`;
  p.pendencias = [];
  p.prioridade = 'Média';
  p.macroetapa = '04';
  p.operacional = null;
  p.datas = { ...p.datas, mobilizacao: '2027-06-01', encerramento: '2028-06-01' };
  mudar(p);
  return p;
}
const cart = (...projetos: Projeto[]): Carteira => ({ ...carteira, projetos });
const reg = (projeto: string, em: string, extra: Partial<RegistroLog> = {}): RegistroLog => ({
  id: `${projeto}-${em}`, projeto_id: projeto, tipo: 'registrar_passo', origem: 'ficha', autor: 'Pessoa Fictícia 1', em, descricao: 'Passo feito', ...extra,
});
const ids = (c: Carteira, h: RegistroLog[], salas: string[], desde = '2026-11-08') => pautaSemanal(c, h, salas, desde, HOJE).itens.map((i) => i.projeto_id);

test('projeto em dia e sem mudança não entra na pauta', () => {
  assert.deepEqual(ids(cart(proj('A')), [], []), []);
});

test('farol vermelho entra com o motivo "Prazo vencido"', () => {
  const c = cart(proj('A', (p) => { p.macroetapa = '04'; p.datas.mobilizacao = '2026-10-01'; }));
  const r = pautaSemanal(c, [], [], '2026-11-08', HOJE);
  assert.deepEqual(r.itens.map((i) => i.motivosNaPauta), [[MOTIVO_VENCIDO]]);
  assert.equal(r.itens[0].farol.cor, 'vermelho');
  assert.equal(r.resumo.vermelhos, 1);
});

test('candidato à sala de guerra entra (lista por parâmetro)', () => {
  const r = pautaSemanal(cart(proj('A'), proj('B')), [], ['B'], '2026-11-08', HOJE);
  assert.deepEqual(r.itens.map((i) => [i.projeto_id, i.motivosNaPauta]), [['B', [MOTIVO_SALA]]]);
});

test('mudança no histórico desde a data entra; antes da data não entra', () => {
  const c = cart(proj('A'), proj('B'));
  const h = [reg('A', '2026-11-10T12:00:00Z'), reg('B', '2026-11-01T12:00:00Z')];
  assert.deepEqual(ids(c, h, []), ['A']);
  assert.deepEqual(ids(c, h, [], '2026-10-30'), ['A', 'B']);
  assert.deepEqual(ids(c, h, [], '2026-11-12'), []);
  const r = pautaSemanal(c, h, [], '2026-11-08', HOJE);
  assert.deepEqual(r.itens[0].mudancas, ['Passo feito']);
  assert.deepEqual(r.itens[0].motivosNaPauta, [MOTIVO_MUDOU]);
});

test('prioridade Muito Alta com farol amarelo entra; Muito Alta verde não', () => {
  const amarelo = proj('A', (p) => { p.prioridade = 'Muito Alta'; p.pendencias = ['Falta valor']; });
  const verde = proj('B', (p) => { p.prioridade = 'Muito Alta'; });
  const r = pautaSemanal(cart(amarelo, verde), [], [], '2026-11-08', HOJE);
  assert.deepEqual(r.itens.map((i) => [i.projeto_id, i.motivosNaPauta]), [['A', [MOTIVO_PRIORIDADE]]]);
});

test('sem repetição: projeto com vários motivos aparece uma vez, com todos os motivos', () => {
  const c = cart(proj('A', (p) => { p.datas.mobilizacao = '2026-10-01'; p.prioridade = 'Alta'; }));
  const r = pautaSemanal(c, [reg('A', '2026-11-10T12:00:00Z')], ['A'], '2026-11-08', HOJE);
  assert.equal(r.itens.length, 1);
  assert.deepEqual(r.itens[0].motivosNaPauta, [MOTIVO_VENCIDO, MOTIVO_SALA, MOTIVO_MUDOU]);
  assert.equal(r.resumo.total, 1);
});

test('ordem: vermelho primeiro, depois prioridade, depois entrega mais próxima', () => {
  const venc = (id: string, prio: string | null, entrega: string) => proj(id, (p) => { p.datas.mobilizacao = '2026-10-01'; p.prioridade = prio; p.datas.encerramento = entrega; });
  const emDia = (id: string, prio: string | null, entrega: string) => proj(id, (p) => { p.prioridade = prio; p.datas.encerramento = entrega; });
  const c = cart(
    emDia('Z-sala', 'Muito Alta', '2027-01-01'), // candidato à sala (verde): vem depois dos vermelhos
    venc('V-baixa', 'Baixa', '2027-01-01'),
    venc('V-muito-tarde', 'Muito Alta', '2028-01-01'),
    venc('V-muito-cedo', 'Muito Alta', '2027-01-01'),
    venc('V-sem', null, '2027-01-01'),
    venc('V-alta', 'Alta', '2027-01-01'),
  );
  assert.deepEqual(ids(c, [], ['Z-sala']), ['V-muito-cedo', 'V-muito-tarde', 'V-alta', 'V-baixa', 'V-sem', 'Z-sala']);
});

test('resumo: total, por macroetapa, mudaram de etapa e novos', () => {
  const c = cart(proj('A', (p) => { p.macroetapa = '03'; }), proj('B', (p) => { p.macroetapa = '03'; }), proj('C'));
  const h = [
    reg('A', '2026-11-10T12:00:00Z', { tipo: 'mover_macroetapa', de: '02', para: '03', descricao: undefined }),
    reg('B', '2026-11-11T12:00:00Z', { tipo: 'criado' }),
    reg('C', '2026-11-12T12:00:00Z'),
  ];
  const r = pautaSemanal(c, h, [], '2026-11-08', HOJE).resumo;
  assert.equal(r.total, 3);
  assert.equal(r.mudaramDeEtapa, 1);
  assert.equal(r.novos, 1);
  assert.deepEqual(r.porMacroetapa, [{ codigo: '03', nome: 'Contratação', qtd: 2 }, { codigo: '04', nome: 'Mobilização', qtd: 1 }]);
});

test('campos da planilha vêm de operacional', () => {
  const c = cart(proj('A', (p) => {
    p.datas.mobilizacao = '2026-10-01';
    p.operacional = { id_base: 'x', casamento: 'sei', situacao: null, reuniao: 'Reunião de 01/11', providencias: 'Enviar ofício', previsao_entrega: null, ano: null, cronograma_fisico: {}, cronograma_financeiro: {}, regioes: {} };
  }));
  const i = pautaSemanal(c, [], [], '2026-11-08', HOJE).itens[0];
  assert.equal(i.ultimaReuniaoPlanilha, 'Reunião de 01/11');
  assert.equal(i.providenciasPlanilha, 'Enviar ofício');
});

test('registro da reunião: validação e registros gerados', () => {
  const itens = [{ projeto_id: 'P-1', projeto_nome: 'Projeto 1', discussao: 'x', decisao: 'Seguir', acoes: [{ descricao: 'Enviar ofício', responsavel: 'Responsável 1', prazo: '2026-11-20' }] }];
  assert.deepEqual(faltandoNaReuniao(itens), []);
  assert.equal(faltandoNaReuniao([]).length, 1);
  assert.equal(faltandoNaReuniao([{ ...itens[0], acoes: [{ descricao: 'a', responsavel: '', prazo: '' }] }]).length, 2);
  const r = montarRegistrosReuniao(itens, '2026-11-15', '2026-11-15T12:00:00.000Z');
  assert.deepEqual(r.map((x) => x.tipo), ['reuniao_registrada', 'acao_criada']);
  assert.equal(r[0].descricao, 'Reunião semanal de 15/11/2026: 1 projeto discutido, 1 decisão, 1 ação');
  assert.equal(r[1].projeto_id, 'P-1');
  assert.equal(new Set(r.map((x) => x.id)).size, 2);
});
