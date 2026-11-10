// Camada de dados do bloco Captação.
// As telas usam SOMENTE estas funções. Hoje elas leem JSON (data/); na etapa do banco,
// troca-se a implementação por PostgreSQL (docs/esquema-postgres.sql) sem mudar as telas.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Proveniencia {
  fonte: string;
  url_origem: unknown;
  data_referencia: unknown;
  data_coleta: string;
  id_carga: string;
  hash_arquivo?: unknown;
}

export interface Municipio {
  codigo_ibge: number;
  nome: string;
  uf: string | null;
  regiao: string | null;
  regiao_imediata: string | null;
  regiao_metropolitana: { id: string; nome: string } | null;
  capital: boolean;
  populacao: number | null;
}

export interface FiltroMunicipios {
  uf?: string;
  capital?: boolean;
  regiaoMetropolitana?: string;
}

export interface Tema {
  id: string;
  nome: string;
  funcoes: { codigo: string; nome: string; subfuncoes: { codigo: string; nome: string }[] }[];
  orgaos_concedentes: string[];
  palavras_chave: string[];
  tipos_transferencia: string[];
}

export interface Secretaria {
  id: string;
  nome_generico: string;
  siglas_comuns: string[];
  temas: string[];
  funcoes_orcamentarias: string[];
  cnpjs_fundos: string[];
}

export interface CnpjCandidato {
  cnpj: string;
  razao_social: string;
  natureza_juridica: string;
  natureza_descricao: string;
  situacao_cadastral: string;
  status_validacao: 'pendente_validacao' | 'validado';
}

export type Documento = Record<string, any>;

/** Contrato único de acesso a dados. A versão PostgreSQL implementará esta mesma interface. */
export interface RepositorioCaptacao {
  obterMunicipio(codigoIbge: number): Municipio | undefined;
  listarMunicipios(filtro?: FiltroMunicipios): Municipio[];
  listarTemas(): Tema[];
  listarSecretarias(): Secretaria[];
  listarCnpjsCandidatos(codigoIbge: number): CnpjCandidato[];
  proveniencia(conjunto: 'ibge-municipios'): Proveniencia;
  /** Conjuntos coletados do município (Fase 1). Devolvem undefined se a carga ainda não foi executada. */
  acompanhamento(codigoIbge: number): Documento | undefined;
  programasAbertos(codigoIbge: number): Documento | undefined;
  cauc(codigoIbge: number): Documento | undefined;
  citacoesDou(codigoIbge: number): Documento | undefined;
  siconfi(codigoIbge: number): Documento | undefined;
  fns(codigoIbge: number): Documento | undefined;
  fnsCapitais(ano: number): Documento | undefined;
  educacao(codigoIbge: number): Documento | undefined;
  cnes(codigoIbge: number): Documento | undefined;
  saneamento(codigoIbge: number): Documento | undefined;
  /** Resultado da última execução de cada coletor (data/core/status-coletas.json). */
  statusColetas(): Documento | undefined;
}

const raiz = process.cwd();
const ler = <T>(caminho: string): T => JSON.parse(readFileSync(join(raiz, caminho), 'utf8')) as T;
const cache = new Map<string, unknown>();
const opcional = (caminho: string): Documento | undefined => {
  try {
    return unico<Documento>(caminho);
  } catch {
    return undefined; // carga ainda não executada
  }
};
const unico = <T>(caminho: string): T => {
  if (!cache.has(caminho)) cache.set(caminho, ler<T>(caminho));
  return cache.get(caminho) as T;
};

/** Implementação atual: arquivos JSON de data/core e data/config. */
export const repositorioJson: RepositorioCaptacao = {
  obterMunicipio: (codigoIbge) =>
    unico<{ municipios: Municipio[] }>('data/core/ibge-municipios.json').municipios.find((m) => m.codigo_ibge === codigoIbge),
  listarMunicipios: (filtro = {}) =>
    unico<{ municipios: Municipio[] }>('data/core/ibge-municipios.json').municipios.filter(
      (m) =>
        (filtro.uf === undefined || m.uf === filtro.uf) &&
        (filtro.capital === undefined || m.capital === filtro.capital) &&
        (filtro.regiaoMetropolitana === undefined || m.regiao_metropolitana?.id === filtro.regiaoMetropolitana),
    ),
  listarTemas: () => unico<{ temas: Tema[] }>('data/config/temas.json').temas,
  listarSecretarias: () => unico<{ secretarias: Secretaria[] }>('data/config/secretarias.json').secretarias,
  listarCnpjsCandidatos: (codigoIbge) => {
    try {
      return unico<{ cnpjs: CnpjCandidato[] }>(`data/core/cnpjs-candidatos-${codigoIbge}.json`).cnpjs;
    } catch {
      return []; // carga ainda não executada
    }
  },
  acompanhamento: (i) => opcional(`data/core/acompanhamento-${i}.json`),
  programasAbertos: (i) => opcional(`data/core/programas-abertos-${i}.json`),
  cauc: (i) => opcional(`data/core/cauc-${i}.json`),
  citacoesDou: (i) => opcional(`data/core/dou-citacoes-${i}.json`),
  siconfi: (i) => opcional(`data/core/siconfi-${i}.json`),
  fns: (i) => opcional(`data/core/fns-${i}.json`),
  fnsCapitais: (ano) => opcional(`data/core/fns-capitais-${ano}.json`),
  educacao: (i) => opcional(`data/core/educacao-${i}.json`),
  cnes: (i) => opcional(`data/core/cnes-${i}.json`),
  saneamento: (i) => opcional(`data/core/saneamento-${i}.json`),
  statusColetas: () => {
    const diario = opcional('data/core/status-coletas.json');
    const mensal = opcional('data/core/status-coletas-mensais.json');
    if (!diario && !mensal) return undefined;
    return { atualizado_em: mensal?.atualizado_em ?? diario?.atualizado_em, coletores: { ...(diario?.coletores ?? {}), ...(mensal?.coletores ?? {}) } };
  },
  proveniencia: (conjunto) => unico<{ proveniencia: Proveniencia }>(`data/core/${conjunto}.json`).proveniencia,
};

/** Ponto único de troca: quando houver banco, aponte aqui para a implementação PostgreSQL. */
export const dados: RepositorioCaptacao = repositorioJson;
