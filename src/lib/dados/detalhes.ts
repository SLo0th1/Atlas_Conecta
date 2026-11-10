// Conteúdo do "Ver detalhes" de uma oportunidade (programa aberto): explica o programa em linguagem simples.
// Usa só dados coletados (programas, histórico de propostas, CAUC) e textos-padrão marcados como roteiro geral.
import { dados, type Documento } from './index.ts';
import { br, diasAte, nomeTema, reais } from './formato.ts';

const IBGE = 5208707; // município piloto; a seleção de município entra com o multimunicípio

export type Secao = { titulo: string; texto?: string; itens?: string[] };
export type Detalhe = { titulo: string; secoes: Secao[]; link?: { rotulo: string; url: string } };

const EXPLICA_MODALIDADE: Record<string, string> = {
  CONVENIO:
    'Convênio: o órgão federal repassa o recurso à prefeitura e acompanha a execução; a prefeitura executa o objeto, pode precisar oferecer contrapartida e presta contas ao final.',
  'CONTRATO DE REPASSE':
    'Contrato de repasse: o recurso federal passa por uma instituição financeira oficial (a mandatária, em geral a Caixa Econômica Federal), que analisa, libera por etapas e fiscaliza; é comum em obras e infraestrutura.',
};
const PUBLICO: Record<string, string> = {
  'Administração Pública Municipal': 'prefeituras',
  'Administração Pública Estadual ou do Distrito Federal': 'governos estaduais e do DF',
  'Consórcio Público': 'consórcios públicos',
  'Organização da Sociedade Civil': 'organizações da sociedade civil',
};

export function detalheOportunidade(p: Documento): Detalhe {
  const quando = (iso: string | null): string => {
    const d = diasAte(iso);
    if (d === null) return '';
    return d < 0 ? ' (encerrado)' : d === 0 ? ' (vence hoje)' : ` (faltam ${d} dia${d === 1 ? '' : 's'})`;
  };
  const prazos: string[] = [];
  if (p.prazos.proposta_ate) prazos.push(`Recebimento de propostas até ${br(p.prazos.proposta_ate)}${quando(p.prazos.proposta_ate)}`);
  if (p.prazos.emendas_ate) prazos.push(`Recebimento de propostas ligadas a emendas parlamentares até ${br(p.prazos.emendas_ate)}${quando(p.prazos.emendas_ate)}`);
  if (p.prazos.beneficiario_especifico_ate) prazos.push(`Recebimento para beneficiário específico até ${br(p.prazos.beneficiario_especifico_ate)}${quando(p.prazos.beneficiario_especifico_ate)}`);
  const soEmenda = !p.prazos.proposta_ate && !!p.prazos.emendas_ate;

  const h = p.historico ?? {};
  const municipais: number = h.propostas_municipais ?? 0;
  const v = h.valor_repasse_municipal ?? {};
  const temas = (p.temas as string[]) ?? [];
  const secretarias = dados.listarSecretarias().filter((s) => temas.some((t) => s.temas.includes(t))).map((s) => s.nome_generico);
  const cauc = dados.cauc(IBGE);
  const ufs = (p.ufs as string[]) ?? [];

  const secoes: Secao[] = [
    {
      titulo: 'Do que se trata',
      texto: `${p.nome}. Programa do ${p.orgao_superior}, código ${p.codigo}, disponibilizado no Transferegov em ${br(p.disponibilizado_em)}${p.acao_orcamentaria ? `, vinculado à ação orçamentária ${p.acao_orcamentaria}` : ''}.${p.subtipo_descricao ? ` ${p.subtipo_descricao}` : ''} O arquivo aberto do Transferegov não traz o objetivo detalhado do programa: leia o texto oficial completo no link abaixo.`,
    },
    soEmenda
      ? {
          titulo: 'Em linguagem simples',
          texto:
            'O prazo aberto é o de propostas ligadas a EMENDAS PARLAMENTARES. Na prática, a prefeitura só consegue enviar proposta se algum parlamentar tiver indicado uma emenda para o município nesse programa; sem emenda indicada, não há o que enviar. (Leitura baseada no tipo de prazo do arquivo; confirmar no programa.)',
        }
      : { titulo: 'Em linguagem simples', texto: 'Há prazo aberto para a prefeitura apresentar proposta e plano de trabalho a este programa do governo federal.' },
    { titulo: 'Prazos', itens: prazos },
    { titulo: 'Tipo de transferência', texto: EXPLICA_MODALIDADE[String(p.modalidade)] ?? `Modalidade: ${p.modalidade}.` },
    {
      titulo: 'Quem pode propor',
      texto: `Podem propor: ${((p.publico as string[]) ?? []).map((n) => PUBLICO[n] ?? n).join(', ')}. Abrange Goiás: ${ufs.includes('GO') || ufs.includes('') ? 'sim' : 'não'}.`,
    },
    {
      titulo: 'Temas e secretarias envolvidas',
      texto: temas.length
        ? `Tema(s): ${temas.map(nomeTema).join(', ')}. Secretarias que costumam ser responsáveis: ${secretarias.join(', ') || 'a definir'}. (Classificação por palavras-chave, provisória.)`
        : 'Tema ainda não classificado; leia o texto oficial para definir a secretaria responsável.',
    },
    {
      titulo: 'Quem já propôs a este programa',
      itens: [
        `Propostas registradas: ${h.propostas_total ?? 0} (${municipais} de prefeituras, ${h.municipios_do_estado_total ?? 0} de municípios de Goiás).`,
        ...(v.mediana ? [`Valor de repasse pedido pelas prefeituras: mínimo ${reais(v.minimo)}, mediana ${reais(v.mediana)}, máximo ${reais(v.maximo)}.`] : []),
        ...((h.municipios_do_estado ?? []).length
          ? [`Municípios de Goiás: ${(h.municipios_do_estado as Documento[]).map((m) => `${m.municipio}${m.valor ? ` (${reais(m.valor)})` : ''}`).join('; ')}.`]
          : []),
        ...((h.capitais_que_propuseram ?? []).length ? [`Capitais que propuseram: ${(h.capitais_que_propuseram as string[]).join(', ')}.`] : []),
        ...(municipais === 0 ? ['Nenhuma prefeitura registrou proposta até a coleta: pode indicar programa novo, restrito ou de baixa adesão.'] : []),
      ],
    },
    {
      titulo: 'Situação do município para receber (CAUC)',
      texto: cauc
        ? `Regularidade fiscal do município: ${cauc.situacao_geral === 'regular' ? 'regular' : 'com pendências'} (referência ${cauc.proveniencia.data_referencia}). Pendência no CAUC bloqueia transferências voluntárias.`
        : 'Sem carga do CAUC.',
    },
    {
      titulo: 'Como pedir (roteiro geral)',
      itens: [
        'Confirmar com a secretaria responsável a necessidade e a elegibilidade.',
        'Conferir a regularidade no CAUC e o cadastro da prefeitura (proponente) no Transferegov.',
        'No portal de transferências da União, abrir Acesso livre > Consultar Programas e localizar o programa pelo código.',
        'Ler o texto oficial: objeto, valores, contrapartida e documentos.',
        'Lançar a proposta e o plano de trabalho no sistema, com login gov.br de quem responde pela prefeitura.',
        'Acompanhar a análise e atender às pendências até a assinatura.',
      ],
    },
    {
      titulo: 'Documentos geralmente exigidos (confirmar no programa)',
      itens: [
        'Plano de trabalho com metas, etapas e cronograma físico-financeiro.',
        'Projeto básico ou termo de referência, quando houver obra ou serviço.',
        'Declarações e certidões de regularidade.',
        'Comprovação de contrapartida, quando exigida.',
      ],
    },
  ];
  return {
    titulo: p.nome,
    secoes,
    link: { rotulo: 'Abrir o portal de transferências da União (Acesso livre > Consultar Programas)', url: 'https://www.gov.br/transferegov/pt-br' },
  };
}
