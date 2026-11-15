// Ajudantes do MODO SIMULAÇÃO da Reunião semanal (navegador): nada vai ao servidor. Os registros usam o mesmo formato do
// histórico de alterações e aparecem na tela "Histórico de alterações" com o selo de simulação.
import { AUTOR_SIMULACAO, CHAVE_LOG_SIMULACAO } from '../carteira/simulacao.ts';

export const AVISO_SIMULACAO_REUNIAO = 'Modo simulação: nada é gravado até o banco de dados ser configurado.';
const LIMITE = 200;

export interface AcaoReuniao {
  descricao: string;
  responsavel: string;
  prazo: string; // AAAA-MM-DD
}
export interface ItemDiscutido {
  projeto_id: string;
  projeto_nome: string;
  discussao: string;
  decisao: string;
  acoes: AcaoReuniao[];
}

export const dataBr = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** O que falta para registrar: pelo menos um projeto discutido e toda ação com descrição, responsável e prazo. Lista vazia = pode registrar. */
export function faltandoNaReuniao(itens: ItemDiscutido[]): string[] {
  const f: string[] = [];
  if (itens.length === 0) f.push('Marque ao menos um projeto como discutido.');
  for (const i of itens) {
    i.acoes.forEach((a, n) => {
      if (!a.descricao.trim()) f.push(`${i.projeto_nome}: a ação ${n + 1} precisa de descrição.`);
      if (!a.responsavel.trim()) f.push(`${i.projeto_nome}: a ação ${n + 1} precisa de responsável.`);
      if (!a.prazo) f.push(`${i.projeto_nome}: a ação ${n + 1} precisa de prazo.`);
    });
  }
  return f;
}

export interface RegistroReuniao {
  id: string;
  projeto_id: string;
  projeto_nome: string | null;
  tipo: 'reuniao_registrada' | 'acao_criada';
  origem: 'reuniao';
  autor: string;
  em: string;
  descricao: string;
  simulado: true;
}

/** Monta o registro da reunião e um registro por ação. `data` = dia da reunião (ISO); `em` = instante do registro (ISO). */
export function montarRegistrosReuniao(itens: ItemDiscutido[], data: string, em: string): RegistroReuniao[] {
  const decisoes = itens.filter((i) => i.decisao.trim()).length;
  const acoes = itens.reduce((s, i) => s + i.acoes.length, 0);
  const base = { origem: 'reuniao' as const, autor: AUTOR_SIMULACAO, em, simulado: true as const };
  const lista: RegistroReuniao[] = [
    {
      ...base, id: `reuniao-${em}-1`, projeto_id: '*', projeto_nome: null, tipo: 'reuniao_registrada',
      descricao: `Reunião semanal de ${dataBr(data)}: ${itens.length} ${itens.length === 1 ? 'projeto discutido' : 'projetos discutidos'}, ${decisoes} ${decisoes === 1 ? 'decisão' : 'decisões'}, ${acoes} ${acoes === 1 ? 'ação' : 'ações'}`,
    },
  ];
  for (const i of itens) {
    for (const a of i.acoes) {
      lista.push({
        ...base, id: `reuniao-${i.projeto_id}-${em}-${lista.length + 1}`, projeto_id: i.projeto_id, projeto_nome: i.projeto_nome, tipo: 'acao_criada',
        descricao: `${a.descricao.trim()} (responsável: ${a.responsavel.trim()}, prazo: ${dataBr(a.prazo)})`,
      });
    }
  }
  return lista;
}

/** Guarda os registros na sessão do navegador. Devolve false se a sessão não estiver disponível. */
export function guardarRegistrosReuniao(registros: RegistroReuniao[]): boolean {
  try {
    const atual = JSON.parse(sessionStorage.getItem(CHAVE_LOG_SIMULACAO) || '[]');
    const lista: unknown[] = Array.isArray(atual) ? atual : [];
    sessionStorage.setItem(CHAVE_LOG_SIMULACAO, JSON.stringify([...lista, ...registros].slice(-LIMITE)));
    return true;
  } catch {
    return false;
  }
}
