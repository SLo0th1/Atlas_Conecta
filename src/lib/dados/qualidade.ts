// Qualidade dos dados: frescor de cada fonte, falhas de coleta e o MOTIVO (regra do dono: sempre sinalizar dados
// muito defasados, entender o motivo e corrigir). Alimenta a guia "Qualidade dos dados" e os alertas de fonte.
import { dados, type Documento } from './index.ts';
import { IBGE } from './municipio.ts';
import type { Detalhe } from './detalhes.ts';
import type { Modulo } from './tipos.ts';

export type Situacao = 'Em dia' | 'Atenção: defasada' | 'Vencido: muito defasada' | 'Atenção: falha na coleta' | 'Sem carga';

type FonteCfg = {
  id: string;
  nome: string;
  doc: () => Documento | undefined;
  coletor?: string; // nome registrado em data/core/status-coletas.json (coletores/rodar.ts)
  limite: number; // dias de idade da coleta a partir dos quais a fonte é considerada defasada
  frequencia: string;
  manual?: boolean; // carga que depende de uma pessoa (não é automática)
  opcional?: boolean; // fonte ainda não adotada: só aparece quando existe uma carga
  ficha: string;
  oQueTraz: string;
};

/** Limites por fonte: derivam da frequência de publicação. Provisórios; "muito defasada" = 2x o limite. */
export const FONTES: FonteCfg[] = [
  { id: 'transferegov', nome: 'Transferegov (convênios)', doc: () => dados.acompanhamento(IBGE), coletor: 'transferegov', limite: 3, frequencia: 'diária', ficha: 'transferegov-arquivos', oQueTraz: 'Convênios, desembolsos, empenhos, aditivos e emendas do município.' },
  { id: 'programas', nome: 'Programas abertos (Transferegov)', doc: () => dados.programasAbertos(IBGE), coletor: 'programas-abertos', limite: 3, frequencia: 'diária', ficha: 'novo-pac-editais', oQueTraz: 'Programas com prazo aberto, texto oficial e histórico de propostas.' },
  { id: 'cauc', nome: 'CAUC (regularidade)', doc: () => dados.cauc(IBGE), coletor: 'cauc', limite: 3, frequencia: 'diária (dias úteis)', ficha: 'cauc', oQueTraz: 'Situação do município nos 28 requisitos para receber transferências.' },
  { id: 'fns', nome: 'FNS (repasses da saúde)', doc: () => dados.fns(IBGE), coletor: 'fns', limite: 3, frequencia: 'diária', ficha: 'fns', oQueTraz: 'Repasses fundo a fundo ao Fundo Municipal e comparativo com as capitais.' },
  { id: 'siconfi', nome: 'SICONFI (finanças)', doc: () => dados.siconfi(IBGE), coletor: 'siconfi', limite: 45, frequencia: 'bimestral/quadrimestral (a coleta é diária)', ficha: 'siconfi', oQueTraz: 'RREO e RGF: receita, despesa com pessoal e limites da LRF.' },
  { id: 'ibge', nome: 'IBGE (municípios e população)', doc: () => { try { return { proveniencia: dados.proveniencia('ibge-municipios') } as Documento; } catch { return undefined; } }, coletor: 'ibge', limite: 45, frequencia: 'mensal', ficha: 'ibge', oQueTraz: 'Tabela de municípios, capitais e população.' },
  { id: 'educacao', nome: 'INEP (educação)', doc: () => dados.educacao(IBGE), coletor: 'educacao', limite: 400, frequencia: 'anual', manual: true, ficha: 'fnde-inep', oQueTraz: 'Censo Escolar e IDEB.' },
  { id: 'saneamento', nome: 'SINISA (saneamento)', doc: () => dados.saneamento(IBGE), coletor: 'saneamento', limite: 400, frequencia: 'anual', manual: true, ficha: 'sinisa', oQueTraz: 'Água, esgoto, resíduos e drenagem.' },
  { id: 'cnes', nome: 'CNES (estabelecimentos de saúde)', doc: () => dados.cnes(IBGE), coletor: 'cnes', limite: 45, frequencia: 'mensal', manual: true, opcional: true, ficha: 'datasus', oQueTraz: 'Unidades de saúde e leitos.' },
  { id: 'dou', nome: 'DOU (Diário Oficial da União)', doc: () => dados.citacoesDou(IBGE), limite: 45, frequencia: 'mensal (arquivo baixado no navegador)', manual: true, ficha: 'dou-base-dados', oQueTraz: 'Publicações que citam o município e os CNPJs monitorados.' },
];

export type Avaliacao = {
  id: string; nome: string; situacao: Situacao; coleta: string | null; referencia: string; idade: number | null; limite: number;
  motivo: string; acao: string; erro: string | null; ultimaTentativa: string | null; resultado: string; cfg: FonteCfg;
};

/** Classificação pura (testada): idade em dias, limite da fonte e se a última coleta falhou. */
export function classificar(idade: number | null, limite: number, falhou: boolean): Situacao {
  if (idade === null) return 'Sem carga';
  if (idade > limite * 2) return 'Vencido: muito defasada';
  if (falhou) return 'Atenção: falha na coleta';
  if (idade > limite) return 'Atenção: defasada';
  return 'Em dia';
}

const dia = (iso: string): string => { const [a, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${a}`; };
/** Datas HTTP (ex.: "Mon, 09 Nov 2026 11:13:03 GMT") viram dd/mm/aaaa; o resto é encurtado. */
const limpaRef = (v: unknown): string => {
  const s = String(v).split(' (')[0];
  if (/GMT$/.test(s) && !Number.isNaN(Date.parse(s))) return dia(new Date(s).toISOString());
  return s;
};
const resumoReferencia = (r: unknown): string => {
  if (r === null || r === undefined) return '—';
  if (typeof r === 'string') return limpaRef(r).slice(0, 80);
  if (Array.isArray(r)) return String(r[0] ?? '—').replace(/^.*[\\/]/, '').slice(0, 60);
  const vals = Object.values(r as Record<string, unknown>).map(limpaRef);
  return [...new Set(vals)].join('; ').slice(0, 80);
};

export function avaliarFontes(agora: Date = new Date()): Avaliacao[] {
  const status = (dados.statusColetas()?.coletores ?? {}) as Record<string, Documento>;
  return FONTES.filter((cfg) => !cfg.opcional || cfg.doc()).map((cfg) => {
    const doc = cfg.doc();
    const coletaIso = doc?.proveniencia?.data_coleta ? String(doc.proveniencia.data_coleta) : null;
    const idade = coletaIso ? Math.floor((agora.getTime() - Date.parse(coletaIso)) / 86400000) : null;
    const st = cfg.coletor ? status[cfg.coletor] : undefined;
    const falhou = st?.resultado === 'falha';
    const situacao = classificar(idade, cfg.limite, falhou);
    let motivo = 'Dentro do prazo.';
    let acao = 'Nenhuma ação necessária.';
    if (situacao !== 'Em dia') {
      if (idade === null) { motivo = 'Ainda não houve nenhuma coleta desta fonte.'; acao = 'Executar o coletor correspondente.'; }
      else if (falhou) { motivo = `A última coleta automática falhou${st?.tentativas ? ` após ${st.tentativas} tentativas` : ''}: ${st?.erro ?? 'motivo não registrado'}.`; acao = 'Verificar se a fonte oficial está no ar ou mudou de formato (ver a ficha da fonte); corrigir o coletor se o formato mudou.'; }
      else if (cfg.manual) { motivo = `Carga manual (${cfg.frequencia}) pendente: a última foi há ${idade} dias.`; acao = 'Executar o coletor ou baixar o arquivo mais recente e atualizar a carga.'; }
      else if (!st) { motivo = 'A coleta automática não registrou execução recente (a atualização diária pode não estar publicada).'; acao = 'Conferir o workflow "Atualizar dados do bloco Captação" no GitHub e mesclar o PR de dados pendente.'; }
      else { motivo = `A coleta rodou com sucesso, mas os dados publicados no site são de ${idade} dias atrás: o PR de dados ainda não foi mesclado.`; acao = 'Mesclar o PR "Dados atualizados (coleta automática)".'; }
    }
    return { id: cfg.id, nome: cfg.nome, situacao, coleta: coletaIso, referencia: resumoReferencia(doc?.proveniencia?.data_referencia), idade, limite: cfg.limite, motivo, acao, erro: falhou ? String(st?.erro ?? '') : null, ultimaTentativa: st?.ultima_tentativa ?? null, resultado: st ? String(st.resultado) : 'sem registro', cfg };
  });
}

export function montarQualidade(): Modulo {
  const av = avaliarFontes();
  const ruins = av.filter((a) => a.situacao !== 'Em dia');
  const detalhes: Detalhe[] = av.map((a) => ({
    titulo: a.nome,
    secoes: [
      { titulo: 'Situação', itens: [`${a.situacao}`, `Última coleta: ${a.coleta ? dia(a.coleta) : 'sem carga'}${a.idade !== null ? ` (há ${a.idade} dia(s))` : ''}`, `Referência dos dados: ${a.referencia}`, `Limite desta fonte: ${a.limite} dia(s); considerada muito defasada acima de ${a.limite * 2}`] },
      { titulo: 'O que esta fonte traz', texto: `${a.cfg.oQueTraz} Frequência: ${a.cfg.frequencia}.` },
      { titulo: 'Motivo e ação', itens: [a.motivo, a.acao] },
      { titulo: 'Última tentativa de coleta', itens: [`Resultado: ${a.resultado}`, ...(a.ultimaTentativa ? [`Quando: ${dia(a.ultimaTentativa)}`] : []), ...(a.erro ? [`Erro: ${a.erro}`] : [])] },
    ],
    links: [{ rotulo: `Ficha técnica da fonte (docs/fontes/${a.cfg.ficha}.md)`, url: `https://github.com/SLo0th1/Atlas_Conecta/blob/main/docs/fontes/${a.cfg.ficha}.md` }],
  }));
  return {
    slug: 'captacao-qualidade', title: 'Qualidade dos dados', group: 'Captação',
    columns: ['Fonte', 'Última coleta', 'Referência dos dados', 'Idade (dias)', 'Limite (dias)', 'Situação', 'Motivo'],
    rows: av.map((a) => [a.nome, a.coleta ? dia(a.coleta) : 'sem carga', a.referencia, a.idade ?? '—', a.limite, a.situacao, a.motivo]),
    detalhes, fields: [], source: 'captacao-qualidade',
    fonte: `${ruins.length ? `${ruins.length} de ${av.length} fontes precisam de atenção. ` : `Todas as ${av.length} fontes estão em dia. `}Fonte defasada, falha de coleta e o motivo aparecem aqui e também na guia Alertas. Limites provisórios: ver o detalhe de cada fonte.`,
  };
}
