// Tipos do mapa das obras (localização, trechos de rua e fotos). Funções puras em geo.ts; leitura de dados em obras.ts.
export interface PontoGeo { lat: number; lng: number }
export interface Trecho { rua: string; de: string | null; ate: string | null; linha: PontoGeo[] } // linha: 2+ pontos
export type Localizacao =
  | { tipo: 'ponto'; ponto: PontoGeo; endereco: string | null }
  | { tipo: 'trechos'; trechos: Trecho[] };
export interface Foto { id: string; url: string; legenda: string | null; data: string | null; capa: boolean }
export type CategoriaObra = 'saude' | 'educacao' | 'assistencia' | 'via' | 'ponte' | 'drenagem' | 'lazer' | 'cultura' | 'edificacao';
export type PrecisaoLocal = 'cadastrada' | 'bairro';
