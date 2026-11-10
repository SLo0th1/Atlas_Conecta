// Conteúdo do "Ver detalhes" de um convênio em execução (aba Acompanhamento): valores, prazos, execução financeira,
// aditivos, emendas e pontos de atenção, tudo a partir dos arquivos abertos do Transferegov já coletados.
import type { Documento } from './index.ts';
import { br, diasAte, reais } from './formato.ts';
import type { Detalhe, Secao } from './detalhes.ts';

const DIAS_SEM_DESEMBOLSO = 180; // mesmo parâmetro provisório das regras de alerta (docs/regras-alertas.md)

const moeda = (n: number | null | undefined): string => (n === null || n === undefined ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const ordem = (l: Documento[], campo = 'data') => [...l].sort((a, b) => String(b[campo]).split('/').reverse().join('').localeCompare(String(a[campo]).split('/').reverse().join('')));

export function detalheConvenio(c: Documento): Detalhe {
  const dias = diasAte(c.vigencia_fim);
  const ass = diasAte(c.assinatura);
  const desembolsos = ordem((c.desembolsos as Documento[]) ?? []);
  const empenhos = ordem((c.empenhos as Documento[]) ?? []);
  const aditivos = (c.aditivos as Documento[]) ?? [];
  const emendas = (c.emendas as Documento[]) ?? [];
  const pctLiberado = c.valor_repasse ? Math.round(((c.valor_desembolsado ?? 0) / c.valor_repasse) * 1000) / 10 : null;
  const contrapartidaPct = c.valor_global ? Math.round(((c.valor_contrapartida ?? 0) / c.valor_global) * 1000) / 10 : null;

  const atencao: string[] = [];
  if (dias !== null && dias < 0) atencao.push(`Vigência vencida há ${-dias} dias: verificar prorrogação ou prestação de contas.`);
  else if (dias !== null && dias <= 90) atencao.push(`Vigência termina em ${dias} dias (${br(c.vigencia_fim)}): avaliar prorrogação ou aditivo.`);
  if ((c.valor_desembolsado ?? 0) === 0 && ass !== null && -ass > DIAS_SEM_DESEMBOLSO)
    atencao.push(`Assinado há ${-ass} dias e sem nenhum desembolso (${reais(c.valor_repasse ?? 0)} pactuados): verificar cláusula suspensiva, documentação ou pendência junto ao concedente.`);
  if (pctLiberado !== null && pctLiberado > 0 && pctLiberado < 100 && dias !== null && dias <= 180)
    atencao.push(`Só ${pctLiberado}% do repasse foi liberado e a vigência termina em ${dias} dias.`);
  if (!atencao.length) atencao.push('Nenhum ponto de atenção pelas regras atuais.');

  const secoes: Secao[] = [
    { titulo: 'Do que se trata', texto: `${c.objeto || 'Objeto não informado.'}${c.proponente ? ` Proponente: ${c.proponente}.` : ''}` },
    {
      titulo: 'Quem concede',
      texto: `${c.orgao_superior ?? '—'}${c.orgao && c.orgao !== c.orgao_superior ? ` / ${c.orgao}` : ''}. Modalidade: ${c.modalidade ?? '—'}.`,
    },
    {
      titulo: 'Valores',
      itens: [
        `Valor global: ${moeda(c.valor_global)}`,
        `Repasse pactuado (União): ${moeda(c.valor_repasse)}`,
        `Contrapartida: ${moeda(c.valor_contrapartida)}${contrapartidaPct !== null ? ` (${contrapartidaPct}% do valor global)` : ''}`,
        `Já liberado (desembolsado): ${moeda(c.valor_desembolsado)}${pctLiberado !== null ? ` (${pctLiberado}% do repasse)` : ''}`,
        `Saldo a liberar: ${moeda(c.saldo_a_liberar)}`,
      ],
    },
    {
      titulo: 'Datas e prazos',
      itens: [
        `Assinatura: ${br(c.assinatura)}`,
        `Fim da vigência: ${br(c.vigencia_fim)}${dias === null ? '' : dias < 0 ? ` (vencida há ${-dias} dias)` : ` (faltam ${dias} dias)`}`,
        `Limite para prestação de contas: ${br(c.limite_prestacao_contas)}`,
        `Aditivos registrados: ${c.qtd_aditivos ?? aditivos.length}`,
      ],
    },
    {
      titulo: `Execução financeira (${desembolsos.length} desembolso${desembolsos.length === 1 ? '' : 's'})`,
      itens: desembolsos.length ? desembolsos.slice(0, 8).map((d) => `${br(d.data)}: ${moeda(d.valor)}`) : ['Nenhum desembolso registrado até a coleta.'],
    },
    ...(empenhos.length
      ? [{ titulo: `Empenhos (${empenhos.length})`, itens: empenhos.slice(0, 6).map((e) => `${e.numero} em ${br(e.data)} — ${e.situacao ?? '—'} — ${moeda(e.valor)}`) }]
      : []),
    ...(aditivos.length
      ? [{ titulo: 'Aditivos e prorrogações', itens: aditivos.slice(0, 8).map((a) => `${a.numero} (${a.tipo ?? '—'}), assinado em ${br(a.assinatura)}${a.fim ? `, nova vigência até ${br(a.fim)}` : ''}${a.valor_global ? `, valor ${moeda(a.valor_global)}` : ''}`) }]
      : []),
    ...(emendas.length
      ? [{ titulo: 'Emendas parlamentares vinculadas', itens: emendas.slice(0, 6).map((e) => `${e.numero} — ${e.parlamentar ?? 'autor não informado'}${e.tipo_parlamentar ? ` (${e.tipo_parlamentar})` : ''}${e.valor_repasse ? ` — ${moeda(e.valor_repasse)}` : ''}`) }]
      : []),
    { titulo: 'O que observar', itens: atencao },
    {
      titulo: 'Como conferir',
      texto: `No portal de transferências da União, abra Acesso livre > Consultar Pré-Instrumentos/Instrumentos e pesquise o número ${c.nr_convenio}. Fonte dos números: arquivos abertos do Transferegov.`,
    },
  ];
  return { titulo: `Convênio ${c.nr_convenio}`, secoes, link: { rotulo: 'Abrir o portal de transferências da União', url: 'https://www.gov.br/transferegov/pt-br' } };
}
