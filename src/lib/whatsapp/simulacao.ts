// MODO SIMULAÇÃO dos números do WhatsApp (navegador): nada vai ao servidor e nada é enviado.
// A lista fica em sessionStorage (some ao fechar a aba); cada item é validado ao ler (dado adulterado é descartado).
import { LIMITE_CONTATOS } from './permissoes.ts';
import type { Contato } from './tipos.ts';

export const CHAVE_WHATSAPP_SIMULACAO = 'govnexa-whatsapp-simulacao';

/** Lista guardada nesta aba; sem nada guardado (ou guardado inválido), devolve `padrao`. */
export function lerContatos(padrao: Contato[], valido: (c: unknown, outros: Contato[]) => boolean): Contato[] {
  try {
    const bruto = sessionStorage.getItem(CHAVE_WHATSAPP_SIMULACAO);
    if (bruto === null) return padrao;
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista)) return padrao;
    const saida: Contato[] = [];
    for (const c of lista.slice(0, LIMITE_CONTATOS)) {
      if (!valido(c, saida)) continue;
      if (saida.some((x) => x.id === (c as Contato).id)) continue; // id repetido: fica o primeiro
      saida.push(c as Contato);
    }
    // Guardado vazio de propósito = lista vazia; guardado com itens mas todos inválidos = volta aos exemplos.
    return saida.length === 0 && lista.length > 0 ? padrao : saida;
  } catch {
    return padrao;
  }
}

/** Guarda a lista; false se o navegador não permitir. */
export function guardarContatos(lista: Contato[]): boolean {
  try {
    sessionStorage.setItem(CHAVE_WHATSAPP_SIMULACAO, JSON.stringify(lista.slice(0, LIMITE_CONTATOS)));
    return true;
  } catch {
    return false;
  }
}
