// Coletor: indicadores de saneamento do município (SINISA / Ministério das Cidades): água, esgoto, resíduos e drenagem.
// Uso: node coletores/sinisa.ts
// Fonte: planilhas oficiais (XLSX dentro de ZIP) publicadas em gov.br/cidades; ver docs/fontes/sinisa.md.
// Saída: data/core/saneamento-<ibge>.json (com proveniência). Sem dados pessoais (só indicadores agregados do município).
// Os ZIPs vão para data/raw/sinisa (ignorada pelo Git) e são apagados no fim. Sem dependências novas:
// o XLSX é lido com o tar do sistema (descompacta ZIP) e um leitor mínimo de XML.
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { baixarArquivo } from './lib/zip-csv.ts';

const tarBin = process.platform === 'win32' ? 'C:/Windows/System32/tar.exe' : 'bsdtar';
const BASE = 'https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa/resultados-sinisa';
const RAW = 'data/raw/sinisa';
const ANO = 2024;
const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const ibge = String(config.codigo_ibge);
const pausa = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
const hoje = new Date();
const hojeIso = hoje.toISOString().slice(0, 10);

type Def = { chave: string; codigo: string; texto: string; unidade: string; ressalva?: string };
type Fonte = {
  id: string; componente: string; zip: string; aninhado?: RegExp; arquivo: RegExp; defs: Def[];
};
// "texto" = trecho (sem acento, minúsculo) que o título da coluna na planilha DEVE conter: se a SINISA mudar o layout, o coletor falha em vez de gravar número errado.
const FONTES: Fonte[] = [
  {
    id: 'agua', componente: 'Abastecimento de água', zip: 'SINISA_Resultados_Ref2024.zip', arquivo: /AGUA_Indicadores_Base Municipal_2024.*\.xlsx$/,
    defs: [
      { chave: 'atendimento_populacao_total_rede_agua', codigo: 'IAG0001', texto: 'atendimento da populacao total com rede de abastecimento', unidade: '%' },
      { chave: 'atendimento_populacao_urbana_rede_agua', codigo: 'IAG0002', texto: 'atendimento da populacao urbana com rede de abastecimento', unidade: '%' },
      { chave: 'atendimento_domicilios_totais_rede_agua', codigo: 'IAG0004', texto: 'atendimento dos domicilios totais com rede de abastecimento', unidade: '%' },
      { chave: 'perdas_de_faturamento', codigo: 'IAG2012', texto: 'perdas de faturamento', unidade: '%' },
      { chave: 'perdas_totais_na_distribuicao', codigo: 'IAG2013', texto: 'perdas totais de agua na distribuicao', unidade: '%',
        ressalva: 'Valor como declarado na planilha SINISA; é menor que as perdas de faturamento (28,21%), então os dois indicadores usam definições diferentes. Conferir no glossário SINISA antes de comparar ou somar.' },
      { chave: 'consumo_total_medio_per_capita', codigo: 'IAG2006', texto: 'consumo total medio per capita', unidade: 'l/hab/dia' },
    ],
  },
  {
    id: 'esgoto', componente: 'Esgotamento sanitário', zip: 'SINISA_ESGOTO_Planilhas_2024.zip', arquivo: /ESGOTO_Indicadores_Base Municipal_2024\.xlsx$/,
    defs: [
      { chave: 'atendimento_populacao_total_rede_coletora', codigo: 'IES0001', texto: 'atendimento da populacao total com rede coletora', unidade: '%' },
      { chave: 'atendimento_domicilios_totais_rede_coletora', codigo: 'IES0004', texto: 'atendimento dos domicilios totais com rede coletora', unidade: '%' },
      { chave: 'atendimento_domicilios_totais_coleta_e_tratamento', codigo: 'IES0007', texto: 'domicilios totais com coleta e tratamento', unidade: '%' },
      { chave: 'esgoto_tratado_referido_ao_coletado', codigo: 'IES2004', texto: 'esgoto tratado referido ao esgoto coletado', unidade: '%' },
    ],
  },
  {
    id: 'residuos', componente: 'Manejo de resíduos sólidos urbanos', zip: 'SINISA_RESIDUOS_planilhas_2024.zip', arquivo: /RESIDUOS_Indicadores_2024\.xlsx$/,
    defs: [
      { chave: 'cobertura_populacao_total_coleta_domiciliar', codigo: 'IRS0001', texto: 'cobertura da populacao total com coleta de residuos', unidade: '%' },
      { chave: 'cobertura_populacao_urbana_coleta_domiciliar', codigo: 'IRS0002', texto: 'cobertura da populacao urbana com coleta de residuos', unidade: '%' },
      { chave: 'cobertura_populacao_total_coleta_seletiva', codigo: 'IRS0005', texto: 'cobertura da populacao total com coleta seletiva', unidade: '%',
        ressalva: 'Cobertura declarada pelo município; não mede a quantidade efetivamente reciclada (ver desempenho da coleta seletiva, IRS3001).' },
      { chave: 'disposicao_final_inadequada', codigo: 'IRS3002', texto: 'disposicao final inadequada', unidade: '%',
        ressalva: 'A planilha traz 100% para Goiânia, o que contradiz o fato de a capital ter aterro sanitário; tratar como inconsistência de preenchimento até conferir com a prefeitura. Não exibir como fato.' },
    ],
  },
  {
    id: 'drenagem', componente: 'Drenagem e manejo de águas pluviais urbanas', zip: 'SINISA_AGUASPLUVIAIS_Informacoes_Indicadores_2025.zip',
    aninhado: /AGUASPLUVIAIS_Indicadores_2024\.zip$/, arquivo: /AGUASPLUVIAIS_Indicadores_AP2024\.xlsx$/,
    defs: [
      { chave: 'parcela_area_urbanizada', codigo: 'IGE0001', texto: 'parcela de area urbanizada', unidade: '%' },
      { chave: 'vias_pavimentadas_na_area_urbana', codigo: 'IAP0001', texto: 'vias publicas pavimentadas', unidade: '%' },
      { chave: 'vias_com_rede_pluvial_subterranea', codigo: 'IAP0002', texto: 'redes de aguas pluviais subterraneas', unidade: '%' },
      { chave: 'domicilios_sujeitos_a_risco_de_inundacao', codigo: 'IGR0001', texto: 'domicilios sujeitos a risco de inundacao', unidade: '%' },
    ],
  },
];

// ---------- leitor mínimo de XLSX ----------
const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const desescapar = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&');
function extrairMembro(arquivo: string, membro: string): string {
  return execFileSync(tarBin, ['-xOf', arquivo, membro], { maxBuffer: 1 << 30 }).toString('utf8');
}
function colunaIndice(ref: string): number {
  let n = 0;
  for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
function lerPlanilha(xlsx: string): string[][] {
  const ss = extrairMembro(xlsx, 'xl/sharedStrings.xml');
  const textos: string[] = [];
  for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) textos.push(desescapar([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  const xml = extrairMembro(xlsx, 'xl/worksheets/sheet1.xml');
  const linhas: string[][] = [];
  for (const rm_ of xml.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
    const linha: string[] = [];
    for (const c of rm_[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /r="([A-Z]+\d+)"/.exec(c[1])?.[1];
      if (!ref || c[2] === undefined) continue;
      const tipo = /t="(\w+)"/.exec(c[1])?.[1];
      let v = '';
      if (tipo === 'inlineStr') v = desescapar([...c[2].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''));
      else {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(c[2])?.[1] ?? '';
        v = tipo === 's' ? (textos[+raw] ?? '') : desescapar(raw);
      }
      linha[colunaIndice(ref)] = v;
    }
    linhas.push(linha);
  }
  return linhas;
}
async function achar(dir: string, padrao: RegExp): Promise<string | undefined> {
  for (const e of await readdir(dir, { recursive: true })) if (padrao.test(String(e).replace(/\\/g, '/'))) return `${dir}/${String(e).replace(/\\/g, '/')}`;
  return undefined;
}

async function coletar(f: Fonte) {
  const url = `${BASE}/${f.zip}`;
  const zip = await baixarArquivo(url, `${RAW}/${f.zip}`);
  const dir = `${RAW}/${f.id}`;
  await mkdir(dir, { recursive: true });
  execFileSync(tarBin, ['-xf', zip, '-C', dir], { maxBuffer: 1 << 26 });
  if (f.aninhado) {
    const interno = await achar(dir, f.aninhado);
    if (!interno) throw new Error(`${f.id}: ZIP interno não encontrado`);
    execFileSync(tarBin, ['-xf', interno, '-C', dir], { maxBuffer: 1 << 26 });
  }
  const xlsx = await achar(dir, f.arquivo);
  if (!xlsx) throw new Error(`${f.id}: planilha de indicadores municipais não encontrada`);
  const linhas = lerPlanilha(xlsx);
  const cab = linhas.slice(0, 15);
  const doMun = linhas.filter((l) => l.slice(0, 3).some((c) => c === ibge));
  if (doMun.length === 0) throw new Error(`${f.id}: município ${ibge} não encontrado`);
  const linha = doMun[0];
  const indicadores: Record<string, any> = {};
  for (const d of f.defs) {
    const rowCod = cab.find((l) => l.some((c) => c === d.codigo));
    if (!rowCod) throw new Error(`${f.id}: código ${d.codigo} ausente no cabeçalho`);
    const col = rowCod.indexOf(d.codigo);
    const titulos = cab.map((l) => semAcento(l[col] ?? '')).filter(Boolean);
    if (!titulos.some((t) => t.includes(d.texto))) throw new Error(`${f.id}: coluna ${d.codigo} não bate com "${d.texto}" (layout mudou?)`);
    const bruto = (linha[col] ?? '').trim();
    const n = Number(bruto);
    const ok = bruto !== '' && Number.isFinite(n);
    indicadores[d.chave] = {
      codigo: d.codigo, unidade: d.unidade, valor: ok ? n : null,
      ...(ok ? {} : { motivo_sem_valor: bruto || 'vazio' }), ...(d.ressalva ? { ressalva: d.ressalva } : {}),
    };
  }
  const prestador = f.id === 'agua' || f.id === 'esgoto' ? linha.find((c, i) => i >= 6 && i <= 9 && /saneago/i.test(c ?? '')) ?? null : null;
  await rm(dir, { recursive: true, force: true });
  await rm(zip);
  return {
    componente: f.componente, ano_referencia: ANO, linhas_do_municipio: doMun.length,
    ...(prestador ? { prestador } : {}), indicadores,
    proveniencia: {
      fonte: `Ministério das Cidades — SINISA, planilha de indicadores por município, ${f.componente}, ano de referência ${ANO}`,
      url_origem: url, data_referencia: `ano de referência ${ANO}`, data_coleta: hoje.toISOString(), id_carga: `sinisa-${f.id}-${ANO}-${hojeIso}`,
    },
  };
}

await mkdir(RAW, { recursive: true });
const componentes: Record<string, any> = {};
for (const f of FONTES) { componentes[f.id] = await coletar(f); await pausa(3000); }

const saida = {
  municipio: { codigo_ibge: ibge, nome: config.nome, uf: config.uf },
  observacao: 'Indicadores municipais declarados ao SINISA (sucessor do SNIS) para o ano de referência 2024; valores como publicados pelo Ministério das Cidades, sem correção. Água e esgoto: base municipal (prestador regional). Ver ressalvas em cada indicador.',
  ...componentes,
  proveniencia: {
    fonte: 'Ministério das Cidades — SINISA (planilhas de resultados 2024)',
    url_origem: `${BASE}/`,
    data_referencia: `ano de referência ${ANO}`,
    data_coleta: hoje.toISOString(),
    id_carga: `sinisa-${hojeIso}`,
  },
};
await mkdir('data/core', { recursive: true });
await writeFile(`data/core/saneamento-${ibge}.json`, JSON.stringify(saida, null, 2) + '\n', 'utf8');
await rm(RAW, { recursive: true, force: true });
console.log(`saneamento-${ibge}.json:`, Object.fromEntries(Object.entries(componentes).map(([k, v]: any) => [k, Object.fromEntries(Object.entries(v.indicadores).map(([c, i]: any) => [c, i.valor]))])));
