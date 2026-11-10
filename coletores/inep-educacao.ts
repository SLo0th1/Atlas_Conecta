// Coletor: indicadores de educação do município (Censo Escolar do INEP + IDEB). Sem dados pessoais:
// só contagens agregadas por dependência administrativa; nomes de escolas e CNPJs NÃO são gravados.
// Uso: node coletores/inep-educacao.ts
// Fontes: docs/fontes/fnde-inep.md. Saída: data/core/educacao-<ibge>.json (com proveniência).
// Arquivos grandes vão para data/raw/inep (ignorada pelo Git), são lidos em fluxo e apagados no fim.
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { baixarArquivo } from './lib/zip-csv.ts';

const tarBin = process.platform === 'win32' ? 'C:/Windows/System32/tar.exe' : 'bsdtar';
const BASE = 'https://download.inep.gov.br';
const RAW = 'data/raw/inep';
const ANOS_CENSO = [2023, 2024]; // 2024 é o principal; 2023 serve de comparação
const IDEB_ANO = 2023;
const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const ibge = String(config.codigo_ibge);
const pausa = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
const hoje = new Date();
const hojeIso = hoje.toISOString().slice(0, 10);

async function ultimaModificacao(url: string): Promise<string> {
  for (let t = 1; t <= 3; t++) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      const lm = r.headers.get('last-modified');
      return lm ? new Date(lm).toISOString().slice(0, 10) : 'desconhecida';
    } catch { await pausa(3000 * t); } // o servidor do INEP derruba conexões ocasionalmente
  }
  return 'desconhecida';
}
function listarZip(zip: string): string[] {
  return execFileSync(tarBin, ['-tf', zip], { maxBuffer: 1 << 26 }).toString('latin1').split(/\r?\n/).filter(Boolean);
}

// ---------- Censo Escolar ----------
const DEPENDENCIA: Record<string, string> = { '1': 'federal', '2': 'estadual', '3': 'municipal', '4': 'privada' };
const LOCALIZACAO: Record<string, string> = { '1': 'urbana', '2': 'rural' };
const MATRICULAS: Record<string, string> = {
  total_educacao_basica: 'QT_MAT_BAS', creche: 'QT_MAT_INF_CRE', pre_escola: 'QT_MAT_INF_PRE', fundamental_anos_iniciais: 'QT_MAT_FUND_AI',
  fundamental_anos_finais: 'QT_MAT_FUND_AF', ensino_medio: 'QT_MAT_MED', educacao_profissional: 'QT_MAT_PROF', eja: 'QT_MAT_EJA',
  educacao_especial: 'QT_MAT_ESP',
};
const ETAPAS: Record<string, string> = {
  educacao_infantil: 'IN_INF', fundamental_anos_iniciais: 'IN_FUND_AI', fundamental_anos_finais: 'IN_FUND_AF', ensino_medio: 'IN_MED',
  educacao_profissional: 'IN_PROF', eja: 'IN_EJA', educacao_especial: 'IN_ESP',
};
const vazio = () => ({ escolas_em_atividade: 0, matriculas: {} as Record<string, number>, docentes: 0, turmas: 0, escolas_por_etapa: {} as Record<string, number> });
const num = (v: string | undefined) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

async function lerCenso(ano: number) {
  const url = `${BASE}/dados_abertos/microdados_censo_escolar_${ano}.zip`;
  const modificado = await ultimaModificacao(url);
  const zip = await baixarArquivo(url, `${RAW}/censo-${ano}.zip`);
  const membro = listarZip(zip).find((n) => /dados\/microdados_ed_basica_\d{4}\.csv$/.test(n));
  if (!membro) throw new Error(`CSV principal não encontrado no ZIP do Censo ${ano}`);
  const p = spawn(tarBin, ['-xOf', zip, membro], { stdio: ['ignore', 'pipe', 'ignore'] });
  const dec = new TextDecoder('windows-1252'); // microdados do INEP: ISO-8859-1
  let resto = '';
  let cab: string[] | null = null;
  let idx: Record<string, number> = {};
  let lidas = 0, doMunicipio = 0, descartadas = 0;
  const porDep: Record<string, ReturnType<typeof vazio>> = {};
  const porLoc: Record<string, Record<string, number>> = {};
  const tratar = (linha: string) => {
    if (!cab) { cab = linha.replace(/^\uFEFF/, '').split(';').map((c) => c.trim()); cab.forEach((c, i) => (idx[c] = i)); return; }
    lidas++;
    if (!linha.includes(`;${ibge};`)) return; // filtro barato antes de dividir
    const c = linha.split(';');
    if (c.length !== cab.length) { descartadas++; return; }
    if (c[idx.CO_MUNICIPIO] !== ibge) return;
    doMunicipio++;
    if (c[idx.TP_SITUACAO_FUNCIONAMENTO] !== '1') return; // 1 = em atividade
    const dep = DEPENDENCIA[c[idx.TP_DEPENDENCIA]] ?? 'desconhecida';
    const a = (porDep[dep] ??= vazio());
    a.escolas_em_atividade++;
    for (const [k, col] of Object.entries(MATRICULAS)) a.matriculas[k] = (a.matriculas[k] ?? 0) + num(c[idx[col]]);
    a.docentes += num(c[idx.QT_DOC_BAS]);
    a.turmas += num(c[idx.QT_TUR_BAS]);
    for (const [k, col] of Object.entries(ETAPAS)) if (c[idx[col]] === '1') a.escolas_por_etapa[k] = (a.escolas_por_etapa[k] ?? 0) + 1;
    const loc = LOCALIZACAO[c[idx.TP_LOCALIZACAO]] ?? 'desconhecida';
    (porLoc[dep] ??= {})[loc] = (porLoc[dep][loc] ?? 0) + 1;
  };
  for await (const pedaco of p.stdout) {
    resto += dec.decode(pedaco as Buffer, { stream: true });
    let i: number;
    while ((i = resto.indexOf('\n')) >= 0) { tratar(resto.slice(0, i).replace(/\r$/, '')); resto = resto.slice(i + 1); }
  }
  if (resto) tratar(resto);
  await rm(zip);
  const total = vazio();
  for (const a of Object.values(porDep)) {
    total.escolas_em_atividade += a.escolas_em_atividade; total.docentes += a.docentes; total.turmas += a.turmas;
    for (const [k, v] of Object.entries(a.matriculas)) total.matriculas[k] = (total.matriculas[k] ?? 0) + v;
    for (const [k, v] of Object.entries(a.escolas_por_etapa)) total.escolas_por_etapa[k] = (total.escolas_por_etapa[k] ?? 0) + v;
  }
  if (!doMunicipio) throw new Error(`Censo ${ano}: nenhuma linha do município ${ibge}`);
  return {
    ano, arquivo_membro: membro, linhas_lidas: lidas, linhas_do_municipio: doMunicipio, linhas_descartadas_por_formato: descartadas,
    por_dependencia: Object.fromEntries(Object.entries(porDep).map(([k, v]) => [k, { ...v, escolas_por_localizacao: porLoc[k] ?? {} }])),
    total,
    proveniencia: {
      fonte: `INEP — Censo Escolar ${ano}, microdados (matrícula inicial, escolas em atividade)`,
      url_origem: url,
      data_referencia: `Censo Escolar ${ano} (arquivo modificado em ${modificado})`,
      data_coleta: hoje.toISOString(),
      id_carga: `inep-censo-${ano}-${hojeIso}`,
    },
  };
}

// ---------- IDEB (planilha XLSX lida em fluxo; sem biblioteca) ----------
const colNum = (s: string) => [...s].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const decXml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

async function lerIdeb(etapa: 'iniciais' | 'finais') {
  const nome = `divulgacao_anos_${etapa}_municipios_${IDEB_ANO}`;
  const url = `${BASE}/ideb/resultados/${nome}.zip`;
  const modificado = await ultimaModificacao(url);
  const zip = await baixarArquivo(url, `${RAW}/${nome}.zip`);
  await mkdir(`${RAW}/${nome}`, { recursive: true });
  execFileSync(tarBin, ['-xf', zip, '-C', `${RAW}/${nome}`, `${nome}/${nome}.xlsx`]);
  const xlsx = `${RAW}/${nome}/${nome}/${nome}.xlsx`;
  const ss = execFileSync(tarBin, ['-xOf', xlsx, 'xl/sharedStrings.xml'], { maxBuffer: 1 << 28 }).toString('utf8');
  const textos = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => decXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  const p = spawn(tarBin, ['-xOf', xlsx, 'xl/worksheets/sheet1.xml'], { stdio: ['ignore', 'pipe', 'ignore'] });
  let buf = '';
  let cabecalho: Record<string, string> = {}; // coluna -> nome técnico (linha 10)
  const linhas: Record<string, string>[] = [];
  for await (const pedaco of p.stdout) {
    buf += (pedaco as Buffer).toString('utf8');
    let i: number;
    while ((i = buf.indexOf('</row>')) >= 0) {
      const row = buf.slice(0, i);
      buf = buf.slice(i + 6);
      const r = Number(row.match(/<row r="(\d+)"/)?.[1] ?? 0);
      if (r !== 10 && !row.includes(`<v>`)) continue;
      const cel: Record<string, string> = {};
      for (const m of row.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>(?:<v>([^<]*)<\/v>)?<\/c>)/g)) {
        if (m[3] === undefined) continue;
        cel[m[1]] = /t="s"/.test(m[2]) ? textos[Number(m[3])] : m[3];
      }
      if (r === 10) { cabecalho = cel; continue; }
      if (r > 10 && Object.values(cel).length && cel.B === ibge) {
        const o: Record<string, string> = {};
        for (const [c, v] of Object.entries(cel)) if (cabecalho[c]) o[cabecalho[c]] = v;
        linhas.push(o);
      }
    }
  }
  await rm(`${RAW}/${nome}`, { recursive: true, force: true });
  await rm(zip);
  if (!linhas.length) throw new Error(`IDEB ${etapa}: município ${ibge} não encontrado`);
  const valor = (s: string | undefined) => { const n = Number((s ?? '').replace(',', '.')); return s && Number.isFinite(n) && s !== '-' ? n : null; };
  const redes: Record<string, any> = {};
  for (const l of linhas) {
    const serie = (prefixo: string) => Object.fromEntries(Object.keys(l).filter((k) => k.startsWith(prefixo)).map((k) => [k.slice(prefixo.length), valor(l[k])]).sort());
    redes[l.REDE.toLowerCase()] = {
      ideb_observado: serie('VL_OBSERVADO_'), meta_ideb: serie('VL_PROJECAO_'),
      indicador_rendimento_aprovacao: serie('VL_INDICADOR_REND_'), nota_saeb_padronizada: serie('VL_NOTA_MEDIA_'),
    };
  }
  return {
    etapa: etapa === 'iniciais' ? 'anos_iniciais_1_ao_5_ano' : 'anos_finais_6_ao_9_ano', redes,
    proveniencia: {
      fonte: `INEP — IDEB ${IDEB_ANO}, anos ${etapa} do ensino fundamental, resultados por município e rede`,
      url_origem: url, data_referencia: `IDEB ${IDEB_ANO} (arquivo modificado em ${modificado})`,
      data_coleta: hoje.toISOString(), id_carga: `inep-ideb-${etapa}-${IDEB_ANO}-${hojeIso}`,
    },
  };
}

await mkdir(RAW, { recursive: true });
const censo = [];
for (const ano of ANOS_CENSO) { censo.push(await lerCenso(ano)); await pausa(3000); }
const ideb = [];
for (const e of ['iniciais', 'finais'] as const) { ideb.push(await lerIdeb(e)); await pausa(3000); }

const saida = {
  municipio: { codigo_ibge: ibge, nome: config.nome, uf: config.uf },
  observacao: 'Contagens agregadas por dependência administrativa (escolas em atividade; matrículas = QT_MAT_* do Censo Escolar). Sem nomes de escolas, CNPJs ou dados pessoais. IDEB: 1 linha por rede (municipal, estadual, federal, pública = estadual+municipal).',
  censo_escolar: censo,
  ideb,
  proveniencia: {
    fonte: 'INEP — Censo Escolar (microdados) e IDEB (resultados por município)',
    url_origem: `${BASE}/dados_abertos/ e ${BASE}/ideb/resultados/`,
    data_referencia: `Censo Escolar ${ANOS_CENSO.join('/')}; IDEB ${IDEB_ANO}`,
    data_coleta: hoje.toISOString(),
    id_carga: `inep-educacao-${hojeIso}`,
  },
};
await mkdir('data/core', { recursive: true });
await writeFile(`data/core/educacao-${ibge}.json`, JSON.stringify(saida, null, 2) + '\n', 'utf8');
const c24 = censo[censo.length - 1];
console.log(`educacao-${ibge}.json: Censo ${c24.ano} escolas em atividade=${c24.total.escolas_em_atividade}`,
  Object.fromEntries(Object.entries(c24.por_dependencia).map(([k, v]: any) => [k, v.escolas_em_atividade])));
