// Visões dos Cronogramas (Fase 2, leitura). Funções puras: a data de referência (`hoje`) é sempre injetável.
import type { Cronograma, EtapaCronograma, StatusEtapa } from './tipos.ts';

const hojePadrao = (): string => new Date().toISOString().slice(0, 10);
const dia = (iso: string): number => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
/** Dias inteiros de `a` até `b` (positivo quando b é depois de a). */
export const diasEntre = (a: string, b: string): number => Math.round((dia(b) - dia(a)) / 86400000);
const somaDias = (iso: string, n: number): string => new Date(dia(iso) + n * 86400000).toISOString().slice(0, 10);

type DatasEtapa = Pick<EtapaCronograma, 'inicio_previsto' | 'fim_previsto' | 'inicio_real' | 'fim_real'>;

/** Mesma regra do importador, na data informada. */
export function statusNaData(e: DatasEtapa, hoje: string = hojePadrao()): StatusEtapa {
  if (e.fim_real) return 'concluida';
  if (e.inicio_real && e.fim_previsto && hoje > e.fim_previsto) return 'atrasada';
  if (e.inicio_real) return 'em_andamento';
  if (e.inicio_previsto && hoje > e.inicio_previsto) return 'inicio_atrasado';
  return 'a_fazer';
}

export const ROTULO_STATUS: Record<StatusEtapa, string> = {
  a_fazer: 'A fazer',
  inicio_atrasado: 'Início atrasado',
  em_andamento: 'Em andamento',
  atrasada: 'Atrasada',
  concluida: 'Concluída',
};

export type CorRitmo = 'verde' | 'amarelo' | 'vermelho' | null;
/** Farol do SPI: >= 0,95 verde; 0,85 a 0,95 amarelo; < 0,85 vermelho; null = sem previsão. */
export function farolRitmo(spi: number | null): CorRitmo {
  if (spi === null) return null;
  return spi >= 0.95 ? 'verde' : spi >= 0.85 ? 'amarelo' : 'vermelho';
}
export const rotuloRitmo = (cor: CorRitmo): string => (cor === 'verde' ? 'Verde' : cor === 'amarelo' ? 'Amarelo' : cor === 'vermelho' ? 'Vermelho' : 'Sem previsão');

export const etapasDoCronograma = (c: Cronograma): EtapaCronograma[] => c.fases.flatMap((f) => f.etapas);

export interface ResumoCronograma {
  etapas: number;
  concluidas: number;
  realizadoPct: number;
  previstoPct: number;
  spi: number | null;
  ritmo: CorRitmo;
  faseAtual: string;
  atrasadas: number;
  proximos7: number;
  entregaPrevista: string | null;
}

const peso = (e: EtapaCronograma): number => (e.duracao_prevista && e.duracao_prevista > 0 ? e.duracao_prevista : 1);

/** Fração (0 a 1) do período previsto da etapa que já decorreu até `hoje`. Sem datas previstas = 0. */
function fracaoDecorrida(e: EtapaCronograma, hoje: string): number {
  if (!e.inicio_previsto || !e.fim_previsto) return 0;
  if (hoje >= e.fim_previsto) return 1;
  if (hoje <= e.inicio_previsto) return 0;
  const total = diasEntre(e.inicio_previsto, e.fim_previsto);
  return total <= 0 ? 1 : diasEntre(e.inicio_previsto, hoje) / total;
}

export function resumoCronograma(c: Cronograma, hoje: string = hojePadrao()): ResumoCronograma {
  const etapas = etapasDoCronograma(c);
  const pesoTotal = etapas.reduce((s, e) => s + peso(e), 0);
  const feito = etapas.filter((e) => statusNaData(e, hoje) === 'concluida');
  const pesoFeito = feito.reduce((s, e) => s + peso(e), 0);
  const pesoPrevisto = etapas.reduce((s, e) => s + peso(e) * fracaoDecorrida(e, hoje), 0);
  const realizadoPct = pesoTotal > 0 ? (pesoFeito / pesoTotal) * 100 : 0;
  const previstoPct = pesoTotal > 0 ? (pesoPrevisto / pesoTotal) * 100 : 0;
  const spi = previstoPct > 0 ? realizadoPct / previstoPct : null;
  const faseAberta = c.fases.find((f) => f.etapas.some((e) => statusNaData(e, hoje) !== 'concluida'));
  const limite = somaDias(hoje, 7);
  const fins = etapas.map((e) => e.fim_previsto).filter((d): d is string => !!d);
  return {
    etapas: etapas.length,
    concluidas: feito.length,
    realizadoPct,
    previstoPct,
    spi,
    ritmo: farolRitmo(spi),
    faseAtual: faseAberta ? faseAberta.nome : 'Concluído',
    atrasadas: etapas.filter((e) => ['atrasada', 'inicio_atrasado'].includes(statusNaData(e, hoje))).length,
    proximos7: etapas.filter((e) => statusNaData(e, hoje) !== 'concluida' && !!e.fim_previsto && e.fim_previsto >= hoje && e.fim_previsto <= limite).length,
    entregaPrevista: fins.length ? fins.reduce((m, d) => (d > m ? d : m), fins[0]) : null,
  };
}

export interface ItemParado {
  cronogramaId: string;
  cronograma: string;
  etapa: string;
  unidade: string | null;
  responsavel: string | null;
  dias: number;
}
export interface MaisAntigo {
  cronograma: string;
  etapa: string;
  dias: number;
}
interface GrupoParado {
  itens: number;
  diasAcumulados: number;
  maisAntigo: MaisAntigo;
}
export interface GrupoUnidade extends GrupoParado {
  unidade: string;
}
export interface GrupoResponsavel extends GrupoParado {
  responsavel: string;
}

/** Etapas atrasadas (fim previsto vencido, ou início previsto vencido sem início), com os dias de atraso. */
export function itensParados(cs: Cronograma[], hoje: string = hojePadrao()): ItemParado[] {
  const itens: ItemParado[] = [];
  for (const c of cs) {
    for (const e of etapasDoCronograma(c)) {
      if (statusNaData(e, hoje) === 'concluida') continue;
      let dias: number | null = null;
      if (e.fim_previsto && e.fim_previsto < hoje) dias = diasEntre(e.fim_previsto, hoje);
      else if (!e.inicio_real && e.inicio_previsto && e.inicio_previsto < hoje) dias = diasEntre(e.inicio_previsto, hoje);
      if (dias === null || dias <= 0) continue;
      itens.push({ cronogramaId: c.id, cronograma: c.titulo, etapa: e.nome, unidade: e.unidade, responsavel: e.responsavel, dias });
    }
  }
  return itens;
}

function agrupar(itens: ItemParado[], chave: 'unidade' | 'responsavel', vazio: string) {
  const mapa = new Map<string, ItemParado[]>();
  for (const i of itens) {
    const k = i[chave] ?? vazio;
    mapa.set(k, [...(mapa.get(k) ?? []), i]);
  }
  return [...mapa.entries()]
    .map(([nome, l]) => {
      const antigo = l.reduce((m, i) => (i.dias > m.dias ? i : m), l[0]);
      return {
        nome,
        itens: l.length,
        diasAcumulados: l.reduce((s, i) => s + i.dias, 0),
        maisAntigo: { cronograma: antigo.cronograma, etapa: antigo.etapa, dias: antigo.dias },
      };
    })
    .sort((a, b) => b.diasAcumulados - a.diasAcumulados || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function ondeEstaParado(cs: Cronograma[], hoje: string = hojePadrao()): { porUnidade: GrupoUnidade[]; porResponsavel: GrupoResponsavel[] } {
  const itens = itensParados(cs, hoje);
  return {
    porUnidade: agrupar(itens, 'unidade', 'Sem unidade').map(({ nome, ...r }) => ({ unidade: nome, ...r })),
    porResponsavel: agrupar(itens, 'responsavel', 'Sem responsável').map(({ nome, ...r }) => ({ responsavel: nome, ...r })),
  };
}
