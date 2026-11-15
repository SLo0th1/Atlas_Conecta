// Leitura das salas de guerra. Mesma ordem de procura da carteira: GOVNEXA_DADOS_DIR/salas.json →
// .govnexa-dados/<IBGE>/salas.json → data/exemplo/sala-guerra/salas.json (fictício, versionado). Sem arquivo: nenhuma sala.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { municipioAtivo } from '../municipio-ativo.ts';
import type { Salas } from './tipos.ts';

export function caminhoSalas(): string | null {
  const ibge = String(municipioAtivo().codigo_ibge);
  const candidatos = [
    process.env.GOVNEXA_DADOS_DIR ? join(process.env.GOVNEXA_DADOS_DIR, 'salas.json') : null,
    join(process.cwd(), '.govnexa-dados', ibge, 'salas.json'),
    join(process.cwd(), 'data', 'exemplo', 'sala-guerra', 'salas.json'),
  ].filter((c): c is string => !!c);
  return candidatos.find((c) => existsSync(c)) ?? null;
}

let cache: Salas | null = null;
export function carregarSalas(): Salas {
  if (!cache) {
    const caminho = caminhoSalas();
    cache = caminho
      ? (JSON.parse(readFileSync(caminho, 'utf8')) as Salas)
      : { prefeitura_id: municipioAtivo().codigo_ibge, fonte: { ficticio: true, importado_em: '' }, salas: [] };
    if (!Array.isArray(cache.salas)) cache = { ...cache, salas: [] };
  }
  return cache;
}
