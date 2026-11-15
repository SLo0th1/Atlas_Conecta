// Contrato do repositório de dados: as telas e a API falam só com esta interface (JSON hoje, PostgreSQL depois).
import type { Evento, RegistroHistorico } from '../carteira/movimentacao.ts';
import type { Projeto } from '../carteira/tipos.ts';
import type { Cronograma } from '../cronograma/tipos.ts';

export type ResultadoAplicacao =
  | { ok: true; historico: RegistroHistorico[] }
  | { ok: false; erro: string; faltando?: string[] };

export interface RepositorioProjetos {
  podeGravar: boolean;
  listarProjetos(): Promise<Projeto[]>;
  obterProjeto(id: string): Promise<Projeto | null>;
  historico(projetoId: string): Promise<RegistroHistorico[]>;
  aplicar(e: Evento): Promise<ResultadoAplicacao>;
  listarCronogramas(): Promise<Cronograma[]>;
}
