// Monta as guias do bloco Captação a partir dos dados REAIS coletados (via camada de dados).
// Cada guia vira um "módulo" no mesmo formato de src/data/modules.json (colunas + linhas).
// Se a carga de um conjunto não existir, a guia cai no conteúdo de exemplo do modules.json.
// As regras de alerta seguem docs/regras-alertas.md; os limites abaixo são PARÂMETROS A DEFINIR com o dono do produto.
import { dados, type Documento } from './index.ts';
import { br, curto, diasAte, hoje, nomeTema, reais } from './formato.ts';
import { detalheOportunidade } from './detalhes.ts';
import { detalheConvenio } from './detalhes-convenio.ts';

const IBGE = 5208707; // município piloto (data/config/municipio.json); multimunicípio entra com a seleção de município

// Parâmetros das regras (docs/regras-alertas.md)
const DIAS_VIGENCIA = [90, 60, 30, 15];
const DIAS_SEM_DESEMBOLSO = 180; // "recurso pactuado sem desembolso há mais de X dias": X a definir
const DIAS_PRAZO_PROGRAMA = 15;
const DIAS_DEFASAGEM = 3;

type Modulo = {
  slug: string; title: string; group: string; columns: string[]; rows: (string | number)[][]; fields: string[]; source: string; fonte?: string; detalhes?: unknown[];
};

const dataColeta = (d?: Documento) => (d?.proveniencia?.data_coleta ? br(String(d.proveniencia.data_coleta)) : 'sem carga');

function oportunidades(): Modulo | null {
  const d = dados.programasAbertos(IBGE);
  if (!d) return null;
  const rows = (d.programas as Documento[]).map((p) => {
    const prazo = p.prazos.proposta_ate ?? p.prazos.emendas_ate ?? p.prazos.beneficiario_especifico_ate;
    const tipoPrazo = p.prazos.proposta_ate ? 'Proposta' : p.prazos.emendas_ate ? 'Emendas' : 'Beneficiário específico';
    const dias = diasAte(prazo);
    return [
      p.codigo,
      curto(p.nome, 80),
      curto(String(p.orgao_superior).replace(/^MINIST[ÉE]RIO (DA|DO|DE) /i, 'Min. '), 40),
      String(p.modalidade ?? '—'),
      `${br(prazo)} (${tipoPrazo})`,
      (p.temas as string[]).map(nomeTema).join(', ') || 'A classificar',
      dias !== null && dias <= DIAS_PRAZO_PROGRAMA ? 'Atenção: prazo curto' : 'Aberto',
    ];
  });
  return {
    slug: 'captacao-oportunidades', title: 'Oportunidades', group: 'Captação',
    columns: ['Código', 'Programa', 'Concedente', 'Modalidade', 'Prazo', 'Tema', 'Status'], rows, detalhes: (d.programas as Documento[]).map(detalheOportunidade), fields: [], source: 'captacao-oportunidades',
    fonte: `Programas do Transferegov abertos e elegíveis a prefeituras de GO (${rows.length}). Fonte: Transferegov, arquivo siconv_programa; coleta em ${dataColeta(d)}. Temas por palavras-chave (rascunho).`,
  };
}

function acompanhamento(): Modulo | null {
  const d = dados.acompanhamento(IBGE);
  if (!d) return null;
  const ativos = (d.convenios as Documento[]).filter((c) => /^Em execu/i.test(c.situacao ?? '')).sort((a, b) => (b.saldo_a_liberar ?? 0) - (a.saldo_a_liberar ?? 0));
  const rows = ativos
    .map((c) => {
      const dias = diasAte(c.vigencia_fim);
      return [
        c.nr_convenio,
        curto(c.objeto, 80),
        curto(c.orgao_superior ?? c.orgao, 35),
        Number(c.valor_repasse ?? 0),
        Number(c.valor_desembolsado ?? 0),
        Number(c.saldo_a_liberar ?? 0),
        br(c.vigencia_fim),
        dias !== null && dias <= 90 ? 'Atenção: vigência curta' : c.valor_desembolsado === 0 ? 'Atenção: sem desembolso' : 'Em execução',
      ];
    });
  const r = d.resumo;
  return {
    slug: 'captacao-acompanhamento', title: 'Acompanhamento', group: 'Captação',
    columns: ['Convênio', 'Objeto', 'Concedente', 'Valor pactuado', 'Valor liberado', 'Valor a liberar', 'Vigência', 'Situação'], rows, detalhes: ativos.map(detalheConvenio), fields: [], source: 'captacao-acompanhamento',
    fonte: `Convênios municipais em execução: ${r.em_execucao}; pactuado ${reais(r.valor_repasse_pactuado_em_execucao)}, liberado ${reais(r.valor_desembolsado_em_execucao)}, saldo a liberar ${reais(r.saldo_a_liberar_em_execucao)}; ${r.assinados_sem_nenhum_desembolso} sem nenhum desembolso. Fonte: Transferegov (arquivos abertos); coleta em ${dataColeta(d)}. Saldo = repasse pactuado − desembolsado.`,
  };
}

type Alerta = { alerta: string; referencia: string; gravidade: 'Alta' | 'Média' | 'Baixa'; acao: string; responsavel: string };

function gerarAlertas(): Alerta[] {
  const lista: Alerta[] = [];
  const ac = dados.acompanhamento(IBGE);
  for (const c of ((ac?.convenios as Documento[]) ?? []).filter((x) => /^Em execu/i.test(x.situacao ?? ''))) {
    const dias = diasAte(c.vigencia_fim);
    const limite = dias === null ? null : DIAS_VIGENCIA.find((l) => dias <= l && dias >= 0);
    if (limite !== undefined && limite !== null)
      lista.push({ alerta: `Vigência termina em ${dias} dias (${br(c.vigencia_fim)})`, referencia: `Convênio ${c.nr_convenio}: ${curto(c.objeto, 60)}`, gravidade: dias! <= 30 ? 'Alta' : 'Média', acao: 'Avaliar e solicitar prorrogação ou aditivo', responsavel: 'Captação' });
    const ass = diasAte(c.assinatura);
    if ((c.valor_desembolsado ?? 0) === 0 && ass !== null && -ass > DIAS_SEM_DESEMBOLSO)
      lista.push({ alerta: `Pactuado sem desembolso há ${-ass} dias`, referencia: `Convênio ${c.nr_convenio}: ${curto(c.objeto, 60)} (${reais(c.valor_repasse ?? 0)})`, gravidade: 'Alta', acao: 'Verificar pendência de cláusula suspensiva ou de documentação', responsavel: 'Captação / secretaria do objeto' });
  }
  const cauc = dados.cauc(IBGE);
  for (const i of ((cauc?.itens as Documento[]) ?? [])) {
    if (i.situacao === 'pendente' || i.situacao === 'vencido')
      lista.push({ alerta: `CAUC item ${i.item} ${i.situacao === 'pendente' ? 'com pendência' : 'vencido'}`, referencia: curto(i.descricao, 90), gravidade: 'Alta', acao: `Regularizar o item ${i.item} do CAUC`, responsavel: 'Fazenda / Controladoria' });
    else if (i.situacao === 'regular') {
      const dias = diasAte(i.validade, new Date(String(cauc?.proveniencia?.data_referencia ?? '').split('/').reverse().join('-') + 'T12:00:00'));
      if (dias !== null && dias <= 30) lista.push({ alerta: `CAUC item ${i.item} vence em ${dias} dia(s) (${br(i.validade)})`, referencia: curto(i.descricao, 90), gravidade: dias <= 7 ? 'Alta' : 'Média', acao: `Renovar a comprovação do item ${i.item}`, responsavel: 'Fazenda / Controladoria' });
    }
  }
  for (const p of ((dados.programasAbertos(IBGE)?.programas as Documento[]) ?? [])) {
    const prazo = p.prazos.proposta_ate ?? p.prazos.emendas_ate ?? p.prazos.beneficiario_especifico_ate;
    const dias = diasAte(prazo);
    if (dias !== null && dias >= 0 && dias <= DIAS_PRAZO_PROGRAMA)
      lista.push({ alerta: `Prazo do programa em ${dias} dia(s) (${br(prazo)})`, referencia: `${p.codigo}: ${curto(p.nome, 70)}`, gravidade: dias <= 3 ? 'Alta' : 'Média', acao: p.prazos.proposta_ate ? 'Concluir e enviar a proposta' : 'Verificar se há emenda indicada e lançar o plano de trabalho', responsavel: 'Captação' });
  }
  for (const c of ((dados.citacoesDou(IBGE)?.citacoes as Documento[]) ?? []))
    lista.push({ alerta: `DOU ${c.data}: ${curto(c.titulo, 60)}`, referencia: `${curto(String(c.orgao).split('/')[0], 40)} — ${c.motivo}`, gravidade: c.motivo.includes('CNPJ') ? 'Média' : 'Baixa', acao: 'Ler e encaminhar', responsavel: 'Captação' });
  for (const [nome, doc] of [['Transferegov', dados.acompanhamento(IBGE)], ['CAUC', cauc], ['SICONFI', dados.siconfi(IBGE)], ['FNS', dados.fns(IBGE)]] as const) {
    const idade = doc?.proveniencia?.data_coleta ? -(diasAte(String(doc.proveniencia.data_coleta)) ?? 0) : null;
    if (idade === null || idade > DIAS_DEFASAGEM)
      lista.push({ alerta: `Fonte ${nome} defasada${idade === null ? ' (sem carga)' : ` há ${idade} dias`}`, referencia: nome, gravidade: 'Média', acao: 'Informar a TI e exibir o aviso na tela', responsavel: 'TI' });
  }
  const ordem = { Alta: 0, Média: 1, Baixa: 2 } as const;
  return lista.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade]);
}

function alertas(): Modulo | null {
  if (!dados.acompanhamento(IBGE) && !dados.cauc(IBGE)) return null;
  const l = gerarAlertas();
  return {
    slug: 'captacao-alertas', title: 'Alertas', group: 'Captação',
    columns: ['Código', 'Alerta', 'Referência', 'Gravidade', 'Ação recomendada', 'Responsável', 'Situação'],
    rows: l.map((a, i) => [`ALE-${String(i + 1).padStart(3, '0')}`, a.alerta, a.referencia, a.gravidade, a.acao, a.responsavel, 'Aberto']),
    fields: [], source: 'captacao-alertas',
    fonte: `Alertas gerados a partir dos dados reais (${l.length}). Regras: docs/regras-alertas.md; limites (vigência 90/60/30/15 dias, sem desembolso > ${DIAS_SEM_DESEMBOLSO} dias, prazo de programa ≤ ${DIAS_PRAZO_PROGRAMA} dias) são parâmetros provisórios. Calculado na data da publicação do site.`,
  };
}

function principal(): Modulo | null {
  const ac = dados.acompanhamento(IBGE);
  if (!ac) return null;
  const r = ac.resumo;
  const cauc = dados.cauc(IBGE);
  const sic = dados.siconfi(IBGE);
  const fns = dados.fns(IBGE);
  const cap = dados.fnsCapitais(new Date().getFullYear());
  const pos = cap ? (cap.capitais as Documento[]).findIndex((c) => c.codigo_ibge === IBGE) + 1 : 0;
  const prog = dados.programasAbertos(IBGE);
  const dou = dados.citacoesDou(IBGE);
  const al = gerarAlertas();
  const rows: (string | number)[][] = [
    ['Convênios municipais em execução', r.em_execucao, 'Transferegov', dataColeta(ac), 'Em execução'],
    ['Repasse pactuado (em execução)', reais(r.valor_repasse_pactuado_em_execucao), 'Transferegov', dataColeta(ac), 'Em execução'],
    ['Já liberado (desembolsado)', reais(r.valor_desembolsado_em_execucao), 'Transferegov', dataColeta(ac), 'Em execução'],
    ['Saldo a liberar', reais(r.saldo_a_liberar_em_execucao), 'Transferegov', dataColeta(ac), r.saldo_a_liberar_em_execucao > 0 ? 'Atenção' : 'Em dia'],
    ['Assinados sem nenhum desembolso', r.assinados_sem_nenhum_desembolso, 'Transferegov', dataColeta(ac), r.assinados_sem_nenhum_desembolso > 0 ? 'Atenção' : 'Em dia'],
    ...(cauc ? [['Regularidade no CAUC', cauc.situacao_geral === 'regular' ? 'Regular' : `Com pendências (${(cauc.itens_com_pendencia as string[]).length})`, 'Tesouro Nacional (CAUC)', String(cauc.proveniencia.data_referencia), cauc.situacao_geral === 'regular' ? 'Regular' : 'Pendente']] : []),
    ...(sic ? [['Despesa com pessoal / RCL', `${sic.rgf.despesa_pessoal_pct_rcl}% (limite ${sic.rgf.limite_maximo_pct}%)`, 'SICONFI', String(sic.proveniencia.data_referencia.rgf).split(' (')[0], sic.derivados.situacao_despesa_pessoal === 'abaixo do limite de alerta' ? 'Regular' : 'Atenção']] : []),
    ...(fns && fns.anos?.[0] ? [[`Repasses do FNS ao Fundo Municipal (${fns.anos[0].ano})`, `${reais(fns.anos[0].total_bruto)}${pos ? ` — ${pos}º entre as capitais por habitante` : ''}`, 'Fundo Nacional de Saúde', dataColeta(fns), 'Informativo']] : []),
    ...(prog ? [['Programas abertos para o município', prog.resumo.programas_elegiveis_ao_municipio, 'Transferegov (programas)', dataColeta(prog), 'Informativo']] : []),
    ...(dou ? [['Citações no DOU (mês de referência)', dou.resumo.citacoes, 'Imprensa Nacional (DOU)', String(dou.proveniencia.data_referencia?.[0] ?? '').replace(/^.*\\/, '').slice(0, 20), 'Informativo']] : []),
    ['Alertas abertos', al.length, 'Calculado', 'na publicação do site', al.some((a) => a.gravidade === 'Alta') ? 'Atenção' : 'Em dia'],
  ];
  return {
    slug: 'captacao', title: 'Principal', group: 'Captação',
    columns: ['Indicador', 'Resultado', 'Fonte', 'Data de referência', 'Situação'], rows, fields: [], source: 'captacao',
    fonte: 'Resumo do município com dados reais de fontes oficiais; cada linha mostra a fonte e a data de referência. Saldo a liberar considera só convênios em execução. Dados públicos; sem dados bancários.',
  };
}

/** Substitui as guias de exemplo do bloco Captação pelas versões com dados reais (quando a carga existe). */
export function modulosComDadosReais<T extends { slug: string }>(base: T[]): (T | Modulo)[] {
  const substitutos: Record<string, Modulo | null> = {
    captacao: principal(), 'captacao-oportunidades': oportunidades(), 'captacao-acompanhamento': acompanhamento(), 'captacao-alertas': alertas(),
  };
  return base.map((m) => substitutos[m.slug] ?? m);
}
