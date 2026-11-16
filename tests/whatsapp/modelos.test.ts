// Testes dos modelos de mensagem para aprovação da Meta.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MODELOS_META, preencherModelo, validarModelo, type ModeloMeta } from '../../src/lib/whatsapp/modelos.ts';

const base = (): ModeloMeta => JSON.parse(JSON.stringify(MODELOS_META[1]));

test('os 3 modelos são válidos e têm nomes únicos', () => {
  assert.equal(MODELOS_META.length, 3);
  for (const m of MODELOS_META) assert.deepEqual(validarModelo(m), [], m.nome);
  assert.equal(new Set(MODELOS_META.map((m) => m.nome)).size, 3);
});

test('cada regra recusa um caso ruim', () => {
  const casos: [string, (m: ModeloMeta) => void][] = [
    ['nome', (m) => { m.nome = 'Nome Ruim'; }],
    ['corpo longo', (m) => { m.corpo = 'a'.repeat(1025); m.exemplos = []; }],
    ['sequência', (m) => { m.corpo = 'Oi {{1}} e {{3}} fim.'; m.exemplos = ['a', 'b']; }],
    ['começa com variável', (m) => { m.corpo = '{{1}} oi fim.'; m.exemplos = ['a']; }],
    ['termina com variável', (m) => { m.corpo = 'Oi fim {{1}}'; m.exemplos = ['a']; }],
    ['exemplos', (m) => { m.exemplos = ['a']; }],
    ['rodapé', (m) => { m.rodape = 'x'.repeat(61); }],
    ['4 botões', (m) => { m.botoes = [1, 2, 3, 4].map((i) => ({ tipo: 'QUICK_REPLY' as const, texto: `B${i}` })); }],
    ['botão longo', (m) => { m.botoes = [{ tipo: 'QUICK_REPLY', texto: 'x'.repeat(26) }]; }],
  ];
  for (const [nome, mudar] of casos) {
    const m = base();
    mudar(m);
    assert.ok(validarModelo(m).length > 0, nome);
  }
});

test('preencherModelo troca as variáveis', () => {
  const m = MODELOS_META[2];
  assert.equal(preencherModelo(m, m.exemplos), 'Seu número foi autorizado no GovNexa para receber relatórios de projetos da Prefeitura (Gabinete do prefeito). Para parar de receber, responda SAIR.');
  assert.ok(!/\{\{/.test(preencherModelo(MODELOS_META[0], MODELOS_META[0].exemplos)));
});
