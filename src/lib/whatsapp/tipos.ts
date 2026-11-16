// Contrato do WhatsApp da Gestão (Fase 5, em simulação): números autorizados, permissão de cada um e relatórios.
// Regra de segurança: toda resposta é montada SÓ com os projetos que a permissão libera (o filtro vem antes de qualquer texto;
// na versão real, antes de a IA receber os dados). Nunca entra o nome de pessoas (campo `responsavel` fica de fora).
import type { CodigoMacroetapa } from '../carteira/tipos.ts';

export type PerfilContato = 'prefeito' | 'secretario' | 'equipe' | 'personalizado';
export type Frequencia = 'semanal' | 'diario' | 'nenhum';
export type ModeloRelatorio = 'prioritarios' | 'resumo';
export type CorFarol = 'vermelho' | 'amarelo' | 'verde';

export interface Permissao {
  /** '*' = todos os órgãos; senão, as siglas liberadas (ao menos uma). */
  orgaos: '*' | string[];
  /** true = só projetos de prioridade Muito Alta e Alta. */
  somentePrioritarios: boolean;
  /** Projetos liberados além do filtro de órgão e prioridade (códigos 'P-...'). */
  projetosExtras: string[];
  /** false = valores em R$ nunca aparecem (nem no relatório nem nas respostas). */
  verValores: boolean;
  /** false = perguntas sobre convênios, emendas e captação são recusadas. */
  verCaptacao: boolean;
}

export interface ConfigRelatorio {
  frequencia: Frequencia;
  /** 1 = segunda ... 7 = domingo (só vale para 'semanal'). */
  diaSemana: number;
  /** 'HH:MM' (horário de Brasília). */
  hora: string;
  modelo: ModeloRelatorio;
}

export interface Contato {
  id: string;
  /** Cargo ou equipe (nunca o nome da pessoa). */
  rotulo: string;
  /** E.164 do Brasil, celular: '+55' + DDD + 9 + 8 dígitos. */
  telefone: string;
  ativo: boolean;
  perfil: PerfilContato;
  permissao: Permissao;
  relatorio: ConfigRelatorio;
}

/** O que o WhatsApp pode saber de um projeto (sem responsável, sem observações internas). */
export interface ProjetoWhats {
  id: string;
  nome: string;
  orgao: string | null;
  prioridade: string | null;
  macroetapa: CodigoMacroetapa | null;
  /** Rótulo da macroetapa ('05 – Em execução') ou 'Sem macroetapa'. */
  etapa: string;
  sei: string[];
  bairro: string | null;
  /** null quando a permissão não libera valores ou o dado não existe. */
  valor: number | null;
  /** Executado ÷ total (0 a 100, 1 casa) quando coerente; senão null. */
  percentual: number | null;
  encerramento: string | null;
  /** Fim previsto da macroetapa atual (para recalcular o farol no dia de hoje, no navegador). */
  fimEtapa: string | null;
  /** Quantidade de problemas de dado (o texto das pendências não sai daqui). */
  pendencias: number;
  farol: CorFarol;
  motivo: string;
}

/** Resumo dos convênios em execução (mesma fonte do Painel do prefeito). */
export interface CaptacaoWhats {
  emExecucao: number;
  pactuado: number;
  liberado: number;
  saldoALiberar: number;
  semDesembolso: number;
}
