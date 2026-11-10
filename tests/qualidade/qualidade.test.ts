// Testes da classificação de qualidade dos dados (regra do dono: sempre sinalizar dados defasados e o motivo).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classificar } from '../../src/lib/dados/qualidade.ts';

test('dentro do limite: em dia', () => {
  assert.equal(classificar(0, 3, false), 'Em dia');
  assert.equal(classificar(3, 3, false), 'Em dia');
});
test('acima do limite: defasada; acima de 2x: muito defasada', () => {
  assert.equal(classificar(4, 3, false), 'Atenção: defasada');
  assert.equal(classificar(6, 3, false), 'Atenção: defasada');
  assert.equal(classificar(7, 3, false), 'Vencido: muito defasada');
});
test('falha na coleta aparece mesmo com dado recente, e o muito defasado prevalece', () => {
  assert.equal(classificar(1, 3, true), 'Atenção: falha na coleta');
  assert.equal(classificar(10, 3, true), 'Vencido: muito defasada');
});
test('sem carga nunca é tratado como em dia', () => {
  assert.equal(classificar(null, 3, false), 'Sem carga');
  assert.equal(classificar(null, 3, true), 'Sem carga');
});
