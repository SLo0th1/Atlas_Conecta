// Contrato de dados dos Cronogramas detalhados (GovNexa, Fase 2 — leitura).
// Fonte inicial: planilha do GEPP (uma aba por projeto). Mesma regra da carteira: ausente = null; datas ISO 'AAAA-MM-DD'.

/** Situação calculada da etapa (regra: status é calculado, não digitado). */
export type StatusEtapa = 'concluida' | 'atrasada' | 'em_andamento' | 'inicio_atrasado' | 'a_fazer';

export interface EtapaCronograma {
  ordem: number; // posição dentro do cronograma (1, 2, 3...)
  nome: string;
  fase: string; // nome da fase/macro (linha-título acima da etapa na planilha)
  unidade: string | null; // área responsável (ex.: 'SECAP/GEPP', 'PGM', 'SANEAGO')
  responsavel: string | null; // pessoa; só nos dados privados (no público vira 'Responsável N' ou null)
  situacao_planilha: string | null; // texto da coluna SITUAÇÃO, preservado
  duracao_prevista: number | null; // dias
  inicio_previsto: string | null;
  fim_previsto: string | null;
  inicio_real: string | null;
  fim_real: string | null;
  status: StatusEtapa; // calculado pelo importador na data da importação (as telas recalculam pela data do build)
  ciclo: number | null; // 2 para "2ª entrega", "2ª validação" etc.; null quando não é retrabalho
  pendencias: string[]; // problemas de dado (texto simples)
  origem: { aba: string; linha: number };
}

export interface FaseCronograma {
  nome: string;
  ordem: number;
  etapas: EtapaCronograma[];
}

export interface Cronograma {
  id: string; // 'C-' + slug do nome da aba
  aba: string;
  titulo: string; // linha 1 da aba
  endereco: string | null; // linha 2
  sei: string[]; // números normalizados encontrados na linha 3
  projeto_id: string | null; // id do projeto da carteira (P-<ID>) quando casado
  casamento: 'sei' | 'nome' | null;
  fases: FaseCronograma[];
  pendencias: string[];
}

export interface FonteCronogramas {
  arquivo: string;
  hash: string;
  importado_em: string;
  ficticio: boolean;
  anonimizado?: boolean;
}

export interface Cronogramas {
  prefeitura_id: number;
  fonte: FonteCronogramas;
  cronogramas: Cronograma[];
}
