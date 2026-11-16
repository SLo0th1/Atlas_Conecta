process.env.GOVNEXA_EXEMPLO = '1';
// Testes das obras sem localização (fora do mapa).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Carteira, Projeto } from '../../src/lib/carteira/tipos.ts';
import type { GeoBairros } from '../../src/lib/mapa/geo.ts';
import { obrasSemLocalizacao } from '../../src/lib/mapa/pendentes.ts';

const carteira = JSON.parse(readFileSync('data/exemplo/carteira/carteira.json', 'utf8')) as Carteira;
const geo: GeoBairros = { bairros: { Centro: { busca: 'Centro', lat: -16.68, lng: -49.25, encontrado: true }, Fantasma: { busca: 'Fantasma', encontrado: false } } };

function proj(id: string, nome: string, bairro: string | null, loc: Projeto['localizacao'] = null): Projeto {
  const p = JSON.parse(JSON.stringify(carteira.projetos[0])) as Projeto;
  return { ...p, id, nome, orgao: 'SEINFRA', bairro, localizacao: loc };
}
const cart = (...projetos: Projeto[]): Carteira => ({ ...carteira, projetos });

test('só entram projetos fora do mapa, agrupados e ordenados por nome', () => {
  const r = obrasSemLocalizacao(cart(
    proj('P-1', 'Zeta', 'Fantasma'),
    proj('P-2', 'Alfa', 'Fantasma'),
    proj('P-3', 'Beta', null),
    proj('P-4', 'Gama', 'Inexistente'),
    proj('P-5', 'Delta', '   '),
  ), geo);
  assert.deepEqual(r.bairroNaoEncontrado.map((g) => g.bairro), ['Fantasma', 'Inexistente']);
  assert.deepEqual(r.bairroNaoEncontrado[0].projetos.map((p) => p.id), ['P-2', 'P-1']);
  assert.deepEqual(r.semBairro.map((p) => p.id), ['P-3', 'P-5']);
});

test('bairro encontrado e localização cadastrada não entram', () => {
  const ponto = { tipo: 'ponto' as const, ponto: { lat: -16.68, lng: -49.25 }, endereco: null };
  const r = obrasSemLocalizacao(cart(proj('P-1', 'A', 'Centro'), proj('P-2', 'B', 'Fantasma', ponto), proj('P-3', 'C', null, ponto)), geo);
  assert.deepEqual(r, { bairroNaoEncontrado: [], semBairro: [] });
});

test('carteira de exemplo roda sem erro', () => {
  const r = obrasSemLocalizacao(carteira, geo);
  assert.ok(Array.isArray(r.semBairro));
});
