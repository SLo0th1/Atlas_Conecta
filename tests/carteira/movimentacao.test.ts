// Testes do motor de movimentação (regras de etapa, pendência, passo e campos).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aplicarEvento, aplicarEventos, criarProjeto, portaoPara } from '../../src/lib/carteira/movimentacao.ts';
import type { Evento } from '../../src/lib/carteira/movimentacao.ts';
import type { CodigoMacroetapa, Projeto } from '../../src/lib/carteira/tipos.ts';

function projeto(macroetapa: CodigoMacroetapa | null, extra: Partial<Projeto> = {}): Projeto {
  return {
    id: 'P-1', codigo_legado: 1, nome: 'Projeto de teste', orgao: 'SECAP', responsavel: null, tipo: null, detalhamento: null,
    sei: [], observacao: null, macroetapa, status_projeto: null, regiao: null, bairro: null, corredor: null,
    origem_valor: 'Estimativa', tem_projeto: true, prioridade: 'Alta', tipo_contratacao: 'Licitação', orgao_contratacao: null,
    solicitacoes_financeiras: null,
    valores: { projeto: null, obra: 1000, executado: 500, em_captacao: null, captado: null, contrapartida: null, custeio_municipio: null, total: 1000, com_solicitacao_financeira: null },
    recurso: { origem: 'Municipal', tipo: null, situacao: null, fonte_programa: null, unidade_financiadora: null, sugestao_financiar: null, termo_compromisso: null, numero_termo: null },
    datas: { inicio: null, pecas_tecnicas: '2026-01-01', planejamento: null, preparatorio: null, contratacao: '2026-06-01', mobilizacao: '2026-07-01', execucao_dias: null, encerramento: null },
    por_ano: {}, atualizacao: { responsavel: null, data: '2026-01-01' }, operacional: null, pendencias: ['Falta ART'],
    origem: { aba: 'T', linha: 1 }, ...extra,
  };
}
const base = { projeto_id: 'P-1', origem: 'kanban' as const, autor: 'Ana', em: '2026-11-15T10:00:00Z' };
const mover = (para: CodigoMacroetapa, x: { motivo?: string; forcar?: boolean } = {}): Evento => ({ ...base, tipo: 'mover_macroetapa', para, ...x });

test('mesma macroetapa é recusada', () => {
  const r = aplicarEvento(projeto('02'), mover('02'));
  assert.deepEqual(r, { ok: false, erro: 'O projeto já está nesta macroetapa.' });
});

test('voltar exige motivo; com motivo registra de/para', () => {
  const sem = aplicarEvento(projeto('03'), mover('02'));
  assert.equal(sem.ok === false && sem.erro, 'Para voltar de etapa, informe o motivo.');
  const com = aplicarEvento(projeto('03'), mover('02', { motivo: 'Revisão de escopo' }));
  assert.ok(com.ok);
  if (com.ok) {
    assert.equal(com.projeto.macroetapa, '02');
    assert.equal(com.historico[0].de, '03');
    assert.equal(com.historico[0].para, '02');
    assert.equal(com.historico[0].motivo, 'Revisão de escopo');
    assert.equal(com.historico[0].id, 'P-1-2026-11-15T10:00:00Z-1');
  }
});

test('avançar uma etapa com requisitos cumpridos passa', () => {
  const r = aplicarEvento(projeto('01'), mover('02'));
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.historico[0].forcado, undefined);
});

test('pular etapa só com forçar e motivo', () => {
  const a = aplicarEvento(projeto('00'), mover('02'));
  assert.equal(a.ok === false && a.erro, 'Avançar mais de uma etapa exige forçar com motivo.');
  const b = aplicarEvento(projeto('00'), mover('02', { forcar: true }));
  assert.equal(b.ok === false && b.erro, 'Avançar mais de uma etapa exige forçar com motivo.');
  const c = aplicarEvento(projeto('00'), mover('02', { forcar: true, motivo: 'Urgência' }));
  assert.ok(c.ok);
  if (c.ok) assert.equal(c.historico[0].forcado, true);
});

test('portões de cada etapa (textos exatos)', () => {
  const vazio = projeto('00', {
    nome: '', orgao: null, origem_valor: null, tem_projeto: false, tipo_contratacao: null,
    valores: { ...projeto('00').valores, obra: null, total: null, executado: null },
    recurso: { ...projeto('00').recurso, origem: 'FEDERAL', termo_compromisso: false },
    datas: { ...projeto('00').datas, pecas_tecnicas: null, contratacao: null, mobilizacao: null },
  });
  assert.deepEqual(portaoPara(vazio, '00'), []);
  assert.deepEqual(portaoPara(vazio, '01'), ['Nome do projeto', 'Órgão']);
  assert.deepEqual(portaoPara(vazio, '02'), ['Valor da obra', 'Origem do valor', 'Data de entrega das peças técnicas']);
  assert.deepEqual(portaoPara(vazio, '03'), ['Projeto elaborado (tem projeto = sim)', 'Termo de compromisso do recurso federal']);
  assert.deepEqual(portaoPara(vazio, '04'), ['Tipo de contratação', 'Data prevista de contratação']);
  assert.deepEqual(portaoPara(vazio, '05'), ['Data prevista de mobilização']);
  assert.deepEqual(portaoPara(vazio, '06'), ['Valor executado']);
  assert.deepEqual(portaoPara({ ...vazio, recurso: { ...vazio.recurso, origem: null } }, '03'), ['Projeto elaborado (tem projeto = sim)', 'Origem do recurso']);
  assert.deepEqual(portaoPara(projeto('00'), '03'), []);
});

test('faltando requisito bloqueia e lista; forçar com motivo libera', () => {
  const p = projeto('04', { datas: { ...projeto('04').datas, mobilizacao: null } });
  const r = aplicarEvento(p, mover('05'));
  assert.ok(!r.ok);
  if (!r.ok) {
    assert.equal(r.erro, 'Faltam requisitos para avançar.');
    assert.deepEqual(r.faltando, ['Data prevista de mobilização']);
  }
  const f = aplicarEvento(p, mover('05', { forcar: true, motivo: 'Data a confirmar' }));
  assert.ok(f.ok);
  if (f.ok) assert.equal(f.historico[0].forcado, true);
  assert.ok(!aplicarEvento(p, mover('05', { forcar: true })).ok);
});

test('macroetapa null vai para qualquer etapa só com motivo', () => {
  assert.ok(!aplicarEvento(projeto(null), mover('03')).ok);
  const r = aplicarEvento(projeto(null), mover('03', { motivo: 'Classificação inicial' }));
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.historico[0].de, null);
});

test('pendência aprovada remove e gera histórico', () => {
  const r = aplicarEvento(projeto('02'), { ...base, origem: 'pendencia', tipo: 'resolver_pendencia', pendencia: 'Falta ART', decisao: 'aprovada' });
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(r.projeto.pendencias, []);
    assert.equal(r.projeto.macroetapa, '02');
    assert.equal(r.historico[0].tipo, 'pendencia');
  }
});

test('pendência inexistente; reprovada exige motivo e volta uma etapa', () => {
  const nao = aplicarEvento(projeto('02'), { ...base, tipo: 'resolver_pendencia', pendencia: 'Outra', decisao: 'aprovada' });
  assert.equal(nao.ok === false && nao.erro, 'Pendência não encontrada.');
  const ev: Evento = { ...base, tipo: 'resolver_pendencia', pendencia: 'Falta ART', decisao: 'reprovada' };
  assert.ok(!aplicarEvento(projeto('02'), ev).ok);
  const r = aplicarEvento(projeto('02'), { ...ev, motivo: 'Documento inválido' });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.projeto.macroetapa, '01');
    assert.deepEqual(r.projeto.pendencias, ['Falta ART']);
    assert.equal(r.historico[0].de, '02');
    assert.equal(r.historico[0].para, '01');
  }
  const zero = aplicarEvento(projeto('00'), { ...ev, motivo: 'x' });
  assert.ok(zero.ok);
  if (zero.ok) {
    assert.equal(zero.projeto.macroetapa, '00');
    assert.equal(zero.historico[0].para, undefined);
  }
});

test('registrar passo atualiza a data sem mudar a etapa', () => {
  const r = aplicarEvento(projeto('02'), { ...base, origem: 'ficha', tipo: 'registrar_passo', descricao: 'Reunião com a SEINFRA', data: '2026-11-14' });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.projeto.macroetapa, '02');
    assert.equal(r.projeto.atualizacao.data, '2026-11-14');
    assert.equal(r.historico[0].tipo, 'passo');
    assert.equal(r.historico[0].descricao, 'Reunião com a SEINFRA');
  }
});

test('atualizar campos: permitidos, aninhados, antes/depois', () => {
  const r = aplicarEvento(projeto('02'), { ...base, origem: 'ficha', tipo: 'atualizar_campos', campos: { bairro: 'Centro', 'datas.contratacao': '2026-09-01', nome: 'Projeto de teste' } });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.projeto.bairro, 'Centro');
    assert.equal(r.projeto.datas.contratacao, '2026-09-01');
    assert.deepEqual(r.historico[0].campos, [
      { campo: 'bairro', antes: null, depois: 'Centro' },
      { campo: 'datas.contratacao', antes: '2026-06-01', depois: '2026-09-01' },
    ]);
  }
});

test('atualizar campos: proibidos e macroetapa', () => {
  const e = (campos: Record<string, unknown>): Evento => ({ ...base, tipo: 'atualizar_campos', campos });
  const m = aplicarEvento(projeto('02'), e({ macroetapa: '03' }));
  assert.equal(m.ok === false && m.erro, 'Use a movimentação de etapa para mudar a macroetapa.');
  const x = aplicarEvento(projeto('02'), e({ id: 'P-9' }));
  assert.equal(x.ok === false && x.erro, 'Campo não editável: id');
  assert.equal((aplicarEvento(projeto('02'), e({ 'por_ano.2026': 1 })) as any).erro, 'Campo não editável: por_ano.2026');
  assert.equal((aplicarEvento(projeto('02'), e({ 'valores.__proto__': 1 })) as any).erro, 'Campo não editável: valores.__proto__');
});

test('valor ou prioridade sem motivo é recusado; com motivo passa', () => {
  const e = (campos: Record<string, unknown>, motivo?: string): Evento => ({ ...base, tipo: 'atualizar_campos', campos, motivo });
  assert.equal((aplicarEvento(projeto('02'), e({ 'valores.obra': 2000 })) as any).erro, 'Mudança de valor ou prioridade exige motivo.');
  assert.equal((aplicarEvento(projeto('02'), e({ prioridade: 'Baixa' })) as any).erro, 'Mudança de valor ou prioridade exige motivo.');
  assert.ok(aplicarEvento(projeto('02'), e({ 'valores.obra': 2000 }, 'Reajuste')).ok);
});

test('nada mudou: Nenhuma alteração.', () => {
  const r = aplicarEvento(projeto('02'), { ...base, tipo: 'atualizar_campos', campos: { nome: 'Projeto de teste', 'valores.obra': 1000 } });
  assert.equal(r.ok === false && r.erro, 'Nenhuma alteração.');
});

test('a entrada nunca é mutada', () => {
  const p = projeto('02');
  const antes = structuredClone(p);
  aplicarEvento(p, mover('03'));
  aplicarEvento(p, { ...base, tipo: 'atualizar_campos', campos: { bairro: 'X', 'datas.contratacao': '2030-01-01' } });
  aplicarEvento(p, { ...base, tipo: 'resolver_pendencia', pendencia: 'Falta ART', decisao: 'aprovada' });
  aplicarEvento(p, { ...base, tipo: 'registrar_passo', descricao: 'x', data: '2030-01-01' });
  assert.deepEqual(p, antes);
});

test('aplicarEventos aplica em sequência com ids únicos e não muta a carteira', () => {
  const carteira = { projetos: [projeto('01')] };
  const antes = structuredClone(carteira);
  const r = aplicarEventos(carteira, [mover('02'), { ...base, tipo: 'registrar_passo', descricao: 'ok', data: '2026-11-15' }]);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.carteira.projetos[0].macroetapa, '02');
    assert.equal(r.historico.length, 2);
    assert.notEqual(r.historico[0].id, r.historico[1].id);
  }
  assert.deepEqual(carteira, antes);
  const falha = aplicarEventos(carteira, [mover('01')]);
  assert.ok(!falha.ok);
});

test('criarProjeto: sem nome ou órgão é recusado e lista o que falta', () => {
  const ctx = { autor: 'Ana', em: '2026-11-15T10:00:00Z', proximoCodigo: 15, origem: 'ficha' as const };
  const r = criarProjeto({ nome: '  ', orgao: '' }, ctx);
  assert.deepEqual(r, { ok: false, erro: 'Faltam dados obrigatórios.', faltando: ['Nome do projeto', 'Órgão'] });
  const so = criarProjeto({ nome: 'Ponte', orgao: '' }, ctx);
  assert.ok(!so.ok && so.faltando.length === 1 && so.faltando[0] === 'Órgão');
});

test('criarProjeto: id, macroetapa 00, compromisso padrão, pendências e histórico criado', () => {
  const ctx = { autor: 'Ana', em: '2026-11-15T10:00:00Z', proximoCodigo: 15, origem: 'ficha' as const };
  const r = criarProjeto({ nome: ' Nova UBS ', orgao: 'SMS' }, ctx);
  assert.ok(r.ok);
  assert.equal(r.projeto.id, 'P-15');
  assert.equal(r.projeto.codigo_legado, 15);
  assert.equal(r.projeto.nome, 'Nova UBS');
  assert.equal(r.projeto.macroetapa, '00');
  assert.equal(r.projeto.compromisso, 'ideia');
  assert.deepEqual(r.projeto.origem, { aba: 'CADASTRO', linha: 0 });
  assert.deepEqual(r.projeto.sei, []);
  assert.deepEqual(r.projeto.por_ano, {});
  assert.equal(r.projeto.valores.obra, null);
  assert.equal(r.projeto.recurso.origem, null);
  assert.equal(r.projeto.datas.encerramento, null);
  assert.deepEqual(r.projeto.pendencias, ['Sem região', 'Sem valor de obra', 'Sem origem do valor']);
  assert.equal(r.historico.length, 1);
  assert.equal(r.historico[0].tipo, 'criado');
  assert.equal(r.historico[0].descricao, 'Projeto incluído no cadastro');
  assert.equal(r.historico[0].projeto_id, 'P-15');
  assert.deepEqual(r.historico[0].campos?.map((c) => c.campo), ['nome', 'orgao', 'compromisso']);
  assert.ok(r.historico[0].campos!.every((c) => c.antes === null));
});

test('criarProjeto: campos preenchidos entram sem pendências e compromisso inválido vira ideia', () => {
  const ctx = { autor: 'Ana', em: '2026-11-15T10:00:00Z', proximoCodigo: 2, origem: 'ficha' as const };
  const base = projeto('00');
  const r = criarProjeto(
    { nome: 'Ponte', orgao: 'SEINFRA', regiao: 'Norte', origem_valor: 'Estimativa', compromisso: 'condicionado', valores: { ...base.valores, obra: 500, total: null, executado: null }, sei: ['26.1.000000001-2'] },
    ctx,
  );
  assert.ok(r.ok);
  assert.deepEqual(r.projeto.pendencias, []);
  assert.equal(r.projeto.compromisso, 'condicionado');
  assert.ok(r.historico[0].campos!.some((c) => c.campo === 'valores.obra' && c.depois === 500));
  const x = criarProjeto({ nome: 'A', orgao: 'B', compromisso: 'qualquer' as any }, ctx);
  assert.ok(x.ok && x.projeto.compromisso === 'ideia');
});
