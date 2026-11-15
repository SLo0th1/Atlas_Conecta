// Ajudantes do MODO SIMULAÇÃO da Sala de guerra (navegador): nada é gravado no servidor; o registro vai para a
// sessionStorage no mesmo formato do histórico de alterações e aparece na tela "Histórico de alterações" com o selo de simulação.
import type { Sala } from './tipos.ts';
import { AUTOR_SIMULACAO, CHAVE_LOG_SIMULACAO } from '../carteira/simulacao.ts';

export const AVISO_SIMULACAO_SALA = 'Modo simulação: nada é gravado até o banco de dados ser configurado.';
export type TipoRegistroSala = 'sala_aberta' | 'sala_reuniao' | 'sala_item' | 'sala_encerrada' | 'sala_projeto_incluido' | 'sala_projeto_retirado';

const LIMITE = 200;

/** Guarda um registro de simulação da sala na sessão do navegador. Devolve false se a sessão não estiver disponível. */
export function registrarSimulacaoSala(tipo: TipoRegistroSala, projetoId: string, projetoNome: string | null, descricao: string, motivo = ''): boolean {
  try {
    const atual = JSON.parse(sessionStorage.getItem(CHAVE_LOG_SIMULACAO) || '[]');
    const lista: unknown[] = Array.isArray(atual) ? atual : [];
    const em = new Date().toISOString();
    const registro = {
      id: `sala-${projetoId}-${em}-${lista.length + 1}`,
      projeto_id: projetoId,
      projeto_nome: projetoNome,
      tipo,
      origem: 'ficha',
      autor: AUTOR_SIMULACAO,
      em,
      descricao,
      ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
      simulado: true,
    };
    sessionStorage.setItem(CHAVE_LOG_SIMULACAO, JSON.stringify([...lista, registro].slice(-LIMITE)));
    return true;
  } catch {
    return false;
  }
}

export type SalaMinima = Pick<Sala, 'id' | 'titulo' | 'projetos'>;
export interface RegistroProjetoSala {
  tipo: 'sala_projeto_incluido' | 'sala_projeto_retirado';
  projeto_id: string;
  descricao: string;
  motivo: string;
}
export type ResultadoProjetoSala<S extends SalaMinima> = { ok: true; sala: S; registro: RegistroProjetoSala } | { ok: false; erro: string };

/** Inclui um projeto na sala (sem alterar a sala recebida). Motivo opcional. */
export function incluirProjetoNaSala<S extends SalaMinima>(sala: S, projetoId: string, motivo = ''): ResultadoProjetoSala<S> {
  if (sala.projetos.includes(projetoId)) return { ok: false, erro: 'Projeto já está na sala.' };
  return {
    ok: true,
    sala: { ...sala, projetos: [...sala.projetos, projetoId] },
    registro: { tipo: 'sala_projeto_incluido', projeto_id: projetoId, descricao: `Projeto incluído na sala de guerra "${sala.titulo}".`, motivo: motivo.trim() },
  };
}

/** Retira um projeto da sala (sem alterar a sala recebida). Motivo obrigatório; a sala mantém ao menos um projeto. */
export function retirarProjetoDaSala<S extends SalaMinima>(sala: S, projetoId: string, motivo: string): ResultadoProjetoSala<S> {
  if (!sala.projetos.includes(projetoId)) return { ok: false, erro: 'Projeto não está na sala.' };
  if (!motivo.trim()) return { ok: false, erro: 'Informe o motivo para retirar.' };
  if (sala.projetos.length <= 1) return { ok: false, erro: 'A sala precisa de ao menos um projeto.' };
  return {
    ok: true,
    sala: { ...sala, projetos: sala.projetos.filter((id) => id !== projetoId) },
    registro: { tipo: 'sala_projeto_retirado', projeto_id: projetoId, descricao: `Projeto retirado da sala de guerra "${sala.titulo}".`, motivo: motivo.trim() },
  };
}
