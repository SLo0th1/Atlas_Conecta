// Leitura dos Cronogramas detalhados. Mesma ordem de procura da carteira:
// GOVNEXA_DADOS_DIR/cronogramas.json → .govnexa-dados/<IBGE>/cronogramas.json → data/exemplo/cronogramas/cronogramas.json.
// Na Fase 3 esta leitura passa para o repositório com banco (src/lib/repositorio), sem mudar as telas.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { municipioAtivo } from '../municipio-ativo.ts';
import type { Cronogramas } from './tipos.ts';

export function caminhoCronogramas(): string {
  const ibge = String(municipioAtivo().codigo_ibge);
  const candidatos = [
    process.env.GOVNEXA_DADOS_DIR ? join(process.env.GOVNEXA_DADOS_DIR, 'cronogramas.json') : null,
    join(process.cwd(), '.govnexa-dados', ibge, 'cronogramas.json'),
    join(process.cwd(), 'data', 'exemplo', 'cronogramas', 'cronogramas.json'),
  ].filter((c): c is string => !!c);
  const achado = candidatos.find((c) => existsSync(c));
  if (!achado) throw new Error('Cronogramas não encontrados (nem dados reais nem exemplo).');
  return achado;
}

let cache: Cronogramas | null = null;
export function carregarCronogramas(): Cronogramas {
  if (!cache) cache = JSON.parse(readFileSync(caminhoCronogramas(), 'utf8')) as Cronogramas;
  return cache;
}
