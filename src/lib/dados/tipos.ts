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
  detalhes?: Detalhe[];
  /** Texto de busca oculto por linha (a busca da tabela também olha este texto). */
  busca?: string[];
};
