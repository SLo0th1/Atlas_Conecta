// Geração dos alertas do bloco Captação (docs/regras-alertas.md) a partir dos dados reais coletados.
// Cada alerta carrega o detalhe: por que foi gerado, a regra aplicada, os números e onde conferir.
import { dados, type Documento } from './index.ts';
import { br, curto, diasAte, reais } from './formato.ts';
import type { Secao } from './detalhes.ts';

export { IBGE } from './municipio.ts';
import { IBGE } from './municipio.ts';
import { avaliarFontes } from './qualidade.ts';

// Parâmetros das regras (docs/regras-alertas.md). Valores provisórios, exceto o de 180 dias, mantido pelo dono em 2026-11-10.
export const DIAS_VIGENCIA = [90, 60, 30, 15];
export const DIAS_SEM_DESEMBOLSO = 180;
export const DIAS_PRAZO_PROGRAMA = 15;
export const DIAS_DEFASAGEM = 3;

export type Alerta = {
  tipo: string;
  alerta: string;
  referencia: string;
  gravidade: 'Alta' | 'Média' | 'Baixa';
  acao: string;
  responsavel: string;
  detalhe: Secao[];
};

const moeda = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

export function gerarAlertas(): Alerta[] {
  const lista: Alerta[] = [];
  const ac = dados.acompanhamento(IBGE);

  for (const c of ((ac?.convenios as Documento[]) ?? []).filter((x) => /^Em execu/i.test(x.situacao ?? ''))) {
    const dias = diasAte(c.vigencia_fim);
    const limite = dias === null ? null : DIAS_VIGENCIA.find((l) => dias <= l && dias >= 0);
    const resumoConvenio: Secao = {
      titulo: `Convênio ${c.nr_convenio}`,
      itens: [
        `Objeto: ${curto(c.objeto, 220)}`,
        `Concedente: ${c.orgao_superior ?? '—'} (${c.modalidade ?? '—'})`,
        `Repasse pactuado: ${moeda(c.valor_repasse)}; já liberado: ${moeda(c.valor_desembolsado)}; saldo a liberar: ${moeda(c.saldo_a_liberar)}`,
        `Assinatura: ${br(c.assinatura)}; vigência até: ${br(c.vigencia_fim)}; limite da prestação de contas: ${br(c.limite_prestacao_contas)}`,
      ],
    };
    if (limite !== undefined && limite !== null)
      lista.push({
        tipo: 'Vigência', alerta: `Vigência termina em ${dias} dias (${br(c.vigencia_fim)})`, referencia: `Convênio ${c.nr_convenio}: ${curto(c.objeto, 60)}`,
        gravidade: dias! <= 30 ? 'Alta' : 'Média', acao: 'Avaliar e solicitar prorrogação ou aditivo', responsavel: 'Captação',
        detalhe: [
          { titulo: 'Por que este alerta', texto: `A vigência do convênio termina em ${dias} dias. Regra: avisar quando faltar 90, 60, 30 ou 15 dias (gravidade Alta quando faltarem 30 dias ou menos).` },
          resumoConvenio,
          { titulo: 'O que fazer', itens: ['Verificar se o objeto será concluído dentro do prazo.', 'Se não, pedir prorrogação de vigência (termo aditivo) ao concedente antes do vencimento.', 'Conferir a situação no portal: Acesso livre > Consultar Pré-Instrumentos/Instrumentos.'] },
        ],
      });
    const ass = diasAte(c.assinatura);
    if ((c.valor_desembolsado ?? 0) === 0 && ass !== null && -ass > DIAS_SEM_DESEMBOLSO)
      lista.push({
        tipo: 'Sem desembolso', alerta: `Pactuado sem desembolso há ${-ass} dias`, referencia: `Convênio ${c.nr_convenio}: ${curto(c.objeto, 60)} (${reais(c.valor_repasse ?? 0)})`,
        gravidade: 'Alta', acao: 'Verificar pendência de cláusula suspensiva ou de documentação', responsavel: 'Captação / secretaria do objeto',
        detalhe: [
          { titulo: 'Por que este alerta', texto: `O convênio foi assinado há ${-ass} dias (${br(c.assinatura)}) e nenhum desembolso foi registrado, embora ${moeda(c.valor_repasse)} estejam pactuados. Regra: alertar quando passar de ${DIAS_SEM_DESEMBOLSO} dias sem nenhum desembolso (limite mantido pelo dono; ajustável).` },
          resumoConvenio,
          { titulo: 'Causas comuns', itens: ['Cláusula suspensiva ainda não cumprida (por exemplo, projeto básico, licença ou licitação pendentes).', 'Documentação ou comprovação de contrapartida pendente.', 'Empenho feito, mas sem pedido de liberação pela prefeitura.'] },
          { titulo: 'O que fazer', itens: ['Pedir à secretaria responsável o andamento do objeto.', 'Consultar o concedente (ou a mandatária, nos contratos de repasse) sobre a pendência.', 'Conferir empenhos e aditivos no detalhe do convênio na aba Acompanhamento.'] },
        ],
      });
  }

  const cauc = dados.cauc(IBGE);
  for (const i of ((cauc?.itens as Documento[]) ?? [])) {
    if (i.situacao === 'pendente' || i.situacao === 'vencido')
      lista.push({
        tipo: 'CAUC', alerta: `CAUC item ${i.item} ${i.situacao === 'pendente' ? 'com pendência' : 'vencido'}`, referencia: curto(i.descricao, 90), gravidade: 'Alta',
        acao: `Regularizar o item ${i.item} do CAUC`, responsavel: 'Fazenda / Controladoria',
        detalhe: [
          { titulo: 'Por que este alerta', texto: `O item ${i.item} do CAUC está ${i.situacao === 'pendente' ? 'com pendência (o CAUC não obteve a comprovação)' : 'com a validade vencida'}. Pendência no CAUC bloqueia transferências voluntárias.` },
          { titulo: 'Item', texto: String(i.descricao) },
          { titulo: 'O que fazer', itens: ['Identificar o órgão responsável pela informação deste item e regularizar.', 'Acompanhar a mudança de situação na próxima atualização diária.'] },
        ],
      });
    else if (i.situacao === 'regular') {
      const dias = diasAte(i.validade, new Date(String(cauc?.proveniencia?.data_referencia ?? '').split('/').reverse().join('-') + 'T12:00:00'));
      if (dias !== null && dias <= 30)
        lista.push({
          tipo: 'CAUC', alerta: `CAUC item ${i.item} vence em ${dias} dia(s) (${br(i.validade)})`, referencia: curto(i.descricao, 90), gravidade: dias <= 7 ? 'Alta' : 'Média',
          acao: `Renovar a comprovação do item ${i.item}`, responsavel: 'Fazenda / Controladoria',
          detalhe: [
            { titulo: 'Por que este alerta', texto: `A comprovação do item ${i.item} do CAUC vale até ${br(i.validade)} (referência do CAUC: ${cauc?.proveniencia?.data_referencia}). Depois dessa data, o município pode ficar irregular e perder acesso a transferências voluntárias. Regra: avisar quando faltarem 30 dias ou menos (Alta com 7 dias ou menos).` },
            { titulo: 'Item', texto: String(i.descricao) },
            { titulo: 'O que fazer', itens: ['Confirmar com o órgão responsável que a renovação está em curso.', 'Conferir se a data foi atualizada na próxima carga do CAUC.'] },
          ],
        });
    }
  }

  for (const p of ((dados.programasAbertos(IBGE)?.programas as Documento[]) ?? [])) {
    const prazo = p.prazos.proposta_ate ?? p.prazos.emendas_ate ?? p.prazos.beneficiario_especifico_ate;
    const dias = diasAte(prazo);
    if (dias !== null && dias >= 0 && dias <= DIAS_PRAZO_PROGRAMA)
      lista.push({
        tipo: 'Prazo de programa', alerta: `Prazo do programa em ${dias} dia(s) (${br(prazo)})`, referencia: `${p.codigo}: ${curto(p.nome, 70)}`, gravidade: dias <= 3 ? 'Alta' : 'Média',
        acao: p.prazos.proposta_ate ? 'Concluir e enviar a proposta' : 'Verificar se há emenda indicada e lançar o plano de trabalho', responsavel: 'Captação',
        detalhe: [
          { titulo: 'Por que este alerta', texto: `O programa ${p.nome} (${p.orgao_superior}) tem prazo de ${p.prazos.proposta_ate ? 'proposta' : 'propostas ligadas a emendas parlamentares'} até ${br(prazo)}, em ${dias} dia(s). Regra: avisar quando faltarem ${DIAS_PRAZO_PROGRAMA} dias ou menos (Alta com 3 dias ou menos).` },
          { titulo: 'Histórico do programa', itens: [`Propostas registradas: ${p.historico?.propostas_total ?? 0} (${p.historico?.propostas_municipais ?? 0} de prefeituras; ${p.historico?.municipios_do_estado_total ?? 0} de Goiás).`] },
          { titulo: 'O que fazer', itens: ['Confirmar com a secretaria interessada se há necessidade e projeto pronto.', p.prazos.proposta_ate ? 'Lançar a proposta e o plano de trabalho no Transferegov.' : 'Verificar se algum parlamentar indicou emenda para o município neste programa; sem emenda, não há proposta a enviar.', 'Ver o detalhe completo na aba Oportunidades.'] },
        ],
      });
  }

  for (const c of ((dados.citacoesDou(IBGE)?.citacoes as Documento[]) ?? []))
    lista.push({
      tipo: 'DOU', alerta: `DOU ${c.data}: ${curto(c.titulo, 60)}`, referencia: `${curto(String(c.orgao).split('/')[0], 40)} — ${c.motivo}`, gravidade: c.motivo.includes('CNPJ') ? 'Média' : 'Baixa',
      acao: 'Ler e encaminhar', responsavel: 'Captação',
      detalhe: [
        { titulo: 'Publicação', itens: [`Data: ${c.data}; ${c.secao} — ${c.tipo}`, `Órgão: ${c.orgao}`, `Título: ${c.titulo || '—'}`, `Motivo do alerta: ${c.motivo}`] },
        { titulo: 'Trecho', texto: String(c.trecho) },
        { titulo: 'Onde ler', texto: c.url_pdf ? `Página certificada: ${c.url_pdf}` : 'Pesquisar no portal do Diário Oficial da União.' },
      ],
    });

  // Fontes defasadas, com falha ou sem carga: regra do dono, sempre sinalizar, dizer o motivo e a ação.
  for (const a of avaliarFontes().filter((x) => x.situacao !== 'Em dia')) {
    const critico = a.situacao === 'Vencido: muito defasada' || a.situacao === 'Sem carga';
    lista.push({
      tipo: 'Fonte', alerta: `Fonte ${a.nome}: ${a.situacao.replace(/^[^:]+: /, '')}${a.idade !== null ? ` (coleta há ${a.idade} dias)` : ''}`, referencia: `${a.nome} — ${a.motivo}`.slice(0, 160),
      gravidade: critico ? 'Alta' : 'Média', acao: a.acao.slice(0, 120), responsavel: 'TI',
      detalhe: [
        { titulo: 'Por que este alerta', texto: `${a.motivo} Limite desta fonte: ${a.limite} dia(s); considerada muito defasada acima de ${a.limite * 2}. Os números dessa fonte podem estar desatualizados.` },
        { titulo: 'O que fazer', itens: [a.acao, 'Ver o painel Qualidade dos dados para a última tentativa de coleta e o erro registrado.'] },
        ...(a.erro ? [{ titulo: 'Erro registrado na última coleta', texto: a.erro }] : []),
      ],
    });
  }

  const ordem = { Alta: 0, Média: 1, Baixa: 2 } as const;
  return lista.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade]);
}
