// Regras da Sala de guerra: quem merece uma sala (candidatos), indicadores e farol da sala e pauta da reunião.
// Funções puras: `hoje` (ISO 'AAAA-MM-DD') é sempre injetável; o histórico também (padrão: o carregado do disco).
import { farol, saldoSemFonte } from '../carteira/visoes.ts';
import type { Carteira, Projeto } from '../carteira/tipos.ts';
import { diasEntre, itensParados, resumoCronograma } from '../cronograma/visoes.ts';
import type { Cronograma } from '../cronograma/tipos.ts';
import { carregarHistorico } from '../log/carga.ts';
import type { RegistroLog } from '../log/tipos.ts';
import { diaLocal, maisRecentes, resumoRegistro } from '../log/visoes.ts';
import type { ItemRaid, Sala } from './tipos.ts';

const hojePadrao = (): string => new Date().toISOString().slice(0, 10);
const somaDias = (iso: string, n: number): string => new Date(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
export const dataBr = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** Texto "faltam N dias", "falta 1 dia", "vence hoje" ou "vencido há N dias". */
export function textoPrazo(dias: number): string {
  if (dias === 0) return 'vence hoje';
  if (dias === 1) return 'falta 1 dia';
  if (dias > 1) return `faltam ${dias} dias`;
  return dias === -1 ? 'vencido há 1 dia' : `vencido há ${-dias} dias`;
}

export interface MotivoCandidato {
  texto: string;
  peso: number;
}
export interface Candidato {
  projeto: Projeto;
  motivos: string[];
  peso: number;
}

const prioridadeAlta = (p: Projeto): boolean => p.prioridade === 'Muito Alta' || p.prioridade === 'Alta';
const emSala = (s: Sala): boolean => s.situacao === 'aberta' || s.situacao === 'em_andamento';

/** Projetos que merecem uma sala de guerra, com os motivos e o peso somado (corte: peso 3 ou mais). */
export function candidatosSala(carteira: Carteira, cronogramas: Cronograma[], hoje: string = hojePadrao(), salas: Sala[] = []): Candidato[] {
  const ocupados = new Set(salas.filter(emSala).flatMap((s) => s.projetos));
  const lista: Candidato[] = [];
  for (const p of carteira.projetos) {
    if (p.macroetapa === '06' || ocupados.has(p.id)) continue;
    const motivos: MotivoCandidato[] = [];
    const cs = cronogramas.filter((c) => c.projeto_id === p.id);
    if (prioridadeAlta(p) && farol(p, hoje).cor === 'vermelho') motivos.push({ texto: 'Prioridade alta com prazo de etapa vencido', peso: 3 });
    if (cs.some((c) => { const spi = resumoCronograma(c, hoje).spi; return spi !== null && spi < 0.85; })) {
      motivos.push({ texto: 'Cronograma em ritmo vermelho (realizado abaixo do previsto)', peso: 2 });
    }
    const parados = itensParados(cs, hoje).filter((i) => i.dias > 30);
    if (parados.length) {
      const pior = parados.reduce((m, i) => (i.dias > m.dias ? i : m), parados[0]);
      motivos.push({ texto: `Etapa parada há mais de 30 dias: ${pior.etapa} (${pior.unidade ?? 'sem unidade'})`, peso: 2 });
    }
    const saldo = saldoSemFonte(p);
    if ((p.macroetapa === '02' || p.macroetapa === '03') && saldo !== null && saldo > 0) motivos.push({ texto: 'Em contratação com saldo sem fonte', peso: 2 });
    const entrega = p.datas.encerramento;
    if (p.prioridade === 'Muito Alta' && entrega) {
      const d = diasEntre(hoje, entrega);
      if (d >= 0 && d <= 90 && farol(p, hoje).cor !== 'verde') motivos.push({ texto: 'Entrega próxima e em risco', peso: 1 });
    }
    const peso = motivos.reduce((s, m) => s + m.peso, 0);
    if (peso >= 3) lista.push({ projeto: p, motivos: motivos.map((m) => m.texto), peso });
  }
  const entregaDe = (c: Candidato): string => c.projeto.datas.encerramento ?? '9999-12-31';
  return lista.sort((a, b) => b.peso - a.peso || (entregaDe(a) < entregaDe(b) ? -1 : entregaDe(a) > entregaDe(b) ? 1 : 0));
}

const aberto = (i: ItemRaid): boolean => i.situacao === 'aberto' || i.situacao === 'em_andamento';
const acoesAbertas = (s: Sala): ItemRaid[] => s.raid.filter((i) => i.tipo === 'acao' && aberto(i));
const vencida = (i: ItemRaid, hoje: string): boolean => aberto(i) && !!i.prazo && i.prazo < hoje;

export interface IndicadoresSala {
  diasParaPrazo: number;
  acoesAbertas: number;
  acoesVencidas: number;
  problemasAbertos: number;
  riscosAltos: number;
  etapasAtrasadas: number;
  farol: { cor: 'vermelho' | 'amarelo' | 'verde'; motivo: string };
}

export function indicadoresSala(sala: Sala, _carteira: Carteira, cronogramas: Cronograma[], hoje: string = hojePadrao()): IndicadoresSala {
  const diasParaPrazo = diasEntre(hoje, sala.prazo);
  const acoes = acoesAbertas(sala);
  const acoesVencidas = acoes.filter((i) => vencida(i, hoje)).length;
  const problemasAbertos = sala.raid.filter((i) => i.tipo === 'problema' && aberto(i)).length;
  const riscosAltos = sala.raid.filter((i) => i.tipo === 'risco' && aberto(i) && i.impacto === 'alto').length;
  const etapasAtrasadas = cronogramas.filter((c) => c.projeto_id && sala.projetos.includes(c.projeto_id)).reduce((s, c) => s + resumoCronograma(c, hoje).atrasadas, 0);
  let f: IndicadoresSala['farol'];
  if (diasParaPrazo < 0) f = { cor: 'vermelho', motivo: 'Prazo da sala vencido' };
  else if (acoesVencidas > 0) f = { cor: 'vermelho', motivo: `${acoesVencidas} ação(ões) vencida(s)` };
  else if (problemasAbertos > 0 && sala.escalonamento === 3) f = { cor: 'vermelho', motivo: 'Problema aberto com a sala no gabinete' };
  else if (diasParaPrazo <= 7) f = { cor: 'amarelo', motivo: 'Prazo da sala em até 7 dias' };
  else if (riscosAltos > 0) f = { cor: 'amarelo', motivo: `${riscosAltos} risco(s) de impacto alto` };
  else f = { cor: 'verde', motivo: 'No prazo, sem ação vencida' };
  return { diasParaPrazo, acoesAbertas: acoes.length, acoesVencidas, problemasAbertos, riscosAltos, etapasAtrasadas, farol: f };
}

const porPrazo = (a: ItemRaid, b: ItemRaid): number => (a.prazo ?? '9999') < (b.prazo ?? '9999') ? -1 : (a.prazo ?? '9999') > (b.prazo ?? '9999') ? 1 : 0;
const quem = (i: ItemRaid): string => i.responsavel ?? 'sem responsável';

/** Pauta da reunião, em texto e nesta ordem: objetivo, ações vencidas, ações da semana, problemas, riscos altos, decisões, marcos e mudanças. */
export function pautaReuniao(sala: Sala, carteira: Carteira, hoje: string = hojePadrao(), historico: RegistroLog[] = carregarHistorico().registros): string[] {
  const itens: string[] = [];
  const d = diasEntre(hoje, sala.prazo);
  itens.push(`Objetivo e prazo: ${sala.objetivo} Prazo ${dataBr(sala.prazo)} (${textoPrazo(d)}).`);
  const acoes = acoesAbertas(sala).sort(porPrazo);
  for (const i of acoes.filter((x) => vencida(x, hoje))) itens.push(`Ação vencida: ${i.descricao} (${quem(i)}, prazo ${dataBr(i.prazo as string)})`);
  const limite = somaDias(hoje, 7);
  for (const i of acoes.filter((x) => x.prazo && x.prazo >= hoje && x.prazo <= limite)) itens.push(`Ação que vence em 7 dias: ${i.descricao} (${quem(i)}, prazo ${dataBr(i.prazo as string)})`);
  for (const i of sala.raid.filter((x) => x.tipo === 'problema' && aberto(x)).sort(porPrazo)) itens.push(`Problema aberto: ${i.descricao} (${quem(i)})`);
  for (const i of sala.raid.filter((x) => x.tipo === 'risco' && aberto(x) && x.impacto === 'alto')) itens.push(`Risco de impacto alto: ${i.descricao} (${quem(i)})`);
  for (const i of sala.raid.filter((x) => x.tipo === 'decisao' && aberto(x)).sort(porPrazo)) itens.push(`Decisão pendente: ${i.descricao} (${quem(i)}${i.prazo ? `, até ${dataBr(i.prazo)}` : ''})`);
  const fimMarcos = somaDias(hoje, 14);
  for (const m of [...sala.marcos].filter((x) => !x.feito && x.data >= hoje && x.data <= fimMarcos).sort((a, b) => (a.data < b.data ? -1 : 1))) itens.push(`Próximo marco: ${m.descricao} (${dataBr(m.data)})`);
  const ultima = sala.reunioes.reduce((m, r) => (r.data > m ? r.data : m), sala.aberta_em);
  const nomes = new Map(carteira.projetos.map((p) => [p.id, p.nome]));
  const mudancas = maisRecentes(historico.filter((r) => sala.projetos.includes(r.projeto_id) && diaLocal(r.em) > ultima)).slice(0, 5);
  for (const r of mudancas) itens.push(`O que mudou desde a última reunião (${dataBr(ultima)}): ${nomes.get(r.projeto_id) ?? r.projeto_id}: ${resumoRegistro(r)}`);
  return itens;
}
