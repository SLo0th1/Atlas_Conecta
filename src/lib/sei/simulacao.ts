// MODO SIMULAÇÃO dos links do SEI (navegador): o link colado em cada projeto fica em sessionStorage (some ao fechar a aba).
// Com o banco de dados, o link vai para a ficha do projeto e o servidor relê a página uma vez por dia.
import { validarLinkSei } from './link.ts';

export const CHAVE_SEI_SIMULACAO = 'govnexa-sei-simulacao';
export const LIMITE_VINCULOS = 500;
const ID_PROJETO = /^P-[A-Za-z0-9_-]{1,40}$/;

export type Vinculos = Record<string, string>; // id do projeto → link público validado

/** Lê os vínculos desta aba. Item inválido (id estranho ou link que não passa na validação) é descartado. */
export function lerVinculos(): Vinculos {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SEI_SIMULACAO);
    if (!bruto) return {};
    const obj = JSON.parse(bruto);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
    const saida: Vinculos = Object.create(null);
    for (const [id, link] of Object.entries(obj).slice(0, LIMITE_VINCULOS)) {
      if (!ID_PROJETO.test(id)) continue;
      const r = validarLinkSei(link);
      if (r.ok) saida[id] = r.url;
    }
    return saida;
  } catch {
    return {};
  }
}

/** Guarda os vínculos; false se o navegador não permitir. */
export function guardarVinculos(v: Vinculos): boolean {
  try {
    sessionStorage.setItem(CHAVE_SEI_SIMULACAO, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
}
