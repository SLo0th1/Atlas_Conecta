// Leitura do histórico de alterações. Mesma ordem de procura da carteira: GOVNEXA_DADOS_DIR/historico.json →
// .govnexa-dados/<IBGE>/historico.json → data/exemplo/historico/historico.json (fictício, versionado).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { municipioAtivo } from '../municipio-ativo.ts';
import type { RegistroLog } from './tipos.ts';

export function caminhoHistorico(): string | null {
  const ibge = String(municipioAtivo().codigo_ibge);
  const candidatos = [
    process.env.GOVNEXA_DADOS_DIR ? join(process.env.GOVNEXA_DADOS_DIR, 'historico.json') : null,
    join(process.cwd(), '.govnexa-dados', ibge, 'historico.json'),
    join(process.cwd(), 'data', 'carga-real', ibge, 'historico.json'),
    join(process.cwd(), 'data', 'exemplo', 'historico', 'historico.json'),
  ].filter((c): c is string => !!c);
  if (process.env.GOVNEXA_EXEMPLO === '1') candidatos.splice(0, candidatos.length - 1);
  return candidatos.find((c) => existsSync(c)) ?? null;
}

let cache: { registros: RegistroLog[] } | null = null;
export function carregarHistorico(): { registros: RegistroLog[] } {
  if (!cache) {
    const caminho = caminhoHistorico();
    cache = caminho ? (JSON.parse(readFileSync(caminho, 'utf8')) as { registros: RegistroLog[] }) : { registros: [] };
    if (!Array.isArray(cache.registros)) cache = { registros: [] };
  }
  return cache;
}
