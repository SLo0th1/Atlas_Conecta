// Testes do repositório: JSON (somente leitura) e PostgreSQL com cliente falso (sem banco).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Evento } from '../../src/lib/carteira/movimentacao.ts';
import { criarRepositorioJson } from '../../src/lib/repositorio/json.ts';
import { criarRepositorioPostgres } from '../../src/lib/repositorio/postgres.ts';
import type { ClienteSql } from '../../src/lib/repositorio/postgres.ts';
import { carregarCarteira } from '../../src/lib/carteira/carga.ts';

const base = { origem: 'ficha' as const, autor: 'Ana', em: '2026-11-15T10:00:00Z' };

test('JSON: lista os 14 projetos, não grava e historico é vazio', async () => {
  const repo = criarRepositorioJson();
  assert.equal(repo.podeGravar, false);
  assert.equal((await repo.listarProjetos()).length, 14);
  assert.equal((await repo.obterProjeto('P-900'))?.id, 'P-900');
  assert.equal(await repo.obterProjeto('nao-existe'), null);
  assert.deepEqual(await repo.historico('P-900'), []);
  assert.equal((await repo.listarCronogramas()).length, 2);
});

test('JSON: evento válido -> Gravação indisponível; inválido -> erro da regra', async () => {
  const repo = criarRepositorioJson();
  const valido: Evento = { ...base, projeto_id: 'P-900', tipo: 'registrar_passo', descricao: 'Passo', data: '2026-11-15' };
  assert.deepEqual(await repo.aplicar(valido), { ok: false, erro: 'Gravação indisponível: o banco de dados ainda não foi configurado.' });
  const atual = (await repo.obterProjeto('P-900'))!.macroetapa!;
  const invalido: Evento = { ...base, projeto_id: 'P-900', tipo: 'mover_macroetapa', para: atual };
  assert.deepEqual(await repo.aplicar(invalido), { ok: false, erro: 'O projeto já está nesta macroetapa.' });
});

function clienteFalso() {
  const chamadas: { sql: string; params: unknown[] }[] = [];
  const projeto = structuredClone(carregarCarteira().projetos[0]);
  const cliente: ClienteSql = {
    async query(sql, params) {
      chamadas.push({ sql, params });
      if (/FOR UPDATE/.test(sql)) return { rows: [projeto] };
      return { rows: [] };
    },
  };
  return { cliente, chamadas, projeto };
}

test('Postgres: transação, set_config da prefeitura e valor malicioso só em params', async () => {
  const { cliente, chamadas, projeto } = clienteFalso();
  const repo = criarRepositorioPostgres(cliente, 5208707);
  const malicioso = "x'); DROP TABLE projeto; --";
  const r = await repo.aplicar({ ...base, projeto_id: projeto.id, tipo: 'atualizar_campos', campos: { nome: malicioso } });
  assert.ok(r.ok);
  assert.equal(chamadas[0].sql, 'BEGIN');
  assert.match(chamadas[1].sql, /set_config\('app\.prefeitura_id', \$1, true\)/);
  assert.deepEqual(chamadas[1].params, ['5208707']);
  assert.equal(chamadas.at(-1)!.sql, 'COMMIT');
  assert.ok(chamadas.some((c) => /^UPDATE projeto/.test(c.sql)));
  assert.ok(chamadas.some((c) => /^\s*INSERT INTO evento_projeto/.test(c.sql)));
  for (const c of chamadas) assert.ok(!c.sql.includes(malicioso) && !c.sql.includes('DROP TABLE'), c.sql);
  assert.ok(chamadas.some((c) => c.params.includes(malicioso)));
});

test('Postgres: leituras também abrem transação com set_config; regra inválida faz COMMIT sem gravar', async () => {
  const { cliente, chamadas, projeto } = clienteFalso();
  const repo = criarRepositorioPostgres(cliente, 5208707);
  await repo.listarProjetos();
  assert.deepEqual(chamadas.map((c) => c.sql.split(' ')[0]), ['BEGIN', 'SELECT', 'SELECT', 'COMMIT']);
  chamadas.length = 0;
  const r = await repo.aplicar({ ...base, projeto_id: projeto.id, tipo: 'mover_macroetapa', para: projeto.macroetapa! });
  assert.deepEqual(r, { ok: false, erro: 'O projeto já está nesta macroetapa.'});
  assert.ok(!chamadas.some((c) => /^UPDATE|INSERT/.test(c.sql.trim())));
});

test('Postgres: erro no meio da gravação faz ROLLBACK', async () => {
  const { chamadas, projeto } = clienteFalso();
  const falho: ClienteSql = {
    async query(sql, params) {
      chamadas.push({ sql, params });
      if (/FOR UPDATE/.test(sql)) return { rows: [projeto] };
      if (/^UPDATE/.test(sql)) throw new Error('falha simulada');
      return { rows: [] };
    },
  };
  const repo = criarRepositorioPostgres(falho, 5208707);
  await assert.rejects(repo.aplicar({ ...base, projeto_id: projeto.id, tipo: 'registrar_passo', descricao: 'x', data: '2026-11-15' }));
  assert.equal(chamadas.at(-1)!.sql, 'ROLLBACK');
});

test('JSON: listarHistorico traz o histórico de exemplo, mais recentes primeiro', async () => {
  const repo = criarRepositorioJson();
  const h = await repo.listarHistorico();
  assert.ok(h.length >= 20);
  for (let i = 1; i < h.length; i++) assert.ok(h[i - 1].em >= h[i].em);
  assert.ok(h.some((r) => r.tipo === 'carga' && r.projeto_id === '*'));
  assert.ok(h.some((r) => r.projeto_id === 'P-900' && r.projeto_nome));
});

test('Postgres: listarHistorico e historico leem a visão log_alteracoes só com parâmetros e dentro da transação', async () => {
  const chamadas: { sql: string; params: unknown[] }[] = [];
  const linha = { id: 'x-1', projeto_id: 'P-900', projeto_nome: 'Projeto Exemplo', tipo: 'atualizar_campos', origem: 'ficha', autor: 'Pessoa Fictícia 1', em: new Date('2026-11-01T12:00:00Z'), de: null, para: null, campos: [{ campo: 'nome', antes: 'A', depois: 'B' }], motivo: null, forcado: null, descricao: null };
  const cliente: ClienteSql = {
    async query(sql, params) {
      chamadas.push({ sql, params });
      return { rows: /FROM log_alteracoes/.test(sql) ? [linha] : [] };
    },
  };
  const repo = criarRepositorioPostgres(cliente, 5208707);
  const todos = await repo.listarHistorico();
  assert.equal(todos.length, 1);
  assert.equal(todos[0].em, '2026-11-01T12:00:00.000Z');
  assert.equal(todos[0].projeto_nome, 'Projeto Exemplo');
  assert.deepEqual(todos[0].campos, [{ campo: 'nome', antes: 'A', depois: 'B' }]);
  const consulta = chamadas.find((c) => /FROM log_alteracoes/.test(c.sql))!;
  assert.match(consulta.sql, /WHERE prefeitura_id = \$1 ORDER BY em DESC/);
  assert.deepEqual(consulta.params, [5208707]);
  assert.equal(chamadas[0].sql, 'BEGIN');
  assert.equal(chamadas.at(-1)!.sql, 'COMMIT');

  chamadas.length = 0;
  const malicioso = "P-1'; DROP TABLE evento_sistema; --";
  const porProjeto = await repo.historico(malicioso);
  assert.equal(porProjeto.length, 1);
  const c2 = chamadas.find((c) => /FROM log_alteracoes/.test(c.sql))!;
  assert.match(c2.sql, /projeto_id = \$2/);
  assert.deepEqual(c2.params, [5208707, malicioso]);
  for (const c of chamadas) assert.ok(!c.sql.includes('DROP TABLE'), c.sql);
});
