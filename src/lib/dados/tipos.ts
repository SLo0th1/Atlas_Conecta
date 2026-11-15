// Tipos compartilhados das guias do bloco Captação.
import type { Detalhe } from './detalhes.ts';

/** Guia no mesmo formato de src/data/modules.json, com detalhe opcional por linha e a nota de fonte. */
export type Modulo = {
  slug: string;
  title: string;
  group: string;
  columns: string[];
  rows: (string | number)[][];
  fields: string[];
  source: string;
  fonte?: string;
  /** true quando os dados são fictícios de exemplo (some o selo "dados reais"). */
  ficticio?: boolean;
  detalhes?: Detalhe[];
  /** Texto de busca oculto por linha (a busca da tabela também olha este texto). */
  busca?: string[];
};
