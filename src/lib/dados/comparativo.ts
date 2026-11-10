// Guia "Comparativo": repasses de saúde do Fundo Nacional de Saúde às 27 capitais (Plano Mestre, 5.3):
// valor total, por habitante e quais grupos de repasse outras capitais recebem e o município não (oportunidade).
import { dados, type Documento } from './index.ts';
import { br } from './formato.ts';
import { IBGE } from './alertas.ts';
import type { Detalhe, Secao } from './detalhes.ts';
import type { Modulo } from './tipos.ts';

const moeda = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const mediana = (v: number[]) => (v.length ? [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)] : 0);
const dataColeta = (d?: Documento) => (d?.proveniencia?.data_coleta ? br(String(d.proveniencia.data_coleta)) : 'sem carga');

export function montarComparativo(): Modulo | null {
  const ano = new Date().getFullYear();
  const cap = dados.fnsCapitais(ano) ?? dados.fnsCapitais(ano - 1);
  if (!cap) return null;
  const anoRef = Number(String(cap.proveniencia.data_referencia).match(/\d{4}/)?.[0] ?? ano);
  const capitais = cap.capitais as Documento[]; // já ordenadas por valor por habitante
  const anteriores = [anoRef - 1, anoRef - 2].map((a) => ({ ano: a, doc: dados.fnsCapitais(a) })).filter((x) => x.doc);
  const piloto = capitais.find((c) => c.codigo_ibge === IBGE);
  if (!piloto) return null;
  const posPiloto = capitais.indexOf(piloto) + 1;

  // grupos de repasse: quanto cada capital recebe, por habitante
  const chave = (g: Documento) => `${g.bloco} — ${g.grupo}`;
  const porGrupo = new Map<string, Map<number, number>>();
  for (const c of capitais) for (const g of (c.grupos as Documento[]) ?? []) {
    const k = chave(g);
    const m = porGrupo.get(k) ?? new Map<number, number>();
    m.set(c.codigo_ibge, (m.get(c.codigo_ibge) ?? 0) + (g.valor_bruto ?? 0));
    porGrupo.set(k, m);
  }
  const perCapita = (c: Documento, v: number) => (c.populacao ? v / c.populacao : 0);
  const analise = [...porGrupo.entries()].map(([k, m]) => {
    const valores = capitais.map((c) => ({ c, v: m.get(c.codigo_ibge) ?? 0 }));
    const recebem = valores.filter((x) => x.v > 0);
    const meu = m.get(IBGE) ?? 0;
    return {
      grupo: k, meu, meuPc: perCapita(piloto, meu), recebem: recebem.length,
      medianaPc: mediana(recebem.map((x) => perCapita(x.c, x.v))),
    };
  });
  const naoRecebe = analise.filter((a) => a.meu === 0 && a.recebem >= 3).sort((a, b) => b.recebem - a.recebem);
  const abaixo = analise.filter((a) => a.meu > 0 && a.medianaPc > 0 && a.meuPc < a.medianaPc * 0.7).sort((a, b) => a.meuPc / a.medianaPc - b.meuPc / b.medianaPc);

  const detalhes: Detalhe[] = capitais.map((c, i) => {
    const ehPiloto = c.codigo_ibge === IBGE;
    const serie = [
      ...anteriores.slice().reverse().map((x) => { const l = (x.doc!.capitais as Documento[]).find((y) => y.codigo_ibge === c.codigo_ibge); return l ? `${x.ano}: ${moeda(l.total_bruto)} (${moeda(l.per_capita)} por habitante)` : null; }),
      `${anoRef}: ${moeda(c.total_bruto)} (${moeda(c.per_capita)} por habitante)`,
    ].filter(Boolean) as string[];
    const grupos = ((c.grupos as Documento[]) ?? []).slice().sort((a, b) => (b.valor_bruto ?? 0) - (a.valor_bruto ?? 0)).slice(0, 10).map((g) => `${chave(g)}: ${moeda(g.valor_bruto)} (${moeda(perCapita(c, g.valor_bruto))} por habitante)`);
    const secoes: Secao[] = [
      { titulo: 'O que é', texto: `Repasses fundo a fundo do Ministério da Saúde ao Fundo Municipal de Saúde de ${c.nome}/${c.uf} em ${anoRef} (valor bruto até a data da coleta). O valor por habitante usa a população estimada do IBGE e permite comparar capitais de portes diferentes.` },
      { titulo: 'Posição', itens: [`${i + 1}º de ${capitais.length} capitais por habitante`, `Total: ${moeda(c.total_bruto)}; por habitante: ${moeda(c.per_capita)}; população: ${Number(c.populacao).toLocaleString('pt-BR')}`, ...(ehPiloto ? [] : [`Diferença para Goiânia: ${moeda(c.per_capita - piloto.per_capita)} por habitante (${c.per_capita > piloto.per_capita ? 'recebe mais' : 'recebe menos'} que Goiânia)`])] },
      { titulo: 'Série dos últimos anos', itens: serie },
      { titulo: 'Maiores grupos de repasse', itens: grupos },
    ];
    if (ehPiloto) {
      secoes.push(
        { titulo: `Grupos que outras capitais recebem e Goiânia não (${naoRecebe.length})`, itens: naoRecebe.length ? naoRecebe.slice(0, 15).map((a) => `${a.grupo}: recebido por ${a.recebem} capitais (mediana ${moeda(a.medianaPc)} por habitante)`) : ['Nenhum grupo encontrado nesse critério.'] },
        { titulo: `Grupos em que Goiânia recebe bem menos por habitante que as capitais (abaixo de 70% da mediana) (${abaixo.length})`, itens: abaixo.length ? abaixo.slice(0, 15).map((a) => `${a.grupo}: Goiânia ${moeda(a.meuPc)} por habitante; mediana das capitais ${moeda(a.medianaPc)}`) : ['Nenhum grupo encontrado nesse critério.'] },
        { titulo: 'Como usar', texto: 'Os grupos que outras capitais recebem e Goiânia não podem indicar programas de saúde ainda não acessados (ou que a cidade não tem direito a receber). É ponto de partida para a análise da Secretaria de Saúde, não uma conclusão.' },
      );
    }
    secoes.push({ titulo: 'Fonte', texto: `Ministério da Saúde, Fundo Nacional de Saúde (Consulta Consolidada, repasse municipal), exercício ${anoRef}; coleta em ${dataColeta(cap)}. População: IBGE (estimativa).` });
    return { titulo: `${i + 1}º — ${c.nome}/${c.uf}`, secoes };
  });

  const rows = capitais.map((c, i) => [
    i + 1, `${c.nome}`, c.uf, Number(c.populacao), Number(c.total_bruto), Number(c.per_capita),
    c.codigo_ibge === IBGE ? 'Município piloto' : c.per_capita > piloto.per_capita ? 'Recebe mais por habitante' : 'Recebe menos por habitante',
  ]);
  return {
    slug: 'captacao-comparativo', title: 'Comparativo', group: 'Captação',
    columns: ['Posição', 'Capital', 'UF', 'População', 'Valor repasse FNS', 'Valor por habitante', 'Comparação com Goiânia'], rows, detalhes, fields: [], source: 'captacao-comparativo',
    fonte: `Repasses do Fundo Nacional de Saúde ao Fundo Municipal das 27 capitais, exercício ${anoRef}; Goiânia em ${posPiloto}º por habitante. ${naoRecebe.length} grupos de repasse que 3 ou mais capitais recebem e Goiânia não (ver detalhes de Goiânia). Fonte: FNS; coleta em ${dataColeta(cap)}.`,
  };
}
