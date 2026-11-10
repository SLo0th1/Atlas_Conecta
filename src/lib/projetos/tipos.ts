// Tipos da guia Projetos (docs/projetos-ia.md). Sem armazenamento: tudo aqui é estrutura em memória.

export type Gravidade = 'bloqueante' | 'alerta' | 'informativo';
export type Resultado = 'ok' | 'falha' | 'sem_dado';

export type TipoSecao = 'identificacao' | 'diagnostico' | 'justificativa' | 'objeto' | 'metas' | 'indicadores' | 'cronograma' | 'contrapartida' | 'outros';
export type TipoAnexo = 'projeto_basico' | 'termo_referencia' | 'certidao' | 'declaracao' | 'comprovante_contrapartida' | 'outro';

export interface Bloco {
  texto: string;
  origem: 'humano' | 'ia';
  /** Só importa para origem 'ia': texto de IA precisa de revisão humana (R16). */
  revisado: boolean;
}

/** Número citado no texto. `rotulo` liga o número a uma Citacao (ex.: 'F1'); sem rótulo = número sem fonte. */
export interface NumeroNoTexto {
  texto: string;
  rotulo?: string;
}

export interface Secao {
  tipo: TipoSecao;
  blocos: Bloco[];
  numeros?: NumeroNoTexto[];
}

export interface Citacao {
  rotulo: string;
  conjunto: string;
  valorCitado: string | number;
  /** Valor hoje no dado oficial; null/ausente = não foi possível conferir. */
  valorAtual?: string | number | null;
  /** ISO. Entra na verificação de frescor (R18). */
  dataColeta?: string;
}

export interface Meta {
  id: string;
  descricao: string;
  unidade?: string;
  quantidade?: number;
  /** Mês final da meta (1 = primeiro mês do projeto). */
  prazoMes?: number;
}

export interface Indicador {
  id: string;
  metaId: string;
  descricao: string;
  /** null/'' = faltando; o marcador "[DADO NÃO DISPONÍVEL NA FONTE OFICIAL]" = alerta. */
  linhaBase?: string | number | null;
  valorAlvo?: string | number | null;
}

export interface Etapa {
  id: string;
  metaId: string;
  descricao: string;
  mesInicio: number;
  mesFim: number;
}

export interface Parcela {
  etapaId: string;
  mes: number;
  valorRepasse: number;
  valorContrapartida: number;
}

export interface Anexo {
  tipo: TipoAnexo;
  nome: string;
}

export interface Aprovacao {
  nome: string;
  cargo: string;
  /** ISO (aaaa-mm-dd). */
  data: string;
  /** Hash do conteúdo no momento da aprovação (ver hashConteudo). */
  hashConteudo?: string;
}

export interface Projeto {
  /** Marca explícita para exemplos fictícios. */
  ficticio?: boolean;
  id: string;
  titulo: string;
  programaCodigo: string;
  secretaria?: string;
  /** Valor global do projeto (repasse + contrapartida). */
  valorGlobal?: number;
  emendaIndicada?: 'sim' | 'nao' | 'nao_sei';
  /** O objeto envolve obra ou serviço de engenharia (exige projeto básico / termo de referência). */
  objetoObraOuServico?: boolean;
  secoes: Secao[];
  metas: Meta[];
  indicadores: Indicador[];
  etapas: Etapa[];
  parcelas: Parcela[];
  anexos: Anexo[];
  /** Ciência/justificativa de alertas, por id de regra (ex.: { R12: 'texto' }). Não entra no hash. */
  justificativas?: Record<string, string>;
  aprovacao?: Aprovacao;
}

// ----- Contexto (dados oficiais e requisitos confirmados) -----

export interface ItemCauc {
  item: string;
  descricao?: string;
  /** Valores do coletor: regular | vencido | pendente | indisponivel | sem_informacao | desconhecido. */
  situacao: string;
  /** ISO. */
  validade?: string | null;
}

export interface ContextoCauc {
  situacaoGeral: string;
  itens: ItemCauc[];
  dataReferencia?: string;
  dataColeta?: string;
}

export interface ContextoSiconfi {
  exercicio?: number;
  receitaCorrenteLiquida?: number | null;
  despesaPessoalPctRcl?: number | null;
  limiteAlertaPct?: number | null;
  limitePrudencialPct?: number | null;
  limiteMaximoPct?: number | null;
  execucaoReceitaPct?: number | null;
  dataColeta?: string;
}

export interface ContextoPrograma {
  codigo: string;
  publico: string[];
  ufs: string[];
  prazos: { proposta_ate: string | null; emendas_ate: string | null; beneficiario_especifico_ate: string | null };
  dataColeta?: string;
}

/** Requisitos do programa confirmados pela equipe da prefeitura (decisão do dono 4). Sem confirmação = não vale. */
export interface RequisitosPrograma {
  confirmadoPor?: string;
  confirmadoEm?: string;
  valorMin?: number;
  valorMax?: number;
  contrapartidaMinPct?: number;
  documentosExigidos?: TipoAnexo[];
}

export interface ContextoParecer {
  uf?: string;
  cauc?: ContextoCauc;
  siconfi?: ContextoSiconfi;
  programa?: ContextoPrograma;
  requisitos?: RequisitosPrograma;
  citacoes?: Citacao[];
}

// ----- Saída -----

export interface ResultadoRegra {
  id: string;
  titulo: string;
  gravidade: Gravidade;
  resultado: Resultado;
  mensagem: string;
  comoCorrigir: string;
  detalhes: string[];
}

export interface Parecer {
  versaoRegras: string;
  geradoEm: string;
  resultados: ResultadoRegra[];
  totalOk: number;
  totalRegras: number;
  percentual: number;
  bloqueantesPendentes: string[];
  alertasPendentes: string[];
  alertasJustificados: string[];
  completo: boolean;
  aprovacaoRegistrada: boolean;
  prontoParaEnvio: boolean;
  /** O que falta para "pronto para envio", em português. */
  faltaParaEnvio: string[];
}
