// Monta as guias do bloco Captação a partir dos dados REAIS coletados (via camada de dados).
// Cada guia vira um "módulo" no mesmo formato de src/data/modules.json (colunas + linhas).
// Se a carga de um conjunto não existir, a guia cai no conteúdo de exemplo do modules.json.
// As regras de alerta seguem docs/regras-alertas.md; os limites abaixo são PARÂMETROS A DEFINIR com o dono do produto.
import { dados, type Documento } from './index.ts';
import { br, curto, diasAte, hoje, nomeTema, reais } from './formato.ts';
import { detalheOportunidade } from './detalhes.ts';
import { detalheConvenio } from './detalhes-convenio.ts';
import { DIAS_PRAZO_PROGRAMA, DIAS_SEM_DESEMBOLSO, IBGE, gerarAlertas } from './alertas.ts';
import { montarPrincipal } from './principal.ts';
import type { Modulo } from './tipos.ts';

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

function alertas(): Modulo | null {
  if (!dados.acompanhamento(IBGE) && !dados.cauc(IBGE)) return null;
  const l = gerarAlertas();
  return {
    slug: 'captacao-alertas', title: 'Alertas', group: 'Captação',
    columns: ['Código', 'Alerta', 'Referência', 'Gravidade', 'Ação recomendada', 'Responsável', 'Situação'],
    rows: l.map((a, i) => [`ALE-${String(i + 1).padStart(3, '0')}`, a.alerta, a.referencia, a.gravidade, a.acao, a.responsavel, 'Aberto']),
    detalhes: l.map((a) => ({ titulo: a.alerta, secoes: [{ titulo: 'Resumo', itens: [`Referência: ${a.referencia}`, `Gravidade: ${a.gravidade}`, `Ação recomendada: ${a.acao}`, `Responsável: ${a.responsavel}`] }, ...a.detalhe] })), fields: [], source: 'captacao-alertas',
    fonte: `Alertas gerados a partir dos dados reais (${l.length}). Regras: docs/regras-alertas.md; limites (vigência 90/60/30/15 dias, sem desembolso > ${DIAS_SEM_DESEMBOLSO} dias, prazo de programa ≤ ${DIAS_PRAZO_PROGRAMA} dias) são parâmetros provisórios. Calculado na data da publicação do site.`,
  };
}

/** Substitui as guias de exemplo do bloco Captação pelas versões com dados reais (quando a carga existe). */
export function modulosComDadosReais<T extends { slug: string }>(base: T[]): (T | Modulo)[] {
  const substitutos: Record<string, Modulo | null> = {
    captacao: montarPrincipal(gerarAlertas()), 'captacao-oportunidades': oportunidades(), 'captacao-acompanhamento': acompanhamento(), 'captacao-alertas': alertas(),
  };
  return base.map((m) => substitutos[m.slug] ?? m);
}
