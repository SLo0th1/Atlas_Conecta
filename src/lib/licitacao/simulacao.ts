// MODO SIMULAÇÃO: licitações carregadas nesta aba (a partir da página do SEI salva pela pessoa).
// Fica em sessionStorage e some ao fechar a aba. Cada item é validado ao ler: dado adulterado é descartado.
import type { AndamentoSei, DocumentoSei, ProcessoSei } from '../sei/tipos.ts';

export const CHAVE_LICITACOES = 'govnexa-licitacoes-simulacao';
export const LIMITE_LICITACOES = 10;
const MAX_LINHAS = 5_000;

const texto = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const textoOuNulo = (v: unknown, max: number): boolean => v === null || texto(v, max);
const DIA_FORMATO = /^\d{4}-\d{2}-\d{2}$/;
/** Data de calendário real (31/02 não passa). */
const DIA = {
  test: (v: string): boolean => {
    if (!DIA_FORMATO.test(v)) return false;
    const t = Date.parse(`${v}T12:00:00Z`);
    return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v;
  },
};
const DIA_HORA = { test: (v: string): boolean => /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(v) && DIA.test(v.slice(0, 10)) };
const NUMERO_PROCESSO = /^[0-9][0-9./-]{0,39}$/;
const numOuNulo = (v: unknown): boolean => v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 1_000_000);

function documentoValido(d: unknown): d is DocumentoSei {
  if (!d || typeof d !== 'object') return false;
  const x = d as Record<string, unknown>;
  return texto(x.numero, 30) && /^\d+$/.test(x.numero) && texto(x.tipo, 300) && (x.data === null || (texto(x.data, 10) && DIA.test(x.data))) && texto(x.unidade, 120) && typeof x.publico === 'boolean';
}

function andamentoValido(a: unknown): a is AndamentoSei {
  if (!a || typeof a !== 'object') return false;
  const x = a as Record<string, unknown>;
  return texto(x.dataHora, 16) && DIA_HORA.test(x.dataHora) && texto(x.unidade, 120) && texto(x.descricao, 2_000);
}

/** true se o objeto tem exatamente a forma de um processo lido (só os campos conhecidos são copiados depois). */
export function processoValido(p: unknown): p is ProcessoSei {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
  const x = p as Record<string, unknown>;
  return (
    (x.numero === null || (texto(x.numero, 40) && NUMERO_PROCESSO.test(x.numero))) &&
    textoOuNulo(x.tipo, 200) &&
    (x.geradoEm === null || (texto(x.geradoEm, 10) && DIA.test(x.geradoEm))) &&
    numOuNulo(x.totalDocumentos) &&
    numOuNulo(x.totalAndamentos) &&
    Array.isArray(x.documentos) && x.documentos.length <= MAX_LINHAS && x.documentos.every(documentoValido) &&
    Array.isArray(x.andamentos) && x.andamentos.length <= MAX_LINHAS && x.andamentos.every(andamentoValido)
  );
}

/** Cópia só com os campos conhecidos (nada a mais passa adiante). A descrição dos andamentos não é guardada:
 * esta tela não a usa e ela pode citar servidores. */
export function copiaLimpa(p: ProcessoSei): ProcessoSei {
  return {
    numero: p.numero,
    tipo: p.tipo,
    geradoEm: p.geradoEm,
    totalDocumentos: p.totalDocumentos,
    totalAndamentos: p.totalAndamentos,
    documentos: p.documentos.map(({ numero, tipo, data, unidade, publico }) => ({ numero, tipo, data, unidade, publico })),
    andamentos: p.andamentos.map(({ dataHora, unidade }) => ({ dataHora, unidade, descricao: '' })),
  };
}

export function lerLicitacoes(): ProcessoSei[] {
  try {
    const bruto = sessionStorage.getItem(CHAVE_LICITACOES);
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista)) return [];
    return lista.slice(0, LIMITE_LICITACOES).filter(processoValido).map(copiaLimpa);
  } catch {
    return [];
  }
}

/** Guarda; o processo com o mesmo número substitui o anterior (é a versão mais nova da página). false = navegador não deixou. */
export function guardarLicitacoes(lista: ProcessoSei[]): boolean {
  try {
    sessionStorage.setItem(CHAVE_LICITACOES, JSON.stringify(lista.slice(0, LIMITE_LICITACOES)));
    return true;
  } catch {
    return false;
  }
}
