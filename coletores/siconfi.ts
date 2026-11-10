// Coletor Fase 1: SICONFI (Tesouro Nacional) — indicadores fiscais do município (base da capacidade de contrapartida).
// Uso: node coletores/siconfi.ts
// Fonte: docs/fontes/siconfi.md. Saída: data/core/siconfi-<ibge>.json
// Detecta sozinho o último RREO (bimestre) e o último RGF (quadrimestre) entregues pela Prefeitura em /extrato_entregas.
// Os links "self/next" das respostas apontam para host interno e NÃO são usados.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const BASE = 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt';
const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const IBGE: number = config.codigo_ibge;

async function api(caminho: string): Promise<any> {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const r = await fetch(`${BASE}/${caminho}`, { headers: { accept: 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (tentativa === 4) throw new Error(`SICONFI ${caminho.split('?')[0]}: ${(e as Error).message}`);
      await new Promise((ok) => setTimeout(ok, 6000 * tentativa)); // espera progressiva
    }
  }
}

/** Busca todas as páginas (offset), sem seguir os links internos da resposta. */
async function todos(caminho: string): Promise<any[]> {
  const itens: any[] = [];
  for (let offset = 0; ; ) {
    const j = await api(`${caminho}&offset=${offset}`);
    itens.push(...j.items);
    if (!j.hasMore) return itens;
    offset += j.limit ?? j.items.length;
  }
}

// 1) o que a Prefeitura já entregou (status HO = homologado)
const ano = new Date().getFullYear();
const entregas: any[] = [];
for (const a of [ano, ano - 1]) entregas.push(...(await todos(`extrato_entregas?id_ente=${IBGE}&an_referencia=${a}`)));
const prefeitura = entregas.filter((e) => /Prefeitura/i.test(e.instituicao ?? ''));
const ultimo = (nome: RegExp) =>
  prefeitura
    .filter((e) => nome.test(e.entregavel ?? '') && e.status_relatorio === 'HO')
    .sort((x, y) => y.exercicio - x.exercicio || y.periodo - x.periodo)[0];
const rreoEntrega = ultimo(/Resumido de Execu/i);
const rgfEntrega = ultimo(/Gest.o Fiscal/i);
if (!rreoEntrega || !rgfEntrega) throw new Error('RREO/RGF homologado não encontrado em /extrato_entregas (layout ou regra mudou?)');

// 2) RREO Anexo 01 (balanço orçamentário) e RGF Anexo 01 (despesa com pessoal)
const rreo = await todos(
  `rreo?an_exercicio=${rreoEntrega.exercicio}&in_periodicidade=B&nr_periodo=${rreoEntrega.periodo}&co_tipo_demonstrativo=RREO&no_anexo=${encodeURIComponent('RREO-Anexo 01')}&co_esfera=M&id_ente=${IBGE}`,
);
const rgf = await todos(
  `rgf?an_exercicio=${rgfEntrega.exercicio}&in_periodicidade=Q&nr_periodo=${rgfEntrega.periodo}&co_tipo_demonstrativo=RGF&no_anexo=${encodeURIComponent('RGF-Anexo 01')}&co_esfera=M&co_poder=E&id_ente=${IBGE}`,
);

const valor = (itens: any[], cod: string, coluna: RegExp): number | null => {
  const i = itens.find((x) => x.cod_conta === cod && coluna.test(x.coluna));
  return i && i.valor !== null ? Number(i.valor) : null;
};
const faltando: string[] = [];
const pega = (rotulo: string, v: number | null) => {
  if (v === null) faltando.push(rotulo);
  return v;
};

const rreoInd = {
  exercicio: rreoEntrega.exercicio,
  bimestre: rreoEntrega.periodo,
  receita_prevista_atualizada: pega('receita_prevista_atualizada', valor(rreo, 'ReceitasExcetoIntraOrcamentarias', /^PREVISÃO ATUALIZADA/)),
  receita_realizada_ate_bimestre: pega('receita_realizada_ate_bimestre', valor(rreo, 'ReceitasExcetoIntraOrcamentarias', /^Até o Bimestre \(c\)/)),
  receitas_correntes_realizadas_ate_bimestre: pega('receitas_correntes_realizadas', valor(rreo, 'ReceitasCorrentes', /^Até o Bimestre \(c\)/)),
};
const rgfInd = {
  exercicio: rgfEntrega.exercicio,
  quadrimestre: rgfEntrega.periodo,
  receita_corrente_liquida: pega('receita_corrente_liquida', valor(rgf, 'ReceitaCorrenteLiquidaLimiteLegal', /^Valor$/)),
  rcl_ajustada: pega('rcl_ajustada', valor(rgf, 'ReceitaCorrenteLiquidaAjustada', /^Valor$/)),
  despesa_pessoal_total: pega('despesa_pessoal_total', valor(rgf, 'DespesaComPessoalTotal', /^Valor$/)),
  despesa_pessoal_pct_rcl: pega('despesa_pessoal_pct_rcl', valor(rgf, 'DespesaComPessoalTotal', /^% sobre a RCL/)),
  limite_maximo_pct: pega('limite_maximo_pct', valor(rgf, 'LimiteMaximoDespesaComPessoalTotal', /^% sobre a RCL/)),
  limite_prudencial_pct: pega('limite_prudencial_pct', valor(rgf, 'LimitePrudencialDespesaComPessoalTotal', /^% sobre a RCL/)),
  limite_alerta_pct: pega('limite_alerta_pct', valor(rgf, 'LimiteDeAlertaDespesaComPessoalTotal', /^% sobre a RCL/)),
};
const pct = rgfInd.despesa_pessoal_pct_rcl;
const situacaoPessoal =
  pct === null || rgfInd.limite_alerta_pct === null || rgfInd.limite_prudencial_pct === null || rgfInd.limite_maximo_pct === null
    ? 'indeterminada'
    : pct > rgfInd.limite_maximo_pct ? 'acima do limite máximo'
    : pct > rgfInd.limite_prudencial_pct ? 'acima do limite prudencial'
    : pct > rgfInd.limite_alerta_pct ? 'acima do limite de alerta'
    : 'abaixo do limite de alerta';

const saida = {
  proveniencia: {
    fonte: 'Tesouro Nacional — SICONFI (RREO Anexo 01 e RGF Anexo 01, Prefeitura)',
    url_origem: BASE,
    data_referencia: {
      rreo: `${rreoEntrega.exercicio}/bimestre ${rreoEntrega.periodo} (homologado em ${rreoEntrega.data_status})`,
      rgf: `${rgfEntrega.exercicio}/quadrimestre ${rgfEntrega.periodo} (homologado em ${rgfEntrega.data_status})`,
    },
    data_coleta: new Date().toISOString(),
    id_carga: `siconfi-${new Date().toISOString().slice(0, 10)}`,
  },
  municipio: { codigo_ibge: IBGE },
  rreo: rreoInd,
  rgf: rgfInd,
  derivados: {
    situacao_despesa_pessoal: situacaoPessoal,
    margem_ate_limite_maximo_pontos_percentuais:
      pct !== null && rgfInd.limite_maximo_pct !== null ? Math.round((rgfInd.limite_maximo_pct - pct) * 100) / 100 : null,
    execucao_receita_pct:
      rreoInd.receita_realizada_ate_bimestre !== null && rreoInd.receita_prevista_atualizada
        ? Math.round((rreoInd.receita_realizada_ate_bimestre / rreoInd.receita_prevista_atualizada) * 10000) / 100
        : null,
  },
  avisos: faltando.length ? [`Indicadores não encontrados na resposta (layout mudou?): ${faltando.join(', ')}`] : [],
  nota: 'Indicadores de apoio à análise de contrapartida; a regra de capacidade de contrapartida será definida com o dono do produto.',
};
await mkdir('data/core', { recursive: true });
await writeFile(`data/core/siconfi-${IBGE}.json`, JSON.stringify(saida, null, 1) + '\n');
console.log(`RREO ${rreoEntrega.exercicio}/B${rreoEntrega.periodo} e RGF ${rgfEntrega.exercicio}/Q${rgfEntrega.periodo}`);
console.log('Pessoal:', pct, '% da RCL ajustada;', situacaoPessoal, '| receita realizada (R$):', rreoInd.receita_realizada_ate_bimestre);
if (faltando.length) console.log('ATENÇÃO, ausentes:', faltando.join(', '));
