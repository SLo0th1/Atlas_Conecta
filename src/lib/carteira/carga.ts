// Leitura da Carteira de Projetos. Única porta de acesso aos dados (na Fase 3, troca para PostgreSQL sem mudar as telas).
// Ordem de procura: GOVNEXA_DADOS_DIR (pasta com carteira.json) → .govnexa-dados/<IBGE>/carteira.json (baixado do
// repositório privado no build) → data/exemplo/carteira/carteira.json (fictício, versionado).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { municipioAtivo } from '../municipio-ativo.ts';
import type { Carteira } from './tipos.ts';

export function caminhoCarteira(): string {
  const ibge = String(municipioAtivo().codigo_ibge);
  const candidatos = [
    process.env.GOVNEXA_DADOS_DIR ? join(process.env.GOVNEXA_DADOS_DIR, 'carteira.json') : null,
    join(process.cwd(), '.govnexa-dados', ibge, 'carteira.json'),
    join(process.cwd(), 'data', 'exemplo', 'carteira', 'carteira.json'),
  ].filter((c): c is string => !!c);
  const achado = candidatos.find((c) => existsSync(c));
  if (!achado) throw new Error('Carteira não encontrada (nem dados reais nem exemplo).');
  return achado;
}

let cache: Carteira | null = null;
export function carregarCarteira(): Carteira {
  if (!cache) cache = JSON.parse(readFileSync(caminhoCarteira(), 'utf8')) as Carteira;
  return cache;
}
