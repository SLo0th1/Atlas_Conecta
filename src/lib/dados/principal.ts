// Guia "Principal" do bloco Captação: indicadores do município, cada um com detalhe completo
// (quais convênios compõem o número, de onde vêm os saldos, o que está por trás de cada indicador).
import { dados, type Documento } from './index.ts';
import { br, curto, diasAte, reais } from './formato.ts';
import { IBGE, DIAS_SEM_DESEMBOLSO, type Alerta } from './alertas.ts';
import type { Detalhe, Secao } from './detalhes.ts';
import type { Modulo } from './tipos.ts';

const moeda = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const dataColeta = (d?: Documento) => (d?.proveniencia?.data_coleta ? br(String(d.proveniencia.data_coleta)) : 'sem carga');
const pct = (parte: number, total: number) => (total > 0 ? `${(Math.round((parte / total) * 1000) / 10).toLocaleString('pt-BR')}%` : '—');
const concedente = (c: Documento) => String(c.orgao_superior ?? c.orgao ?? 'Não informado');

type Linha = { linha: (string | number)[]; det: Detalhe };

function porConcedente(lista: Documento[], campo: string): { nome: string; n: number; total: number }[] {
  const m = new Map<string, { nome: string; n: number; total: number }>();
  for (const c of lista) {
    const k = concedente(c);
    const r = m.get(k) ?? { nome: k, n: 0, total: 0 };
    r.n += 1;
    r.total += Number(c[campo] ?? 0);
    m.set(k, r);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

function situacaoConvenio(c: Documento): string {
  const dias = diasAte(c.vigencia_fim);
  if ((c.valor_desembolsado ?? 0) === 0) return 'sem nenhum desembolso';
  if (dias !== null && dias <= 90) return `vigência curta (${dias} dias)`;
  return `liberação parcial (${pct(c.valor_desembolsado ?? 0, c.valor_repasse ?? 0)} do repasse)`;
}

export function montarPrincipal(alertas: Alerta[]): Modulo | null {
  const ac = dados.acompanhamento(IBGE);
  if (!ac) return null;
  const r = ac.resumo;
  const ativos = (ac.convenios as Documento[]).filter((c) => /^Em execu/i.test(c.situacao ?? '')).sort((a, b) => (b.saldo_a_liberar ?? 0) - (a.saldo_a_liberar ?? 0));
  const linhas: Linha[] = [];
  const fonteTF = `Transferegov (arquivos abertos), coleta em ${dataColeta(ac)}`;
  const nomeConv = (c: Documento) => `${c.nr_convenio} — ${curto(c.objeto, 75)}`;

  // 1) Convênios em execução
  const semDes = ativos.filter((c) => (c.valor_desembolsado ?? 0) === 0);
  const curtas = ativos.filter((c) => { const d = diasAte(c.vigencia_fim); return d !== null && d <= 90; });
  linhas.push({
    linha: ['Convênios municipais em execução', r.em_execucao, 'Transferegov', dataColeta(ac), 'Em execução'],
    det: {
      titulo: `Convênios municipais em execução (${ativos.length})`,
      secoes: [
        { titulo: 'O que é', texto: 'Convênios e contratos de repasse em que a Prefeitura (ou seus fundos) é a convenente e a situação no Transferegov é "Em execução". Não inclui os convênios concluídos, em prestação de contas ou anulados, nem os de órgãos estaduais ou entidades privadas que apenas atuam em Goiânia.' },
        { titulo: `Lista dos ${ativos.length} convênios (do maior para o menor saldo a liberar)`, itens: ativos.map((c) => `${nomeConv(c)} | ${concedente(c)} | pactuado ${moeda(c.valor_repasse)} | liberado ${moeda(c.valor_desembolsado)} | vigência até ${br(c.vigencia_fim)} | ${situacaoConvenio(c)}`) },
        { titulo: 'Resumo da situação', itens: [`${semDes.length} sem nenhum desembolso`, `${ativos.length - semDes.length} com liberação parcial`, `${curtas.length} com vigência terminando em até 90 dias`] },
        { titulo: 'Por concedente (quantidade e repasse pactuado)', itens: porConcedente(ativos, 'valor_repasse').map((x) => `${x.nome}: ${x.n} convênio(s), ${moeda(x.total)}`) },
        { titulo: 'Fonte', texto: fonteTF },
      ],
    },
  });

  // 2) Repasse pactuado
  const totRep = ativos.reduce((s, c) => s + (c.valor_repasse ?? 0), 0);
  linhas.push({
    linha: ['Repasse pactuado (em execução)', reais(r.valor_repasse_pactuado_em_execucao), 'Transferegov', dataColeta(ac), 'Em execução'],
    det: {
      titulo: `Repasse pactuado: ${moeda(totRep)}`,
      secoes: [
        { titulo: 'O que é', texto: 'Soma do valor de repasse da União nos convênios em execução (não inclui a contrapartida da Prefeitura).' },
        { titulo: 'Por concedente', itens: porConcedente(ativos, 'valor_repasse').map((x) => `${x.nome}: ${moeda(x.total)} (${pct(x.total, totRep)}) em ${x.n} convênio(s)`) },
        { titulo: 'Por convênio (maiores)', itens: [...ativos].sort((a, b) => (b.valor_repasse ?? 0) - (a.valor_repasse ?? 0)).slice(0, 12).map((c) => `${nomeConv(c)}: ${moeda(c.valor_repasse)} (${pct(c.valor_repasse ?? 0, totRep)})`) },
        { titulo: 'Fonte', texto: fonteTF },
      ],
    },
  });

  // 3) Já liberado
  const totLib = ativos.reduce((s, c) => s + (c.valor_desembolsado ?? 0), 0);
  const comLib = ativos.filter((c) => (c.valor_desembolsado ?? 0) > 0).sort((a, b) => (b.valor_desembolsado ?? 0) - (a.valor_desembolsado ?? 0));
  linhas.push({
    linha: ['Já liberado (desembolsado)', reais(r.valor_desembolsado_em_execucao), 'Transferegov', dataColeta(ac), 'Em execução'],
    det: {
      titulo: `Já liberado: ${moeda(totLib)} (${pct(totLib, totRep)} do repasse pactuado)`,
      secoes: [
        { titulo: 'O que é', texto: 'Total de desembolsos já feitos pela União nos convênios em execução.' },
        { titulo: `Convênios com liberação (${comLib.length} de ${ativos.length})`, itens: comLib.map((c) => { const ds = ((c.desembolsos as Documento[]) ?? []).map((d) => `${br(d.data)} ${moeda(d.valor)}`).slice(0, 4).join('; '); return `${nomeConv(c)}: ${moeda(c.valor_desembolsado)} (${pct(c.valor_desembolsado ?? 0, c.valor_repasse ?? 0)} do repasse)${ds ? ` — desembolsos: ${ds}` : ''}`; }) },
        { titulo: 'Sem nenhuma liberação', texto: `${semDes.length} convênios em execução ainda não receberam nenhum desembolso (${moeda(semDes.reduce((s, c) => s + (c.valor_repasse ?? 0), 0))} pactuados).` },
        { titulo: 'Fonte', texto: fonteTF },
      ],
    },
  });

  // 4) Saldo a liberar
  const totSaldo = ativos.reduce((s, c) => s + (c.saldo_a_liberar ?? 0), 0);
  linhas.push({
    linha: ['Saldo a liberar', reais(r.saldo_a_liberar_em_execucao), 'Transferegov', dataColeta(ac), r.saldo_a_liberar_em_execucao > 0 ? 'Atenção' : 'Em dia'],
    det: {
      titulo: `Saldo a liberar: ${moeda(totSaldo)}`,
      secoes: [
        { titulo: 'Como é calculado', texto: 'Saldo a liberar = repasse pactuado − total já desembolsado, somente em convênios em execução. Convênios concluídos, anulados ou em prestação de contas não entram.' },
        { titulo: 'De onde vêm os saldos (por concedente)', itens: porConcedente(ativos, 'saldo_a_liberar').map((x) => `${x.nome}: ${moeda(x.total)} (${pct(x.total, totSaldo)}) em ${x.n} convênio(s)`) },
        { titulo: 'De onde vêm os saldos (por convênio)', itens: ativos.filter((c) => (c.saldo_a_liberar ?? 0) > 0).map((c) => `${nomeConv(c)}: ${moeda(c.saldo_a_liberar)} (${pct(c.saldo_a_liberar ?? 0, totSaldo)}) — ${c.proponente ?? ''} — vigência até ${br(c.vigencia_fim)}`) },
        { titulo: 'O que observar', itens: [`${semDes.length} dos ${ativos.length} convênios não receberam nenhum desembolso.`, 'Os maiores saldos concentram a maior parte do valor: priorizar o andamento desses objetos.'] },
        { titulo: 'Fonte', texto: fonteTF },
      ],
    },
  });

  // 5) Assinados sem desembolso
  linhas.push({
    linha: ['Assinados sem nenhum desembolso', r.assinados_sem_nenhum_desembolso, 'Transferegov', dataColeta(ac), r.assinados_sem_nenhum_desembolso > 0 ? 'Atenção' : 'Em dia'],
    det: {
      titulo: `Assinados sem nenhum desembolso (${semDes.length})`,
      secoes: [
        { titulo: 'O que é', texto: `Convênios em execução com valor liberado igual a zero. O alerta é gerado quando passam de ${DIAS_SEM_DESEMBOLSO} dias desde a assinatura.` },
        { titulo: 'Lista (do maior valor pactuado)', itens: [...semDes].sort((a, b) => (b.valor_repasse ?? 0) - (a.valor_repasse ?? 0)).map((c) => { const d = diasAte(c.assinatura); return `${nomeConv(c)}: ${moeda(c.valor_repasse)} — assinado em ${br(c.assinatura)}${d !== null ? ` (há ${-d} dias)` : ''} — ${concedente(c)}`; }) },
        { titulo: 'Fonte', texto: fonteTF },
      ],
    },
  });

  // 6) CAUC
  const cauc = dados.cauc(IBGE);
  if (cauc) {
    const itens = cauc.itens as Documento[];
    const rotulo: Record<string, string> = { regular: 'regular', vencido: 'VENCIDO', pendente: 'PENDENTE', indisponivel: 'indisponível', sem_informacao: 'sem informação', desconhecido: 'formato desconhecido' };
    linhas.push({
      linha: ['Regularidade no CAUC', cauc.situacao_geral === 'regular' ? 'Regular' : `Com pendências (${(cauc.itens_com_pendencia as string[]).length})`, 'Tesouro Nacional (CAUC)', String(cauc.proveniencia.data_referencia), cauc.situacao_geral === 'regular' ? 'Regular' : 'Pendente'],
      det: {
        titulo: `CAUC: ${cauc.situacao_geral === 'regular' ? 'município regular' : 'com pendências'}`,
        secoes: [
          { titulo: 'O que é', texto: 'O CAUC mostra se o município cumpre os requisitos fiscais para receber transferências voluntárias da União. Cada item traz a data de validade da comprovação; uma pendência bloqueia novos repasses.' },
          { titulo: `Os ${itens.length} itens`, itens: itens.map((i) => `${i.item} — ${curto(i.descricao, 110)}: ${rotulo[i.situacao] ?? i.situacao}${i.validade ? ` (válido até ${br(i.validade)})` : ''}`) },
          { titulo: 'Atenção', itens: itens.filter((i) => i.situacao === 'regular' && (diasAte(i.validade, new Date(String(cauc.proveniencia.data_referencia).split('/').reverse().join('-') + 'T12:00:00')) ?? 999) <= 30).map((i) => `Item ${i.item} vence em ${br(i.validade)}`) },
          { titulo: 'Fonte', texto: `Tesouro Nacional, CAUC (CSV aberto), referência ${cauc.proveniencia.data_referencia}; coleta em ${dataColeta(cauc)}.` },
        ].filter((s) => !(s.itens && s.itens.length === 0 && s.titulo === 'Atenção')) as Secao[],
      },
    });
  }

  // 7) SICONFI
  const sic = dados.siconfi(IBGE);
  if (sic) {
    linhas.push({
      linha: ['Despesa com pessoal / RCL', `${sic.rgf.despesa_pessoal_pct_rcl}% (limite ${sic.rgf.limite_maximo_pct}%)`, 'SICONFI', String(sic.proveniencia.data_referencia.rgf).split(' (')[0], sic.derivados.situacao_despesa_pessoal === 'abaixo do limite de alerta' ? 'Regular' : 'Atenção'],
      det: {
        titulo: `Despesa com pessoal: ${sic.rgf.despesa_pessoal_pct_rcl}% da receita corrente líquida`,
        secoes: [
          { titulo: 'O que é', texto: 'A Lei de Responsabilidade Fiscal limita a despesa total com pessoal a um percentual da receita corrente líquida (RCL). Ultrapassar o limite de alerta, o prudencial ou o máximo traz restrições; isso também pesa na capacidade de oferecer contrapartida.' },
          { titulo: 'Números (RGF, Anexo 01)', itens: [`Receita corrente líquida: ${moeda(sic.rgf.receita_corrente_liquida)}`, `RCL ajustada: ${moeda(sic.rgf.rcl_ajustada)}`, `Despesa total com pessoal: ${moeda(sic.rgf.despesa_pessoal_total)} (${sic.rgf.despesa_pessoal_pct_rcl}% da RCL ajustada)`, `Limite de alerta: ${sic.rgf.limite_alerta_pct}%; prudencial: ${sic.rgf.limite_prudencial_pct}%; máximo: ${sic.rgf.limite_maximo_pct}%`, `Margem até o limite máximo: ${sic.derivados.margem_ate_limite_maximo_pontos_percentuais} pontos percentuais`, `Situação: ${sic.derivados.situacao_despesa_pessoal}`] },
          { titulo: 'Execução da receita (RREO, Anexo 01)', itens: [`Receita prevista (atualizada): ${moeda(sic.rreo.receita_prevista_atualizada)}`, `Receita realizada até o bimestre: ${moeda(sic.rreo.receita_realizada_ate_bimestre)} (${sic.derivados.execucao_receita_pct}% da previsão)`, `Receitas correntes realizadas: ${moeda(sic.rreo.receitas_correntes_realizadas_ate_bimestre)}`] },
          { titulo: 'Fonte', texto: `SICONFI/Tesouro Nacional — RGF ${sic.proveniencia.data_referencia.rgf}; RREO ${sic.proveniencia.data_referencia.rreo}; coleta em ${dataColeta(sic)}.` },
        ],
      },
    });
  }

  // 8) FNS
  const fns = dados.fns(IBGE);
  const ano = new Date().getFullYear();
  const cap = dados.fnsCapitais(ano);
  const capitais = (cap?.capitais as Documento[]) ?? [];
  const pos = capitais.findIndex((c) => c.codigo_ibge === IBGE) + 1;
  if (fns && fns.anos?.[0]) {
    const a0 = fns.anos[0];
    linhas.push({
      linha: [`Repasses do FNS ao Fundo Municipal (${a0.ano})`, `${reais(a0.total_bruto)}${pos ? ` — ${pos}º entre as capitais por habitante` : ''}`, 'Fundo Nacional de Saúde', dataColeta(fns), 'Informativo'],
      det: {
        titulo: `Repasses do Fundo Nacional de Saúde ao Fundo Municipal (${a0.ano}): ${moeda(a0.total_bruto)}`,
        secoes: [
          { titulo: 'O que é', texto: 'Repasses fundo a fundo da saúde ao Fundo Municipal de Saúde, por bloco e grupo, no ano (valores brutos até a data da coleta). Não inclui os repasses ao Fundo Estadual.' },
          { titulo: 'Série dos últimos anos', itens: (fns.anos as Documento[]).map((x) => `${x.ano}: bruto ${moeda(x.total_bruto)}; líquido ${moeda(x.total_liquido)}`) },
          { titulo: `Por bloco e grupo (${a0.ano})`, itens: (a0.blocos as Documento[]).flatMap((b) => [`${b.nome}: ${moeda(b.valor_bruto)}`, ...((b.grupos as Documento[]) ?? []).map((g) => `   • ${g.nome}: ${moeda(g.valor_bruto)}`)]) },
          ...(capitais.length ? [{ titulo: `Comparativo com as capitais (${ano}, por habitante)`, itens: [`Posição de Goiânia: ${pos}º de ${capitais.length}`, `Maiores: ${capitais.slice(0, 5).map((c) => `${c.nome} ${moeda(c.per_capita)}`).join('; ')}`, `Goiânia: ${moeda(capitais[pos - 1]?.per_capita)} por habitante`] }] : []),
          { titulo: 'Fonte', texto: `Ministério da Saúde, FNS (Consulta Consolidada, repasse municipal); coleta em ${dataColeta(fns)}. O per capita usa a população estimada do IBGE.` },
        ],
      },
    });
  }

  // 9) Programas abertos
  const prog = dados.programasAbertos(IBGE);
  if (prog) {
    const ps = prog.programas as Documento[];
    const porTema = new Map<string, number>();
    for (const p of ps) for (const t of (p.temas as string[]).length ? (p.temas as string[]) : ['sem tema']) porTema.set(t, (porTema.get(t) ?? 0) + 1);
    linhas.push({
      linha: ['Programas abertos para o município', prog.resumo.programas_elegiveis_ao_municipio, 'Transferegov (programas)', dataColeta(prog), 'Informativo'],
      det: {
        titulo: `Programas abertos para o município (${ps.length})`,
        secoes: [
          { titulo: 'O que é', texto: 'Programas do governo federal com prazo aberto para propostas e abertos a prefeituras do estado. Detalhes de cada um (objetivo, prazos, quem já propôs) estão na aba Oportunidades.' },
          { titulo: 'Por tema', itens: [...porTema.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t.replace(/_/g, ' ')}: ${n}`) },
          { titulo: 'Os 10 com prazo mais próximo', itens: ps.slice(0, 10).map((p) => { const prazo = p.prazos.proposta_ate ?? p.prazos.emendas_ate ?? p.prazos.beneficiario_especifico_ate; return `${br(prazo)} — ${curto(p.nome, 80)} (${curto(p.orgao_superior, 30)})`; }) },
          { titulo: 'Fonte', texto: `Transferegov (arquivo siconv_programa e API de Discricionárias); coleta em ${dataColeta(prog)}.` },
        ],
      },
    });
  }

  // 10) DOU
  const dou = dados.citacoesDou(IBGE);
  if (dou) {
    linhas.push({
      linha: ['Citações no DOU (mês de referência)', dou.resumo.citacoes, 'Imprensa Nacional (DOU)', String(dou.proveniencia.data_referencia?.[0] ?? '').replace(/^.*[\\/]/, '').slice(0, 20), 'Informativo'],
      det: {
        titulo: `Publicações do Diário Oficial da União que citam o município (${dou.resumo.citacoes})`,
        secoes: [
          { titulo: 'O que é', texto: 'Publicações da Seção 1 do DOU do mês coletado que citam o Município ou o CNPJ da Prefeitura e de seus fundos monitorados. CPFs de terceiros são mascarados.' },
          { titulo: 'Publicações', itens: (dou.citacoes as Documento[]).map((c) => `${c.data} — ${c.tipo} — ${curto(String(c.orgao).split('/')[0], 40)} — ${curto(c.titulo, 70)} (${c.motivo})`) },
          { titulo: 'Fonte', texto: `Imprensa Nacional, base de dados abertos do DOU; ${(dou.proveniencia.data_referencia as string[]).join('; ')}; coleta em ${dataColeta(dou)}.` },
        ],
      },
    });
  }

  // 10b) Educação (INEP)
  const edu = dados.educacao(IBGE);
  if (edu) {
    const censo = (edu.censo_escolar as Documento[]).slice().sort((a, b) => b.ano - a.ano);
    const c0 = censo[0];
    const dep = c0.por_dependencia as Record<string, Documento>;
    const nomes: Record<string, string> = { municipal: 'Municipal', estadual: 'Estadual', federal: 'Federal', privada: 'Privada' };
    const idebMun = (edu.ideb as Documento[]).map((e) => ({ etapa: e.etapa as string, serie: e.redes?.municipal?.ideb_observado as Record<string, number | null> }));
    const ultimo = (serie: Record<string, number | null>) => { const anos = Object.keys(serie).filter((a) => serie[a] !== null).sort(); return anos.length ? { ano: anos[anos.length - 1], valor: serie[anos[anos.length - 1]] as number } : null; };
    const iniciais = idebMun.find((e) => e.etapa.startsWith('anos_iniciais'));
    const finais = idebMun.find((e) => e.etapa.startsWith('anos_finais'));
    const uI = iniciais ? ultimo(iniciais.serie) : null;
    const uF = finais ? ultimo(finais.serie) : null;
    const totalEscolas = Object.values(dep).reduce((s, d) => s + (d.escolas_em_atividade ?? 0), 0);
    const totalMat = Object.values(dep).reduce((s, d) => s + (d.matriculas?.total_educacao_basica ?? 0), 0);
    const fmt = (n: number) => n.toLocaleString('pt-BR');
    linhas.push({
      linha: [`Educação básica (Censo ${c0.ano})`, `${fmt(totalEscolas)} escolas; ${fmt(totalMat)} matrículas${uI ? `; IDEB municipal ${uI.valor.toString().replace('.', ',')} (anos iniciais, ${uI.ano})` : ''}`, 'INEP (Censo Escolar e IDEB)', String(c0.ano), 'Informativo'],
      det: {
        titulo: `Educação básica em Goiânia (Censo Escolar ${c0.ano})`,
        secoes: [
          { titulo: 'O que é', texto: 'Indicadores oficiais do INEP para fundamentar projetos de educação (por exemplo, propostas ao FNDE): número de escolas e matrículas por rede e o IDEB. Dados agregados, sem nome de escola nem dados pessoais.' },
          { titulo: `Escolas em atividade e matrículas por rede (${c0.ano})`, itens: Object.keys(dep).map((k) => `${nomes[k] ?? k}: ${fmt(dep[k].escolas_em_atividade)} escolas; ${fmt(dep[k].matriculas?.total_educacao_basica ?? 0)} matrículas; ${fmt(dep[k].docentes ?? 0)} docentes; ${fmt(dep[k].turmas ?? 0)} turmas`) },
          { titulo: 'Rede municipal por etapa (matrículas)', itens: Object.entries((dep.municipal?.matriculas ?? {}) as Record<string, number>).filter(([k]) => k !== 'total_educacao_basica').map(([k, v]) => `${k.replace(/_/g, ' ')}: ${fmt(v)}`) },
          ...(censo[1] ? [{ titulo: `Comparação com ${censo[1].ano}`, itens: [`Escolas em atividade: ${fmt(Object.values(censo[1].por_dependencia as Record<string, Documento>).reduce((s, d) => s + (d.escolas_em_atividade ?? 0), 0))} em ${censo[1].ano} e ${fmt(totalEscolas)} em ${c0.ano}`, `Matrículas: ${fmt(Object.values(censo[1].por_dependencia as Record<string, Documento>).reduce((s, d) => s + (d.matriculas?.total_educacao_basica ?? 0), 0))} em ${censo[1].ano} e ${fmt(totalMat)} em ${c0.ano}`] }] : []),
          { titulo: 'IDEB da rede municipal', itens: [...(iniciais ? [`Anos iniciais: ${Object.entries(iniciais.serie).filter(([, v]) => v !== null).map(([a, v]) => `${a}: ${v}`).join(' | ')}`] : []), ...(finais ? [`Anos finais: ${Object.entries(finais.serie).filter(([, v]) => v !== null).map(([a, v]) => `${a}: ${v}`).join(' | ')}`] : [])] },
          { titulo: 'Fonte', texto: `INEP, Censo Escolar (microdados ${censo.map((x) => x.ano).join(' e ')}) e IDEB (resultados por município); coleta em ${dataColeta(edu)}. Ficaram de fora: IDEB do ensino médio e população em idade escolar.` },
        ],
      },
    });
  }

  // 11) Alertas
  const porGrav = (g: string) => alertas.filter((a) => a.gravidade === g).length;
  const porTipo = new Map<string, number>();
  for (const a of alertas) porTipo.set(a.tipo, (porTipo.get(a.tipo) ?? 0) + 1);
  linhas.push({
    linha: ['Alertas abertos', alertas.length, 'Calculado', 'na publicação do site', alertas.some((a) => a.gravidade === 'Alta') ? 'Atenção' : 'Em dia'],
    det: {
      titulo: `Alertas abertos (${alertas.length})`,
      secoes: [
        { titulo: 'Por gravidade', itens: [`Alta: ${porGrav('Alta')}`, `Média: ${porGrav('Média')}`, `Baixa: ${porGrav('Baixa')}`] },
        { titulo: 'Por tipo', itens: [...porTipo.entries()].map(([t, n]) => `${t}: ${n}`) },
        { titulo: 'Os 15 mais graves', itens: alertas.slice(0, 15).map((a) => `[${a.gravidade}] ${a.alerta} — ${a.referencia}`) },
        { titulo: 'Como são gerados', texto: 'Regras em docs/regras-alertas.md, aplicadas aos dados reais na publicação do site. O detalhe de cada alerta está na aba Alertas.' },
      ],
    },
  });

  return {
    slug: 'captacao', title: 'Principal', group: 'Captação',
    columns: ['Indicador', 'Resultado', 'Fonte', 'Data de referência', 'Situação'],
    rows: linhas.map((l) => l.linha), detalhes: linhas.map((l) => l.det), fields: [], source: 'captacao',
    fonte: 'Resumo do município com dados reais de fontes oficiais. Clique em "Ver detalhes" para ver o que compõe cada número. Saldo a liberar considera só convênios em execução. Dados públicos; sem dados bancários.',
  };
}
