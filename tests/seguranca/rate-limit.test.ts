// Testes do limitador de tentativas de login (vetores 6 e 9).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chavesDe, registrarFalha, registrarSucesso, segundosBloqueado } from '../../lib/rate-limit.ts';

const pedido = (ip: string) => new Request('https://exemplo.test/api/login', { method: 'POST', headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` } });

test('libera até a 4ª falha e bloqueia a partir da 5ª', () => {
  const chaves = chavesDe(pedido('203.0.113.10'), 'alguem@exemplo.com');
  const t0 = 1_000_000;
  for (let i = 0; i < 4; i++) registrarFalha(chaves, t0 + i);
  assert.equal(segundosBloqueado(chaves, t0 + 10), 0);
  registrarFalha(chaves, t0 + 20);
  assert.ok(segundosBloqueado(chaves, t0 + 30) > 0, 'deveria estar bloqueado');
});

test('o bloqueio cresce a cada falha adicional e tem teto de 1 hora', () => {
  const chaves = chavesDe(pedido('203.0.113.11'), 'outro@exemplo.com');
  const t0 = 5_000_000;
  for (let i = 0; i < 5; i++) registrarFalha(chaves, t0);
  const primeiro = segundosBloqueado(chaves, t0);
  registrarFalha(chaves, t0);
  const segundo = segundosBloqueado(chaves, t0);
  assert.ok(segundo > primeiro, 'o segundo bloqueio deveria ser maior');
  for (let i = 0; i < 30; i++) registrarFalha(chaves, t0);
  assert.ok(segundosBloqueado(chaves, t0) <= 3600, 'teto de 1 hora');
});

test('o bloqueio expira e as falhas antigas deixam de contar', () => {
  const chaves = chavesDe(pedido('203.0.113.12'), 'x@exemplo.com');
  const t0 = 9_000_000;
  for (let i = 0; i < 5; i++) registrarFalha(chaves, t0);
  assert.ok(segundosBloqueado(chaves, t0 + 1000) > 0);
  assert.equal(segundosBloqueado(chaves, t0 + 2 * 60 * 60 * 1000), 0);
});

test('login correto zera a contagem', () => {
  const chaves = chavesDe(pedido('203.0.113.13'), 'y@exemplo.com');
  for (let i = 0; i < 5; i++) registrarFalha(chaves, 1);
  registrarSucesso(chaves);
  assert.equal(segundosBloqueado(chaves, 2), 0);
});

test('um e-mail diferente do mesmo IP também é bloqueado (força bruta por IP)', () => {
  const t0 = 20_000_000;
  const a = chavesDe(pedido('203.0.113.14'), 'a@exemplo.com');
  for (let i = 0; i < 5; i++) registrarFalha(a, t0);
  const b = chavesDe(pedido('203.0.113.14'), 'b@exemplo.com');
  assert.ok(segundosBloqueado(b, t0 + 1) > 0);
});

test('tentativas em outro IP e outro e-mail não são afetadas', () => {
  const t0 = 30_000_000;
  for (let i = 0; i < 5; i++) registrarFalha(chavesDe(pedido('203.0.113.15'), 'c@exemplo.com'), t0);
  assert.equal(segundosBloqueado(chavesDe(pedido('203.0.113.99'), 'd@exemplo.com'), t0 + 1), 0);
});
