// Contrato do repositório de dados: as telas e a API falam só com esta interface (JSON hoje, PostgreSQL depois).
import type { Evento, RegistroHistorico } from '../carteira/movimentacao.ts';
import type { Projeto } from '../carteira/tipos.ts';
import type { Cronograma } from '../cronograma/tipos.ts';
import type { RegistroLog } from '../log/tipos.ts';

export type ResultadoAplicacao =
  | { ok: true; historico: RegistroHistorico[] }
  | { ok: false; erro: string; faltando?: string[] };

export type ResultadoCriacaoProjeto =
  | { ok: true; projeto: Projeto; historico: RegistroHistorico[] }
  | { ok: false; erro: string; faltando?: string[] };

export interface RepositorioProjetos {
  podeGravar: boolean;
  listarProjetos(): Promise<Projeto[]>;
  obterProjeto(id: string): Promise<Projeto | null>;
  historico(projetoId: string): Promise<RegistroHistorico[]>;
  /** Todos os registros do histórico de alterações (inclui importações), mais recentes primeiro. */
  listarHistorico(): Promise<RegistroLog[]>;
  aplicar(e: Evento): Promise<ResultadoAplicacao>;
  /** Cadastra um projeto novo na macroetapa 00 (grava só com o banco configurado). */
  criarProjeto(dados: Partial<Projeto> & { nome: string; orgao: string }, autor: string): Promise<ResultadoCriacaoProjeto>;
  listarCronogramas(): Promise<Cronograma[]>;
}
