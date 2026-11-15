// MODO SIMULAÇÃO da localização (navegador): nada vai ao servidor. A localização fica em sessionStorage e o registro
// usa o mesmo formato do histórico de alterações (aparece na tela "Histórico de alterações" com o selo de simulação).
import { AUTOR_SIMULACAO, CHAVE_LOG_SIMULACAO } from '../carteira/simulacao.ts';
import { validarLocalizacao } from './geo.ts';
import type { Localizacao } from './tipos.ts';

export const CHAVE_LOCALIZACAO_SIMULACAO = 'govnexa-localizacao-simulacao';
const LIMITE_LOG = 200;

export function lerLocalizacoesSimuladas(): Record<string, Localizacao> {
  const saida: Record<string, Localizacao> = {};
  try {
    const bruto = JSON.parse(sessionStorage.getItem(CHAVE_LOCALIZACAO_SIMULACAO) || '{}');
    if (bruto && typeof bruto === 'object') {
      for (const [id, loc] of Object.entries(bruto)) if (validarLocalizacao(loc).length === 0) saida[id] = loc as Localizacao;
    }
  } catch {
    /* sem sessionStorage ou JSON inválido: sem simulação */
  }
  return saida;
}

export const descricaoLocalizacao = (l: Localizacao): string =>
  l.tipo === 'ponto' ? 'Localização cadastrada: ponto' : `Localização cadastrada: ${l.trechos.length} ${l.trechos.length === 1 ? 'trecho' : 'trechos'}`;

/** Guarda a localização simulada do projeto e o registro no log de simulação. Devolve false se o navegador não permitir. */
export function guardarLocalizacaoSimulada(projetoId: string, projetoNome: string | null, loc: Localizacao, em: string = new Date().toISOString()): boolean {
  try {
    const atuais = lerLocalizacoesSimuladas();
    atuais[projetoId] = loc;
    sessionStorage.setItem(CHAVE_LOCALIZACAO_SIMULACAO, JSON.stringify(atuais));
    const log = JSON.parse(sessionStorage.getItem(CHAVE_LOG_SIMULACAO) || '[]');
    const lista: unknown[] = Array.isArray(log) ? log : [];
    const registro = {
      id: `${projetoId}-${em}-1`,
      projeto_id: projetoId,
      projeto_nome: projetoNome,
      tipo: 'localizacao_alterada',
      origem: 'cadastro',
      autor: AUTOR_SIMULACAO,
      em,
      descricao: descricaoLocalizacao(loc),
      simulado: true,
    };
    sessionStorage.setItem(CHAVE_LOG_SIMULACAO, JSON.stringify([...lista, registro].slice(-LIMITE_LOG)));
    return true;
  } catch {
    return false;
  }
}
