// Painel do prefeito (Gestão): foto atual de todos os projetos e recursos. Funções puras: `hoje` (ISO 'AAAA-MM-DD') é injetável.
// Datas, valores e porcentagens saem aqui como número/ISO; a formatação fica nas telas.
import { MACROETAPAS } from '../carteira/macroetapas.ts';
import type { Carteira, CodigoMacroetapa, Projeto } from '../carteira/tipos.ts';
import { farol, valorProjeto } from '../carteira/visoes.ts';
import type { Cronograma } from '../cronograma/tipos.ts';
import { diasEntre, ondeEstaParado } from '../cronograma/visoes.ts';
import { IBGE } from '../dados/alertas.ts';
import { dados } from '../dados/index.ts';
import { candidatosSala, porqueSugerido } from '../sala/visoes.ts';
import type { Sala } from '../sala/tipos.ts';

export interface ResumoCaptacao {
  emExecucao: number;
  pactuado: number;
  liberado: number;
  saldoALiberar: number;
  semDesembolso: number;
}

/** Resumo dos convênios em execução (mesmo cálculo da guia Captação › Acompanhamento); null se a coleta não existe. */
export function resumoCaptacao(): ResumoCaptacao | null {
  const r = dados.acompanhamento(IBGE)?.resumo;
  if (!r) return null;
  return {
    emExecucao: Number(r.em_execucao ?? 0),
    pactuado: Number(r.valor_repasse_pactuado_em_execucao ?? 0),
    liberado: Number(r.valor_desembolsado_em_execucao ?? 0),
    saldoALiberar: Number(r.saldo_a_liberar_em_execucao ?? 0),
    semDesembolso: Number(r.assinados_sem_nenhum_desembolso ?? 0),
  };
}

export interface ItemProjeto {
  id: string;
  nome: string;
  orgao: string | null;
  valor: number | null;
  /** Data ISO que a lista mostra (fim previsto da contratação, entrega prevista...). */
  data: string | null;
}
export interface ItemExecucao extends ItemProjeto {
  executado: number | null;
  /** Executado ÷ total (0 a 100) quando os dois existem e são coerentes (executado não passa do total); senão null (a tela mostra "—"). */
  percentual: number | null;
}
export interface ItemAtencao {
  id: string;
  nome: string;
  prioridade: string | null;
  motivo: string;
}
export interface ItemEntrega extends ItemProjeto {
  dias: number;
}
export interface PainelPrefeito {
  carteira: {
    total: number;
    valor: number;
    porMacroetapa: { codigo: CodigoMacroetapa | 'sem'; nome: string; qtd: number; valor: number }[];
    prioridadeMuitoAlta: number;
  };
  atencao: {
    vermelhos: { qtd: number; top: ItemAtencao[] };
    candidatosSala: { qtd: number; top: { id: string; nome: string; porque: string }[] };
    salasAbertas: number;
  };
  contratacao: { qtd: number; valor: number; lista: ItemProjeto[] };
  execucao: { qtd: number; valor: number; lista: ItemExecucao[] };
  /** dias = atraso da etapa mais antiga da unidade. */
  parado: { unidade: string; itens: number; dias: number }[];
  entregas: { qtd: number; lista: ItemEntrega[] };
  recursos: ResumoCaptacao | null;
}

const soma = (l: Projeto[]): number => l.reduce((s, p) => s + (valorProjeto(p) ?? 0), 0);
const dataNula = '9999-12-31';
const porDataENome = <T extends { data: string | null; nome: string }>(a: T, b: T): number => {
  const da = a.data ?? dataNula;
  const db = b.data ?? dataNula;
  return da < db ? -1 : da > db ? 1 : a.nome.localeCompare(b.nome, 'pt-BR');
};
const RANK_PRIORIDADE: Record<string, number> = { 'Muito Alta': 0, Alta: 1, 'Média': 2, Baixa: 3 };
const rankPrioridade = (p: string | null): number => (p !== null && p in RANK_PRIORIDADE ? RANK_PRIORIDADE[p] : 4);
const somaDias = (iso: string, n: number): string => new Date(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export function montarPainel(carteira: Carteira, cronogramas: Cronograma[], salas: Sala[], captacao: ResumoCaptacao | null, hoje: string): PainelPrefeito {
  const projetos = carteira.projetos;

  const porMacroetapa: PainelPrefeito['carteira']['porMacroetapa'] = MACROETAPAS.map((m) => {
    const l = projetos.filter((p) => p.macroetapa === m.codigo);
    return { codigo: m.codigo, nome: m.nome, qtd: l.length, valor: soma(l) };
  });
  const sem = projetos.filter((p) => p.macroetapa === null);
  if (sem.length) porMacroetapa.push({ codigo: 'sem', nome: 'Sem macroetapa', qtd: sem.length, valor: soma(sem) });

  const vermelhos = projetos
    .filter((p) => p.macroetapa !== '06')
    .map((p) => ({ p, f: farol(p, hoje) }))
    .filter((x) => x.f.cor === 'vermelho');
  const topVermelhos: ItemAtencao[] = [...vermelhos]
    .sort((a, b) => rankPrioridade(a.p.prioridade) - rankPrioridade(b.p.prioridade) || a.p.nome.localeCompare(b.p.nome, 'pt-BR'))
    .slice(0, 5)
    .map((x) => ({ id: x.p.id, nome: x.p.nome, prioridade: x.p.prioridade, motivo: x.f.motivo }));

  const candidatos = candidatosSala(carteira, cronogramas, hoje, salas);
  const salasAbertas = salas.filter((s) => s.situacao === 'aberta' || s.situacao === 'em_andamento').length;

  const item = (p: Projeto, data: string | null): ItemProjeto => ({ id: p.id, nome: p.nome, orgao: p.orgao, valor: valorProjeto(p), data });
  const emContratacao = projetos.filter((p) => p.macroetapa === '02' || p.macroetapa === '03');
  const emExecucao = projetos.filter((p) => p.macroetapa === '05');

  const limite = somaDias(hoje, 90);
  const proximas = projetos.filter((p) => p.macroetapa !== '06' && !!p.datas.encerramento && p.datas.encerramento >= hoje && p.datas.encerramento <= limite);

  return {
    carteira: { total: projetos.length, valor: soma(projetos), porMacroetapa, prioridadeMuitoAlta: projetos.filter((p) => p.prioridade === 'Muito Alta').length },
    atencao: {
      vermelhos: { qtd: vermelhos.length, top: topVermelhos },
      candidatosSala: { qtd: candidatos.length, top: candidatos.slice(0, 3).map((c) => ({ id: c.projeto.id, nome: c.projeto.nome, porque: porqueSugerido(c.motivos) })) },
      salasAbertas,
    },
    contratacao: { qtd: emContratacao.length, valor: soma(emContratacao), lista: emContratacao.map((p) => item(p, p.datas.contratacao)).sort(porDataENome) },
    execucao: {
      qtd: emExecucao.length,
      valor: soma(emExecucao),
      lista: emExecucao
        .map((p): ItemExecucao => {
          const valor = valorProjeto(p);
          const executado = p.valores.executado;
          return { ...item(p, p.datas.encerramento), executado, percentual: valor !== null && valor > 0 && executado !== null && executado <= valor ? (executado / valor) * 100 : null };
        })
        .sort(porDataENome),
    },
    parado: ondeEstaParado(cronogramas, hoje).porUnidade.slice(0, 5).map((u) => ({ unidade: u.unidade, itens: u.itens, dias: u.maisAntigo.dias })),
    entregas: { qtd: proximas.length, lista: proximas.map((p): ItemEntrega => ({ ...item(p, p.datas.encerramento), dias: diasEntre(hoje, p.datas.encerramento as string) })).sort(porDataENome) },
    recursos: captacao,
  };
}

/** R$ abreviado para números grandes: "R$ 1,3 bi", "R$ 350 mi", "R$ 12,5 mil"; abaixo de mil, o valor inteiro. */
export function reaisAbreviado(n: number): string {
  const f = (v: number, sufixo: string): string => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: v >= 100 ? 0 : 1 })} ${sufixo}`;
  const a = Math.abs(n);
  if (a >= 1e9) return f(n / 1e9, 'bi');
  if (a >= 1e6) return f(n / 1e6, 'mi');
  if (a >= 1e3) return f(n / 1e3, 'mil');
  return `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}
