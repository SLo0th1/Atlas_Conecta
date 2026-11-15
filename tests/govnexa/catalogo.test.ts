// Testes do catálogo de módulos, da marca e do município ativo do GovNexa (Fase 0).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import modules from '../../src/data/modules.json' with { type: 'json' };
import { GRUPO_PARA_MODULO, catalogoCompleto, menuPorModulo } from '../../src/lib/govnexa/catalogo.ts';
import { nomeDaMarca } from '../../src/lib/marca.ts';
import { municipioAtivo } from '../../src/lib/municipio-ativo.ts';

test('todo grupo de modules.json tem módulo', () => {
  for (const g of new Set(modules.map((m) => m.group))) assert.ok(GRUPO_PARA_MODULO[g], `grupo sem módulo: ${g}`);
});
test('catálogo completo sem slug repetido, com projetos e gestao', () => {
  const slugs = catalogoCompleto(modules).map((m) => m.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(slugs.includes('projetos'));
  assert.ok(slugs.includes('gestao'));
});
test('menu por módulo na ordem esperada', () => {
  assert.deepEqual(menuPorModulo(catalogoCompleto(modules)).map((m) => m.id), ['projetos', 'captacao', 'licitacoes', 'gestao', 'conta']);
});
test('nome da marca', () => {
  assert.equal(nomeDaMarca(true), 'GovNexa');
  assert.equal(nomeDaMarca(false), 'Atlas Goiânia Conecta');
});
test('município ativo', () => {
  const m = municipioAtivo();
  assert.equal(m.codigo_ibge, 5208707);
  assert.equal(m.nomeExibicao, 'Prefeitura Municipal de Goiânia');
});
