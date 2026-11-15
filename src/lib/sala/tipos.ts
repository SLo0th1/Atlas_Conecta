// Contrato de dados da Sala de guerra (GovNexa), segundo o PMI: missão ou crise com objetivo e prazo claros,
// responsável, reuniões curtas e frequentes e quadro RAID (riscos, ações, problemas, decisões).
// Mesma regra da carteira: valor ausente é null; datas ISO 'AAAA-MM-DD'; papéis em vez de nomes nos exemplos.

export type TipoSala = 'missao' | 'crise';
export type SituacaoSala = 'aberta' | 'em_andamento' | 'resolvida' | 'encerrada';
export type Cadencia = 'diaria' | 'duas_por_semana' | 'semanal';
/** 1 = equipe, 2 = secretário, 3 = gabinete/prefeito. */
export type Escalonamento = 1 | 2 | 3;

export type TipoRaid = 'risco' | 'acao' | 'problema' | 'decisao';
export type SituacaoRaid = 'aberto' | 'em_andamento' | 'concluido' | 'cancelado';

export interface ItemRaid {
  id: string;
  tipo: TipoRaid;
  descricao: string;
  responsavel: string | null;
  prazo: string | null;
  situacao: SituacaoRaid;
  criado_em: string;
  impacto?: 'baixo' | 'medio' | 'alto';
  probabilidade?: 'baixa' | 'media' | 'alta';
}

export interface ReuniaoSala {
  data: string;
  pauta: string[];
  decisoes: string[];
  encaminhamentos: string[];
}

export interface MarcoSala {
  data: string;
  descricao: string;
  feito: boolean;
}

export interface Sala {
  id: string; // 'S-<n>'
  tipo: TipoSala;
  titulo: string;
  objetivo: string;
  projetos: string[]; // ids da carteira (P-<ID>)
  dono: string; // papel
  equipe: string[]; // papéis
  aberta_em: string;
  prazo: string;
  cadencia: Cadencia;
  escalonamento: Escalonamento;
  situacao: SituacaoSala;
  motivo_abertura: string;
  raid: ItemRaid[];
  reunioes: ReuniaoSala[];
  marcos: MarcoSala[];
  resultado?: string;
  licoes?: string[];
}

export interface Salas {
  prefeitura_id: number;
  fonte: { ficticio: boolean; importado_em: string };
  salas: Sala[];
}

export const ROTULO_TIPO_SALA: Record<TipoSala, string> = { missao: 'Missão', crise: 'Crise' };
export const ROTULO_SITUACAO_SALA: Record<SituacaoSala, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  resolvida: 'Resolvida',
  encerrada: 'Encerrada',
};
export const ROTULO_CADENCIA: Record<Cadencia, string> = {
  diaria: 'Reunião diária',
  duas_por_semana: 'Reunião duas vezes por semana',
  semanal: 'Reunião semanal',
};
export const ROTULO_ESCALONAMENTO: Record<Escalonamento, string> = {
  1: 'Nível 1: equipe',
  2: 'Nível 2: secretário(a)',
  3: 'Nível 3: gabinete',
};
export const ROTULO_SITUACAO_RAID: Record<SituacaoRaid, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};
