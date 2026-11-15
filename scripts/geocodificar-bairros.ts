// Geocodificação aproximada por bairro (centro do bairro) via OpenStreetMap Nominatim. Roda À MÃO; nunca no build.
// Uso: node scripts/geocodificar-bairros.ts [--carteira <carteira.json>] [--saida <geo-bairros.json>] [--refazer]
// Padrão: a carteira ativa (mesmo caminho de caminhoCarteira()) e geo-bairros.json NA MESMA PASTA dela.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { caminhoCarteira } from '../src/lib/carteira/carga.ts';
import type { Carteira } from '../src/lib/carteira/tipos.ts';
import { expandirBairro, semTipoDeBairro, GOIANIA, dentroDeGoiania, type GeoBairro } from '../src/lib/mapa/geo.ts';

const FONTE = 'OpenStreetMap Nominatim (© colaboradores do OpenStreetMap, ODbL)';
const ESPERA_MS = 1100;

function argumento(nome: string): string | null {
  const i = process.argv.indexOf(nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}
const dormir = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const cinco = (n: number): number => Math.round(n * 1e5) / 1e5;

async function consultar(busca: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(`${busca}, Goiânia, Goiás`)}`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'GovNexa-importador/1.0' } });
  if (!resp.ok) throw new Error(`Nominatim respondeu ${resp.status}`);
  const lista = (await resp.json()) as { lat?: string; lon?: string }[];
  const r = lista[0];
  if (!r) return null;
  const p = { lat: Number(r.lat), lng: Number(r.lon) };
  return Number.isFinite(p.lat) && Number.isFinite(p.lng) && dentroDeGoiania(p) ? { lat: cinco(p.lat), lng: cinco(p.lng) } : null;
}

const arqCarteira = resolve(argumento('--carteira') ?? caminhoCarteira());
const arqSaida = resolve(argumento('--saida') ?? join(dirname(arqCarteira), 'geo-bairros.json'));
const refazer = process.argv.includes('--refazer');
/** Consulta de novo só os bairros marcados como não encontrados (mantém os achados). */
const refazerFaltantes = process.argv.includes('--refazer-faltantes');

const carteira = JSON.parse(readFileSync(arqCarteira, 'utf8')) as Carteira;
const bairros = [...new Set(carteira.projetos.map((p) => (p.bairro ?? '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

let existentes: Record<string, GeoBairro> = {};
if (existsSync(arqSaida) && !refazer) {
  try { existentes = (JSON.parse(readFileSync(arqSaida, 'utf8')) as { bairros?: Record<string, GeoBairro> }).bairros ?? {}; } catch { existentes = {}; }
}

const resultado: Record<string, GeoBairro> = {};
let consultas = 0;
for (const nome of bairros) {
  if (existentes[nome] && (existentes[nome].encontrado || !refazerFaltantes)) { resultado[nome] = existentes[nome]; continue; }
  let busca = expandirBairro(nome);
  if (consultas > 0) await dormir(ESPERA_MS);
  consultas++;
  let p = await consultar(busca);
  // Segunda tentativa só com o nome, sem o tipo do começo ("Bairro Santa Genoveva" → "Santa Genoveva").
  const curto = p ? null : semTipoDeBairro(busca);
  if (curto) { await dormir(ESPERA_MS); consultas++; p = await consultar(curto); if (p) busca = curto; }
  resultado[nome] = p ? { busca, lat: p.lat, lng: p.lng, encontrado: true } : { busca, encontrado: false };
}

const ordenado: Record<string, GeoBairro> = {};
for (const k of Object.keys(resultado).sort((a, b) => a.localeCompare(b, 'pt-BR'))) {
  const g = resultado[k];
  ordenado[k] = g.encontrado ? { busca: g.busca, encontrado: true, lat: g.lat, lng: g.lng } : { busca: g.busca, encontrado: false };
}
const saida = { bairros: ordenado, fonte: FONTE, gerado_em: new Date().toISOString() };
writeFileSync(arqSaida, JSON.stringify(saida, null, 2) + '\n', 'utf8');

const achados = Object.values(ordenado).filter((g) => g.encontrado).length;
console.log(`Bairros: ${achados} encontrados de ${bairros.length} (${consultas} consultas novas). Caixa de Goiânia: lat ${GOIANIA.caixa.latMin}..${GOIANIA.caixa.latMax}, lng ${GOIANIA.caixa.lngMin}..${GOIANIA.caixa.lngMax}.`);
console.log(`Gravado em ${arqSaida}`);
