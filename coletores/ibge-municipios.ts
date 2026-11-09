// Coletor T4: tabela mestre de municípios (IBGE). Executar: node coletores/ibge-municipios.ts
// Fonte oficial: servicodados.ibge.gov.br (localidades v1 e agregados v3, tabela 6579, variável 9324).
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://servicodados.ibge.gov.br/api';
const URLS = {
  municipios: `${BASE}/v1/localidades/municipios`,
  regioesMetropolitanas: `${BASE}/v1/localidades/regioes-metropolitanas`,
  populacao: `${BASE}/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N6[all]`,
};

// Códigos IBGE das 26 capitais estaduais + Brasília (lista oficial, estável).
const CAPITAIS = new Set([
  1200401, 2704302, 1600303, 1302603, 2927408, 2304400, 5300108, 3205309, 5208707, 2111300,
  5103403, 5002704, 3106200, 1501402, 2507507, 4106902, 2611606, 2211001, 3304557, 2408102,
  4314902, 1100205, 1400100, 4205407, 3550308, 2800308, 1721000,
]);

async function baixar(url: string) {
  const resposta = await fetch(url, { headers: { accept: 'application/json' } });
  if (!resposta.ok) throw new Error(`${url} respondeu ${resposta.status}`);
  const texto = await resposta.text();
  return { texto, hash: createHash('sha256').update(texto).digest('hex'), coleta: new Date().toISOString() };
}

const [mun, rm, pop] = await Promise.all([
  baixar(URLS.municipios),
  baixar(URLS.regioesMetropolitanas),
  baixar(URLS.populacao),
]);

const municipios = JSON.parse(mun.texto) as any[];
const regioes = JSON.parse(rm.texto) as any[];
const serie = (JSON.parse(pop.texto)[0].resultados[0].series as any[]);
const anoReferencia = Object.keys(serie[0].serie)[0];
const populacaoPorId = new Map(serie.map((s) => [Number(s.localidade.id), Number(s.serie[anoReferencia])]));

const rmPorMunicipio = new Map<number, { id: string; nome: string }>();
for (const r of regioes) for (const m of r.municipios) rmPorMunicipio.set(m.id, { id: r.id, nome: r.nome });

const idCarga = `ibge-${new Date().toISOString().slice(0, 10)}`;
const proveniencia = {
  fonte: 'IBGE — Localidades (v1) e Estimativas de População (SIDRA 6579)',
  url_origem: URLS,
  data_referencia: { populacao: anoReferencia },
  data_coleta: mun.coleta,
  id_carga: idCarga,
  hash_arquivo: { municipios: mun.hash, regioesMetropolitanas: rm.hash, populacao: pop.hash },
};

const registros = municipios.map((m) => {
  const uf = m.microrregiao?.mesorregiao?.UF ?? m['regiao-imediata']?.['regiao-intermediaria']?.UF;
  return {
    codigo_ibge: m.id,
    nome: m.nome,
    uf: uf?.sigla ?? null,
    regiao: uf?.regiao?.sigla ?? null,
    regiao_imediata: m['regiao-imediata']?.nome ?? null,
    regiao_metropolitana: rmPorMunicipio.get(m.id) ?? null,
    capital: CAPITAIS.has(m.id),
    populacao: populacaoPorId.get(m.id) ?? null,
  };
});

await mkdir('data/core', { recursive: true });
await mkdir('data/raw', { recursive: true });
await writeFile('data/core/ibge-municipios.json', JSON.stringify({ proveniencia, municipios: registros }) + '\n');
await writeFile(`data/raw/${idCarga}-municipios.json`, mun.texto);

const capitais = registros.filter((r) => r.capital).length;
console.log(`municípios: ${registros.length} · capitais: ${capitais} · população ref. ${anoReferencia}`);
const goiania = registros.find((r) => r.codigo_ibge === 5208707);
console.log('Goiânia:', JSON.stringify(goiania));
