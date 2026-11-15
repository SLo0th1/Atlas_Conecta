// Visões da Carteira de Projetos (Kanban, Gantt, por órgão, farol). Funções puras: sem leitura de arquivo nem relógio global.
import { MACROETAPAS } from './macroetapas.ts';
import type { Carteira, CodigoMacroetapa, Projeto } from './tipos.ts';

export const valorProjeto = (p: Projeto): number | null => p.valores.total ?? p.valores.obra ?? null;

/** Data prevista de fim da macroetapa atual do projeto (ISO) ou null. */
export function fimDaMacroetapaAtual(p: Projeto): string | null {
  const m = MACROETAPAS.find((x) => x.codigo === p.macroetapa);
  if (!m || !m.fimEm) return null;
  const v = p.datas[m.fimEm];
  return typeof v === 'string' ? v : null;
}

const porData = (a: Projeto, b: Projeto): number => {
  const fa = fimDaMacroetapaAtual(a);
  const fb = fimDaMacroetapaAtual(b);
  if (fa === fb) return 0;
  if (!fa) return 1;
  if (!fb) return -1;
  return fa < fb ? -1 : 1;
};

const somaValores = (l: Projeto[]): number => l.reduce((s, p) => s + (valorProjeto(p) ?? 0), 0);

export interface GrupoMacroetapa {
  codigo: CodigoMacroetapa | 'sem';
  nome: string;
  qtd: number;
  valor: number;
  projetos: Projeto[];
}

export function resumoPorMacroetapa(c: Carteira): GrupoMacroetapa[] {
  const grupos: GrupoMacroetapa[] = MACROETAPAS.map((m) => {
    const projetos = c.projetos.filter((p) => p.macroetapa === m.codigo).sort(porData);
    return { codigo: m.codigo, nome: m.nome, qtd: projetos.length, valor: somaValores(projetos), projetos };
  });
  const sem = c.projetos.filter((p) => p.macroetapa === null).sort(porData);
  if (sem.length) grupos.push({ codigo: 'sem', nome: 'Sem macroetapa', qtd: sem.length, valor: somaValores(sem), projetos: sem });
  return grupos;
}

export interface GrupoOrgao {
  orgao: string;
  qtd: number;
  valor: number;
  percentual: number;
  emAndamento: number;
  emPlanejamento: number;
  concluidos: number;
}

export function resumoPorOrgao(c: Carteira): GrupoOrgao[] {
  const total = somaValores(c.projetos);
  const mapa = new Map<string, Projeto[]>();
  for (const p of c.projetos) {
    const k = p.orgao ?? 'Sem órgão';
    mapa.set(k, [...(mapa.get(k) ?? []), p]);
  }
  return [...mapa.entries()]
    .map(([orgao, l]) => {
      const valor = somaValores(l);
      const conta = (cods: string[]) => l.filter((p) => p.macroetapa !== null && cods.includes(p.macroetapa)).length;
      return {
        orgao,
        qtd: l.length,
        valor,
        percentual: total > 0 ? (valor / total) * 100 : 0,
        emAndamento: conta(['03', '04', '05']),
        emPlanejamento: conta(['00', '01', '02']),
        concluidos: conta(['06']),
      };
    })
    .sort((a, b) => b.valor - a.valor);
}

const diasEntre = (de: string, ate: string): number => Math.round((Date.parse(`${ate.slice(0, 10)}T00:00:00Z`) - Date.parse(`${de.slice(0, 10)}T00:00:00Z`)) / 86400000);

export interface Farol {
  cor: 'vermelho' | 'amarelo' | 'verde';
  motivo: string;
}

/** Semáforo do projeto. `hoje` em ISO 'AAAA-MM-DD' (injetável para teste). */
export function farol(p: Projeto, hoje: string = new Date().toISOString().slice(0, 10)): Farol {
  const fim = fimDaMacroetapaAtual(p);
  if (p.macroetapa !== '06') {
    if (fim && fim < hoje) return { cor: 'vermelho', motivo: 'Prazo da macroetapa vencido' };
    if (p.datas.encerramento && p.datas.encerramento < hoje) return { cor: 'vermelho', motivo: 'Entrega prevista vencida' };
  }
  if (p.pendencias.length) return { cor: 'amarelo', motivo: `Dados incompletos: ${p.pendencias.length} pendência(s)` };
  if (p.macroetapa !== '06' && fim && diasEntre(hoje, fim) <= 15) return { cor: 'amarelo', motivo: 'Prazo da macroetapa em até 15 dias' };
  return { cor: 'verde', motivo: 'No prazo' };
}

/** Valor do projeto que ainda não tem fonte (captado + contrapartida + custeio do município); null se não dá para estimar. */
export function saldoSemFonte(p: Projeto): number | null {
  const valor = valorProjeto(p);
  if (valor === null) return null;
  const fontes = [p.valores.captado, p.valores.contrapartida, p.valores.custeio_municipio].filter((v): v is number => v !== null);
  if (!fontes.length) return null;
  return Math.max(0, valor - fontes.reduce((s, v) => s + v, 0));
}

export interface SegmentoGantt {
  codigo: CodigoMacroetapa;
  inicio: string;
  fim: string;
}

const somaDias = (iso: string, dias: number): string => new Date(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) + dias * 86400000).toISOString().slice(0, 10);

export function segmentosGantt(p: Projeto): SegmentoGantt[] {
  const d = p.datas;
  const fimExecucao = d.encerramento ?? (d.mobilizacao && d.execucao_dias !== null ? somaDias(d.mobilizacao, d.execucao_dias) : null);
  const pares: [CodigoMacroetapa, string | null, string | null][] = [
    ['00', d.inicio, d.pecas_tecnicas],
    ['01', d.pecas_tecnicas, d.planejamento],
    ['02', d.planejamento, d.preparatorio],
    ['03', d.preparatorio, d.contratacao],
    ['04', d.contratacao, d.mobilizacao],
    ['05', d.mobilizacao, fimExecucao],
  ];
  const saida: SegmentoGantt[] = [];
  for (const [codigo, inicio, fim] of pares) {
    if (!inicio || !fim || fim < inicio) continue;
    saida.push({ codigo, inicio, fim });
  }
  return saida;
}
