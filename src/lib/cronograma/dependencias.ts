// Dependências entre etapas do cronograma e atraso em cascata (Fase 2, leitura). Funções puras: `hoje` é sempre injetável.
//
// Por que a regra é por ordem e datas: a planilha do GEPP NÃO tem coluna de predecessora. A única informação de sequência
// é a ordem das etapas (fase e posição) e as datas previstas. Regra adotada:
//  1. As etapas são lidas na ordem do cronograma (fase.ordem, depois etapa.ordem).
//  2. Elas formam "blocos". Uma etapa entra no bloco atual (é PARALELA a ele) quando é da MESMA fase e o seu início previsto
//     é anterior ao último fim previsto do bloco: se foi planejada para começar antes de as outras terminarem, ela não pode
//     depender delas. Caso contrário (outra fase, começa no fim ou depois, ou falta data), abre um bloco novo.
//  3. Predecessoras de uma etapa = todas as etapas do bloco anterior. Etapas paralelas (mesmo bloco) não dependem entre si.
//     Na falta de data, vale a ordem da planilha (sequencial): é o que a equipe escreveu.
// Atraso em cascata: fim projetado = fim previsto + atraso acumulado das predecessoras, nunca antes do fim previsto.
// Valor ausente fica null (sem data prevista não há fim projetado); atraso desconhecido não vira zero na etapa,
// mas a cascata segue com o atraso conhecido que veio de antes.
import type { Cronograma, EtapaCronograma } from './tipos.ts';
import { diasEntre } from './visoes.ts';

const hojePadrao = (): string => new Date().toISOString().slice(0, 10);
const somaDias = (iso: string, n: number): string => new Date(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const maiorData = (ds: string[]): string => ds.reduce((m, d) => (d > m ? d : m), ds[0]);

/** Etapas na ordem do cronograma (fase, depois posição). */
export function etapasEmOrdem(c: Cronograma): EtapaCronograma[] {
  return [...c.fases]
    .sort((a, b) => a.ordem - b.ordem)
    .flatMap((f) => [...f.etapas].sort((a, b) => a.ordem - b.ordem));
}

/** Para cada etapa (na ordem de `etapasEmOrdem`), os índices das predecessoras. */
export function predecessoras(c: Cronograma): number[][] {
  const etapas = etapasEmOrdem(c);
  const blocos: number[][] = [];
  etapas.forEach((e, i) => {
    const atual = blocos.at(-1);
    if (atual) {
      const primeira = etapas[atual[0]];
      const fins = atual.map((j) => etapas[j].fim_previsto).filter((d): d is string => !!d);
      const paralela = primeira.fase === e.fase && !!e.inicio_previsto && fins.length > 0 && e.inicio_previsto < maiorData(fins);
      if (paralela) {
        atual.push(i);
        return;
      }
    }
    blocos.push([i]);
  });
  const resultado: number[][] = etapas.map(() => []);
  blocos.forEach((bloco, b) => {
    for (const i of bloco) resultado[i] = b > 0 ? [...blocos[b - 1]] : [];
  });
  return resultado;
}

const iniciada = (e: EtapaCronograma): boolean => !!e.inicio_real || !!e.fim_real;
const terminada = (e: EtapaCronograma): boolean => !!e.fim_real;

export interface DependenciaEtapa {
  indice: number;
  etapa: EtapaCronograma;
  predecessoras: number[];
  /** Predecessoras ainda não terminadas, quando a etapa não começou. Vazio = não está aguardando. */
  aguardando: number[];
  /** Aguardando E o início previsto já passou: a etapa está travada pela anterior. */
  travada: boolean;
  /** Maior atraso (dias) que chega das predecessoras. */
  atrasoHerdado: number;
  /** Fim projetado − fim previsto (>= 0); null sem fim previsto. */
  atrasoAcumulado: number | null;
  /** Concluída: fim real. Senão: nunca antes do fim previsto. null sem fim previsto. */
  fimProjetado: string | null;
  /** Atraso que nasce na própria etapa (acumulado − herdado); null sem fim previsto. */
  atrasoProprio: number | null;
}

export function analisarDependencias(c: Cronograma, hoje: string = hojePadrao()): DependenciaEtapa[] {
  const etapas = etapasEmOrdem(c);
  const preds = predecessoras(c);
  const transmitido: number[] = [];
  return etapas.map((e, i) => {
    const p = preds[i];
    const atrasoHerdado = p.length ? Math.max(0, ...p.map((j) => transmitido[j])) : 0;
    let fimProjetado: string | null = null;
    let atrasoAcumulado: number | null = null;
    if (e.fim_real) {
      fimProjetado = e.fim_real;
      atrasoAcumulado = e.fim_previsto ? Math.max(0, diasEntre(e.fim_previsto, e.fim_real)) : null;
    } else if (e.fim_previsto) {
      const candidatos = [somaDias(e.fim_previsto, atrasoHerdado), hoje];
      const duracao = e.inicio_previsto ? Math.max(0, diasEntre(e.inicio_previsto, e.fim_previsto)) : null;
      if (duracao !== null) {
        // Começou depois do previsto: termina, no mínimo, a duração prevista depois de começar.
        if (e.inicio_real) candidatos.push(somaDias(e.inicio_real, duracao));
        // Não começou: não começa antes de hoje nem antes de a cascata permitir.
        else candidatos.push(somaDias(maiorData([somaDias(e.inicio_previsto as string, atrasoHerdado), hoje]), duracao));
      }
      // Nunca antecipar: o fim previsto é o piso.
      fimProjetado = maiorData([e.fim_previsto, ...candidatos]);
      atrasoAcumulado = diasEntre(e.fim_previsto, fimProjetado);
    }
    transmitido[i] = atrasoAcumulado ?? atrasoHerdado;
    const aguardando = iniciada(e) ? [] : p.filter((j) => !terminada(etapas[j]));
    return {
      indice: i,
      etapa: e,
      predecessoras: p,
      aguardando,
      travada: aguardando.length > 0 && !!e.inicio_previsto && e.inicio_previsto <= hoje,
      atrasoHerdado,
      atrasoAcumulado,
      fimProjetado,
      atrasoProprio: atrasoAcumulado === null ? null : atrasoAcumulado - atrasoHerdado,
    };
  });
}

export interface CascataProjeto {
  fimPrevisto: string | null;
  fimProjetado: string | null;
  /** Dias entre o fim previsto e o projetado (>= 0); null sem datas. */
  diasDeAtraso: number | null;
  /** Etapa que mais segura o projeto: a de maior atraso próprio no caminho que define o fim. null se não há atraso. */
  gargalo: { indice: number; nome: string; dias: number } | null;
  /** Caminho crítico simples: índices, do início até a etapa que define o fim projetado. */
  caminho: number[];
}

export function cascataDoProjeto(c: Cronograma, hoje: string = hojePadrao(), deps: DependenciaEtapa[] = analisarDependencias(c, hoje)): CascataProjeto {
  const previstos = deps.map((d) => d.etapa.fim_previsto).filter((x): x is string => !!x);
  const comFim = deps.filter((d) => d.fimProjetado !== null);
  if (!previstos.length || !comFim.length) return { fimPrevisto: previstos.length ? maiorData(previstos) : null, fimProjetado: null, diasDeAtraso: null, gargalo: null, caminho: [] };
  const fimPrevisto = maiorData(previstos);
  // Etapa que define o fim: maior fim projetado (empate: a mais adiante no cronograma).
  const final = comFim.reduce((m, d) => ((d.fimProjetado as string) >= (m.fimProjetado as string) ? d : m), comFim[0]);
  const fimProjetado = maiorData([fimPrevisto, final.fimProjetado as string]);
  const transmite = (d: DependenciaEtapa) => d.atrasoAcumulado ?? d.atrasoHerdado;
  const caminho: number[] = [final.indice];
  let atual = final;
  while (atual.predecessoras.length) {
    atual = atual.predecessoras.map((j) => deps[j]).reduce((m, d) => (transmite(d) >= transmite(m) ? d : m));
    caminho.unshift(atual.indice);
  }
  const diasDeAtraso = diasEntre(fimPrevisto, fimProjetado);
  let gargalo: CascataProjeto['gargalo'] = null;
  if (diasDeAtraso > 0) {
    for (const i of caminho) {
      const dias = deps[i].atrasoProprio ?? 0;
      if (dias > 0 && (!gargalo || dias > gargalo.dias)) gargalo = { indice: i, nome: deps[i].etapa.nome, dias };
    }
  }
  return { fimPrevisto, fimProjetado, diasDeAtraso, gargalo, caminho };
}

/** Sucessoras diretas de cada etapa (inverso de `predecessoras`). */
function sucessorasDe(c: Cronograma): number[][] {
  const ps = predecessoras(c);
  const suc: number[][] = ps.map(() => []);
  ps.forEach((lista, i) => lista.forEach((p) => suc[p].push(i)));
  return suc;
}
/** Todas as etapas que vêm depois de `i` na cadeia (diretas e indiretas). */
function seguintes(suc: number[][], i: number): Set<number> {
  const vistas = new Set<number>();
  const fila = [...suc[i]];
  while (fila.length) {
    const j = fila.shift() as number;
    if (vistas.has(j)) continue;
    vistas.add(j);
    fila.push(...suc[j]);
  }
  return vistas;
}

/** Para cada etapa, quantas etapas seguintes (diretas e indiretas) ainda não começaram e dependem dela. Concluída = 0. */
export function etapasTravadasPor(c: Cronograma): number[] {
  const etapas = etapasEmOrdem(c);
  const suc = sucessorasDe(c);
  return etapas.map((e, i) => (terminada(e) ? 0 : [...seguintes(suc, i)].filter((j) => !iniciada(etapas[j])).length));
}

/**
 * Para "Onde está parado": por unidade, quantas etapas seguintes (sem repetir) estão esperando os itens atrasados dela.
 * `parados` = itens de `itensParados` (o casamento é por cronograma, nome e unidade da etapa).
 */
export function travadasPorUnidade(cs: Cronograma[], parados: { cronogramaId: string; etapa: string; unidade: string | null }[]): Map<string, number> {
  const porUnidade = new Map<string, Set<string>>();
  for (const c of cs) {
    const chaves = new Set(parados.filter((p) => p.cronogramaId === c.id).map((p) => `${p.etapa}\u0000${p.unidade ?? ''}`));
    if (!chaves.size) continue;
    const etapas = etapasEmOrdem(c);
    const suc = sucessorasDe(c);
    etapas.forEach((e, i) => {
      if (!chaves.has(`${e.nome}\u0000${e.unidade ?? ''}`)) return;
      const unidade = e.unidade ?? 'Sem unidade';
      const conjunto = porUnidade.get(unidade) ?? new Set<string>();
      for (const j of seguintes(suc, i)) if (!iniciada(etapas[j])) conjunto.add(`${c.id}#${j}`);
      porUnidade.set(unidade, conjunto);
    });
  }
  return new Map([...porUnidade].map(([u, s]) => [u, s.size]));
}
