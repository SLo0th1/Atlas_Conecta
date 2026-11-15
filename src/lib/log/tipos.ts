// Tipos do histórico de alterações (log) do GovNexa. A tela, o CSV, o importador e o banco usam estes rótulos.
import type { OrigemEvento, RegistroHistorico } from '../carteira/movimentacao.ts';

/** Tipos do motor ('passo', 'pendencia'...) mais os que só o log conhece ('criado', 'removido', 'carga'). */
export type TipoAcaoLog = RegistroHistorico['tipo'] | 'registrar_passo' | 'resolver_pendencia' | 'criado' | 'removido' | 'carga';

/** Registro do log: o histórico do motor, com tipos extras, nome do projeto e marca de simulação (não gravado). */
export type RegistroLog = Omit<RegistroHistorico, 'tipo'> & {
  tipo: TipoAcaoLog;
  projeto_nome?: string | null;
  simulado?: boolean;
};

export const ROTULO_ACAO: Record<TipoAcaoLog, string> = {
  mover_macroetapa: 'Mudança de etapa',
  registrar_passo: 'Passo registrado',
  passo: 'Passo registrado',
  resolver_pendencia: 'Pendência resolvida',
  pendencia: 'Pendência resolvida',
  atualizar_campos: 'Campos alterados',
  criado: 'Projeto incluído',
  removido: 'Projeto retirado da planilha',
  carga: 'Carga da planilha',
};

export const ROTULO_ORIGEM: Record<OrigemEvento, string> = {
  kanban: 'Kanban',
  ficha: 'Ficha do projeto',
  pendencia: 'Pendências de etapa',
  sei: 'SEI',
  importacao: 'Importação da planilha',
};

/** Tipos de ação que aparecem no filtro (cada rótulo uma vez). */
export const ACOES_FILTRO: TipoAcaoLog[] = ['mover_macroetapa', 'registrar_passo', 'resolver_pendencia', 'atualizar_campos', 'criado', 'removido', 'carga'];
