// Contrato de dados da Carteira de Projetos (GovNexa, Fase 1).
// Mesma forma do modelo em docs/govnexa/modelo-dados.md; no MVP vem de JSON, na Fase 3 do PostgreSQL.
// Regra: valor ausente é null (nunca zero inventado). Datas em ISO 'AAAA-MM-DD'.

/** Códigos oficiais das macroetapas (nomes da aba PIPELINE da planilha). */
export type CodigoMacroetapa = '00' | '01' | '02' | '03' | '04' | '05' | '06';

export interface ValoresProjeto {
  projeto: number | null; // Valor Estimado Execução Projeto
  obra: number | null; // Valor Estimado Execução Obra
  executado: number | null;
  em_captacao: number | null;
  captado: number | null;
  contrapartida: number | null;
  custeio_municipio: number | null;
  total: number | null; // VALOR TOTAL
  com_solicitacao_financeira: number | null;
}

export interface RecursoProjeto {
  origem: string | null; // Federal, Municipal...
  tipo: string | null; // TIPO DO RECURSO
  situacao: string | null; // SITUAÇÃO (do recurso)
  fonte_programa: string | null;
  unidade_financiadora: string | null;
  sugestao_financiar: string | null;
  termo_compromisso: boolean | null;
  numero_termo: string | null;
}

/** Datas previstas de fim de cada macroetapa (colunas "Previsão ..." da planilha). */
export interface DatasProjeto {
  inicio: string | null; // chegada da demanda na SECAP
  pecas_tecnicas: string | null;
  planejamento: string | null;
  preparatorio: string | null;
  contratacao: string | null;
  mobilizacao: string | null;
  execucao_dias: number | null;
  encerramento: string | null;
}

export interface ValoresAno {
  subtotal: number | null;
  federal: number | null;
  municipal: number | null;
  outros: number | null;
}

/** Campos que só existem na aba BASE_OPERACIONAL (obras prioritárias da SEINFRA), quando casadas. */
export interface DadosOperacionais {
  id_base: string;
  casamento: 'sei' | 'nome';
  situacao: string | null;
  reuniao: string | null;
  providencias: string | null;
  previsao_entrega: string | null;
  ano: string | null;
  cronograma_fisico: Record<string, number | null>; // ano -> %
  cronograma_financeiro: Record<string, number | null>; // ano -> R$
  regioes: Record<string, number | null>; // região -> R$
}

export interface Projeto {
  id: string; // 'P-<ID da planilha>'
  codigo_legado: number;
  nome: string;
  orgao: string | null; // sigla
  responsavel: string | null; // pessoa (só dentro do sistema; nunca no repositório público)
  tipo: string | null; // OBRA INFRA, OBRA CIVIL, REFORMA, SERVIÇO
  detalhamento: string | null; // EDIFICAÇÃO, OAE, CORREDOR...
  sei: string[]; // números normalizados 'AA.N.NNNNNNNNN-D'
  observacao: string | null;
  macroetapa: CodigoMacroetapa | null;
  status_projeto: string | null;
  regiao: string | null;
  bairro: string | null;
  corredor: string | null;
  origem_valor: string | null;
  tem_projeto: boolean | null;
  prioridade: string | null; // Muito Alta, Alta, Média, Baixa...
  tipo_contratacao: string | null;
  orgao_contratacao: string | null;
  solicitacoes_financeiras: string | null;
  valores: ValoresProjeto;
  recurso: RecursoProjeto;
  datas: DatasProjeto;
  por_ano: Record<string, ValoresAno>; // '2026' | '2027' | '2028'
  atualizacao: { responsavel: string | null; data: string | null };
  operacional: DadosOperacionais | null;
  pendencias: string[]; // problemas de dado deste projeto, em português simples
  origem: { aba: string; linha: number };
}

export interface FonteCarteira {
  arquivo: string; // nome do arquivo importado (sem caminho)
  hash: string; // sha256 do arquivo
  importado_em: string; // ISO
  ficticio: boolean; // true = dados de exemplo
}

export interface Carteira {
  prefeitura_id: number; // código IBGE
  fonte: FonteCarteira;
  projetos: Projeto[];
}
