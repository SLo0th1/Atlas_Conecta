// Regras da Reunião semanal: monta a pauta (o que precisa de atenção e o que mudou desde a última reunião).
// Funções puras: `desde` e `hoje` (ISO 'AAAA-MM-DD') sempre vêm de fora; nada lê arquivo nem relógio.
import { MACROETAPAS, nomeMacroetapa } from '../carteira/macroetapas.ts';
import type { Carteira, CodigoMacroetapa } from '../carteira/tipos.ts';
import { farol, type Farol } from '../carteira/visoes.ts';
import type { RegistroLog } from '../log/tipos.ts';
import { acaoCanonica, diaLocal, resumoRegistro } from '../log/visoes.ts';

export const MOTIVO_VENCIDO = 'Prazo vencido';
export const MOTIVO_SALA = 'Candidato à sala de guerra';
export const MOTIVO_MUDOU = 'Mudou desde a última reunião';
export const MOTIVO_PRIORIDADE = 'Prioridade muito alta em atenção';
export const MOTIVOS_PAUTA = [MOTIVO_VENCIDO, MOTIVO_SALA, MOTIVO_MUDOU, MOTIVO_PRIORIDADE];

export interface RegistroDoItem {
  dia: string; // AAAA-MM-DD (horário de Brasília)
  texto: string; // resumo de uma linha
  tipo: string; // tipo canônico da ação
}

/** Dados de um projeto que pode entrar na pauta, antes de saber a data da última reunião. */
export interface ItemBase {
  projeto_id: string;
  nome: string;
  orgao: string | null;
  macroetapa: string; // nome
  macroetapaCodigo: CodigoMacroetapa | null;
  farol: Farol;
  prioridade: string | null;
  entrega: string | null; // entrega prevista (ISO) ou null
  candidatoSala: boolean;
  prioridadeEmAtencao: boolean;
  registros: RegistroDoItem[]; // histórico do projeto, qualquer data
  ultimaReuniaoPlanilha: string | null;
  providenciasPlanilha: string | null;
}

export interface ItemPauta {
  projeto_id: string;
  nome: string;
  orgao: string | null;
  macroetapa: string;
  macroetapaCodigo: CodigoMacroetapa | null;
  farol: Farol;
  motivosNaPauta: string[];
  mudancas: string[];
  ultimaReuniaoPlanilha: string | null;
  providenciasPlanilha: string | null;
  prioridade: string | null;
}

export interface ResumoPauta {
  total: number;
  porMacroetapa: { codigo: string; nome: string; qtd: number }[];
  vermelhos: number;
  mudaramDeEtapa: number;
  novos: number;
}
export interface PautaSemanal {
  resumo: ResumoPauta;
  itens: ItemPauta[];
}

/** Monta, para cada projeto que tem algum motivo (em qualquer data) ou histórico, os dados da pauta. */
export function baseDaPauta(carteira: Carteira, historico: RegistroLog[], candidatosSala: string[], hoje: string): ItemBase[] {
  const salas = new Set(candidatosSala);
  const porProjeto = new Map<string, RegistroLog[]>();
  for (const r of historico) porProjeto.set(r.projeto_id, [...(porProjeto.get(r.projeto_id) ?? []), r]);
  const lista: ItemBase[] = [];
  for (const p of carteira.projetos) {
    const f = farol(p, hoje);
    const regs = porProjeto.get(p.id) ?? [];
    const prioridadeEmAtencao = p.prioridade === 'Muito Alta' && f.cor === 'amarelo';
    const candidatoSala = salas.has(p.id);
    if (f.cor !== 'vermelho' && !candidatoSala && !prioridadeEmAtencao && regs.length === 0) continue;
    lista.push({
      projeto_id: p.id,
      nome: p.nome,
      orgao: p.orgao,
      macroetapa: nomeMacroetapa(p.macroetapa),
      macroetapaCodigo: p.macroetapa,
      farol: f,
      prioridade: p.prioridade,
      entrega: p.datas.encerramento,
      candidatoSala,
      prioridadeEmAtencao,
      registros: regs.map((r) => ({ dia: diaLocal(r.em), texto: resumoRegistro(r), tipo: acaoCanonica(r.tipo) })),
      ultimaReuniaoPlanilha: p.operacional?.reuniao ?? null,
      providenciasPlanilha: p.operacional?.providencias ?? null,
    });
  }
  return lista;
}

const PESO_PRIORIDADE: Record<string, number> = { 'Muito Alta': 0, Alta: 1, Média: 2, Baixa: 3 };
const pesoPrioridade = (p: string | null): number => (p !== null && p in PESO_PRIORIDADE ? PESO_PRIORIDADE[p] : 4);

/** Aplica a data da última reunião à base: quem entra na pauta, motivos, o que mudou, resumo e ordem. Pura e sem acesso a arquivo (roda também no navegador). */
export function pautaDaBase(base: ItemBase[], desde: string): PautaSemanal {
  const itens: { item: ItemPauta; entrega: string | null; vermelho: boolean; etapa: boolean; novo: boolean }[] = [];
  for (const b of base) {
    const novos = b.registros.filter((r) => r.dia >= desde);
    const motivos: string[] = [];
    if (b.farol.cor === 'vermelho') motivos.push(MOTIVO_VENCIDO);
    if (b.candidatoSala) motivos.push(MOTIVO_SALA);
    if (novos.length) motivos.push(MOTIVO_MUDOU);
    if (b.prioridadeEmAtencao) motivos.push(MOTIVO_PRIORIDADE);
    if (!motivos.length) continue;
    itens.push({
      item: {
        projeto_id: b.projeto_id, nome: b.nome, orgao: b.orgao, macroetapa: b.macroetapa, macroetapaCodigo: b.macroetapaCodigo, farol: b.farol,
        motivosNaPauta: motivos, mudancas: novos.map((r) => r.texto), ultimaReuniaoPlanilha: b.ultimaReuniaoPlanilha,
        providenciasPlanilha: b.providenciasPlanilha, prioridade: b.prioridade,
      },
      entrega: b.entrega,
      vermelho: b.farol.cor === 'vermelho',
      etapa: novos.some((r) => r.tipo === 'mover_macroetapa'),
      novo: novos.some((r) => r.tipo === 'criado'),
    });
  }
  itens.sort((a, b) => {
    if (a.vermelho !== b.vermelho) return a.vermelho ? -1 : 1;
    const pa = pesoPrioridade(a.item.prioridade);
    const pb = pesoPrioridade(b.item.prioridade);
    if (pa !== pb) return pa - pb;
    if (a.entrega !== b.entrega) return a.entrega === null ? 1 : b.entrega === null ? -1 : a.entrega < b.entrega ? -1 : 1;
    return a.item.projeto_id < b.item.projeto_id ? -1 : a.item.projeto_id > b.item.projeto_id ? 1 : 0;
  });
  const porMacroetapa = [
    ...MACROETAPAS.map((m) => ({ codigo: m.codigo as string, nome: m.nome, qtd: itens.filter((x) => x.item.macroetapaCodigo === m.codigo).length })),
    { codigo: 'sem', nome: 'Sem macroetapa', qtd: itens.filter((x) => x.item.macroetapaCodigo === null).length },
  ].filter((g) => g.qtd > 0);
  return {
    resumo: {
      total: itens.length,
      porMacroetapa,
      vermelhos: itens.filter((x) => x.vermelho).length,
      mudaramDeEtapa: itens.filter((x) => x.etapa).length,
      novos: itens.filter((x) => x.novo).length,
    },
    itens: itens.map((x) => x.item),
  };
}

/**
 * Pauta da reunião semanal. Entram, sem repetir: farol vermelho; candidatos à sala de guerra (`salasCandidatas` = IDs de projeto,
 * por exemplo `candidatosSala(...).map((c) => c.projeto.id)`); projetos com mudança no histórico desde `desde`; prioridade "Muito Alta" com farol amarelo.
 */
export function pautaSemanal(carteira: Carteira, historico: RegistroLog[], salasCandidatas: string[], desde: string, hoje: string): PautaSemanal {
  return pautaDaBase(baseDaPauta(carteira, historico, salasCandidatas, hoje), desde);
}

