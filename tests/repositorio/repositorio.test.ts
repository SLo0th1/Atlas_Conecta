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
