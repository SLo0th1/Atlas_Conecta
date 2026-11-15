// Guia "Carteira de projetos" no mesmo formato dos demais módulos (colunas, linhas, ficha, busca e nota de fonte).
import { br, reais } from '../dados/formato.ts';
import type { Detalhe } from '../dados/detalhes.ts';
import type { Modulo } from '../dados/tipos.ts';
import { carregarCarteira } from './carga.ts';
import { MACROETAPAS, nomeMacroetapa } from './macroetapas.ts';
import type { Projeto } from './tipos.ts';
import { farol, fimDaMacroetapaAtual, resumoPorMacroetapa, saldoSemFonte, valorProjeto } from './visoes.ts';

const dash = '—';
const txt = (v: string | null | undefined): string => (v && v.trim() ? v : dash);
const rs = (v: number | null): string => (v === null ? dash : reais(v));
const sim = (v: boolean | null): string => (v === null ? dash : v ? 'Sim' : 'Não');
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function ordenar(l: Projeto[]): Projeto[] {
  const ordem = (p: Projeto) => (p.macroetapa === null ? 99 : Number(p.macroetapa));
  return [...l].sort((a, b) => {
    if (ordem(a) !== ordem(b)) return ordem(a) - ordem(b);
    const fa = fimDaMacroetapaAtual(a);
    const fb = fimDaMacroetapaAtual(b);
    if (fa === fb) return 0;
    if (!fa) return 1;
    if (!fb) return -1;
    return fa < fb ? -1 : 1;
  });
}

function detalheProjeto(p: Projeto, ficticio: boolean, arquivo: string, importadoEm: string): Detalhe {
  const v = p.valores;
  const r = p.recurso;
  const secoes: Detalhe['secoes'] = [
    {
      titulo: 'Resumo',
      itens: [
        `Órgão: ${txt(p.orgao)}`,
        `Responsável: ${txt(p.responsavel)}`,
        `Tipo: ${txt(p.tipo)}`,
        `Detalhamento: ${txt(p.detalhamento)}`,
        `Região: ${txt(p.regiao)}`,
        `Bairro: ${txt(p.bairro)}`,
        `Processos SEI: ${p.sei.length ? p.sei.join(', ') : dash}`,
        `Prioridade: ${txt(p.prioridade)}`,
        `Tem projeto: ${sim(p.tem_projeto)}`,
        `Status: ${txt(p.status_projeto)}`,
        `Macroetapa: ${nomeMacroetapa(p.macroetapa)}`,
        `Situação: ${cap(farol(p).cor)} (${farol(p).motivo})`,
        `Tipo de contratação: ${txt(p.tipo_contratacao)}`,
        `Órgão da contratação: ${txt(p.orgao_contratacao)}`,
      ],
    },
    {
      titulo: 'Valores e recursos',
      itens: [
        `Valor do projeto: ${rs(v.projeto)}`,
        `Valor da obra: ${rs(v.obra)}`,
        `Valor total: ${rs(v.total)}`,
        `Executado: ${rs(v.executado)}`,
        `Em captação: ${rs(v.em_captacao)}`,
        `Captado: ${rs(v.captado)}`,
        `Contrapartida: ${rs(v.contrapartida)}`,
        `Custeio do município: ${rs(v.custeio_municipio)}`,
        `Com solicitação financeira: ${rs(v.com_solicitacao_financeira)}`,
        `Origem do recurso: ${txt(r.origem)}`,
        `Tipo do recurso: ${txt(r.tipo)}`,
        `Situação do recurso: ${txt(r.situacao)}`,
        `Programa / fonte: ${txt(r.fonte_programa)}`,
        `Unidade financiadora: ${txt(r.unidade_financiadora)}`,
        `Termo de compromisso: ${sim(r.termo_compromisso)}${r.numero_termo ? ` (${r.numero_termo})` : ''}`,
        `Saldo sem fonte (estimado): ${rs(saldoSemFonte(p))}`,
      ],
    },
    {
      titulo: 'Datas previstas',
      itens: [
        `Chegada da demanda: ${br(p.datas.inicio)}`,
        ...MACROETAPAS.filter((m) => m.fimEm).map((m) => `Fim de ${m.nome}: ${br(p.datas[m.fimEm!] as string | null)}`),
        `Execução: ${p.datas.execucao_dias === null ? dash : `${p.datas.execucao_dias} dias`}`,
        `Entrega prevista: ${br(p.datas.encerramento)}`,
      ],
    },
    {
      titulo: 'Valores por ano',
      itens: Object.entries(p.por_ano).map(([ano, a]) => `${ano}: total ${rs(a.subtotal)} · federal ${rs(a.federal)} · municipal ${rs(a.municipal)} · outros ${rs(a.outros)}`),
    },
  ];
  const o = p.operacional;
  if (o) {
    secoes.push({
      titulo: 'Acompanhamento da SEINFRA',
      itens: [
        `Situação: ${txt(o.situacao)}`,
        `Reunião: ${txt(o.reuniao)}`,
        `Providências: ${txt(o.providencias)}`,
        `Previsão de entrega: ${txt(o.previsao_entrega)}`,
        ...Object.entries(o.cronograma_fisico).map(([a, x]) => `Cronograma físico ${a}: ${x === null ? dash : `${x}%`}`),
        ...Object.entries(o.cronograma_financeiro).map(([a, x]) => `Cronograma financeiro ${a}: ${rs(x)}`),
        ...Object.entries(o.regioes).map(([a, x]) => `Região ${a}: ${rs(x)}`),
      ],
    });
  }
  secoes.push({ titulo: 'Pendências de dado', itens: p.pendencias.length ? p.pendencias : ['Nenhuma'] });
  secoes.push({
    titulo: 'Origem do dado',
    itens: [`Aba: ${p.origem.aba}, linha ${p.origem.linha}`, `Arquivo: ${arquivo}`, `Importado em: ${br(importadoEm)}`, ...(ficticio ? ['Dados fictícios de exemplo'] : [])],
  });
  return { titulo: `${p.id} · ${p.nome}`, secoes };
}

function montarCarteira(): Modulo {
  const c = carregarCarteira();
  const lista = ordenar(c.projetos);
  const f = c.fonte;
  return {
    slug: 'projetos-carteira',
    title: 'Carteira de projetos',
    group: 'Projetos',
    columns: ['ID', 'Projeto', 'Órgão', 'Macroetapa', 'Valor', 'Entrega', 'Situação'],
    rows: lista.map((p) => {
      const fa = farol(p);
      return [p.id, p.nome, txt(p.orgao), nomeMacroetapa(p.macroetapa), valorProjeto(p) ?? dash, br(p.datas.encerramento), cap(fa.cor)];
    }),
    detalhes: lista.map((p) => detalheProjeto(p, f.ficticio, f.arquivo, f.importado_em)),
    busca: lista.map((p) => [p.nome, p.orgao, p.sei.join(' '), p.regiao, p.bairro, p.detalhamento, nomeMacroetapa(p.macroetapa)].filter(Boolean).join(' ')),
    fields: [],
    source: 'govnexa-carteira',
    ficticio: f.ficticio,
    fonte: f.ficticio ? 'Dados fictícios de exemplo (a carteira real entra pelo repositório privado).' : `Planilha ${f.arquivo}, importada em ${br(f.importado_em)}.`,
  };
}

/** Página inicial do módulo Projetos: resumo real da carteira por macroetapa (quantidade, valor e situação). */
function montarInicio(): Modulo {
  const c = carregarCarteira();
  const grupos = resumoPorMacroetapa(c);
  const conta = (ps: Projeto[], cor: string) => ps.filter((p) => farol(p).cor === cor).length;
  const linha = (nome: string, ps: Projeto[], valor: number) => [nome, ps.length, valor || dash, conta(ps, 'verde'), conta(ps, 'amarelo'), conta(ps, 'vermelho')];
  const total = c.projetos.reduce((s, p) => s + (valorProjeto(p) ?? 0), 0);
  return {
    slug: 'projetos',
    title: 'Projetos · Início',
    group: 'Projetos',
    columns: ['Macroetapa', 'Projetos', 'Valor', 'Verde', 'Amarelo', 'Vermelho'],
    rows: [...grupos.map((g) => linha(g.nome, g.projetos, g.valor)), linha('Total da carteira', c.projetos, total)],
    fields: [],
    source: 'govnexa-carteira',
    ficticio: c.fonte.ficticio,
    fonte: c.fonte.ficticio ? 'Dados fictícios de exemplo (a carteira real entra pelo repositório privado).' : `Planilha ${c.fonte.arquivo}, importada em ${br(c.fonte.importado_em)}.`,
  } as Modulo;
}

/** Troca o item 'projetos-carteira' do catálogo pelo módulo completo montado a partir da Carteira. */
export function comCarteira<T extends { slug: string }>(lista: T[]): T[] {
  return lista.map((m) => (m.slug === 'projetos-carteira' ? (montarCarteira() as unknown as T) : m.slug === 'projetos' ? (montarInicio() as unknown as T) : m));
}
