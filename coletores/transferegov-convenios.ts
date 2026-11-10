// Coletor Fase 1: Transferegov (arquivos abertos, ex-SICONV) recortado por município.
// Uso: node coletores/transferegov-convenios.ts [--forcar]
// Fonte: https://api-publica.transferegov.gestao.gov.br/downloads/dadosgov/ (ver docs/fontes/transferegov-arquivos.md)
// Saída: data/core/transferegov-<ibge>.json (com proveniência). Estado de mudança: data/raw/transferegov/estado.json.
// Regra-chave: saldo a liberar = valor de repasse pactuado − total desembolsado.
// Campos bancários (banco, agência, conta) NÃO são coletados.
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const BASE = 'https://api-publica.transferegov.gestao.gov.br/downloads/dadosgov';
const TMP = 'data/raw/transferegov';
const forcar = process.argv.includes('--forcar');
const tarBin = process.platform === 'win32' ? 'C:\\Windows\\System32\\tar.exe' : 'bsdtar';

const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const IBGE7 = String(config.codigo_ibge);
const IBGE6 = IBGE7.slice(0, 6);
const SaidaPath = `data/core/transferegov-${IBGE7}.json`;

const ARQUIVOS = ['proposta', 'convenio', 'desembolso', 'empenho', 'termo_aditivo', 'emenda'] as const;
type Linha = Record<string, string>;

// ---------- listagem e detecção de mudança ----------
async function listagem(): Promise<Record<string, { tamanho: string; modificado: string; md5: string }>> {
  const r = await fetch(`${BASE}/?restype=container&comp=list`);
  if (!r.ok) throw new Error(`listagem HTTP ${r.status}`);
  const xml = await r.text();
  const saida: Record<string, { tamanho: string; modificado: string; md5: string }> = {};
  for (const m of xml.matchAll(/<Blob>([\s\S]*?)<\/Blob>/g)) {
    const b = m[1];
    const pega = (tag: string) => b.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] ?? '';
    saida[pega('Name')] = { tamanho: pega('Content-Length'), modificado: pega('Last-Modified'), md5: pega('Content-MD5') };
  }
  return saida;
}

async function baixar(nome: string): Promise<string> {
  const destino = `${TMP}/${nome}`;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const r = await fetch(`${BASE}/${nome}`);
      if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
      await pipeline(Readable.fromWeb(r.body as any), createWriteStream(destino));
      return destino;
    } catch (e) {
      if (tentativa === 3) throw new Error(`${nome}: ${(e as Error).message}`);
      await new Promise((ok) => setTimeout(ok, 5000 * tentativa)); // espera progressiva
    }
  }
  throw new Error('inalcançável');
}

// ---------- leitura de CSV (aspas, ';' e quebras de linha dentro de campo) ----------
async function* registros(zip: string): AsyncGenerator<Linha> {
  const p = spawn(tarBin, ['-xOf', zip], { stdio: ['ignore', 'pipe', 'ignore'] });
  const dec = new TextDecoder('utf-8');
  let campo = '';
  let linha: string[] = [];
  let aspas = false;
  let cabecalho: string[] | null = null;
  let primeiro = true;

  const fechaLinha = function* (): Generator<Linha> {
    linha.push(campo);
    campo = '';
    if (!cabecalho) cabecalho = linha.map((c) => c.replace(/^\uFEFF/, '').trim());
    else if (linha.length === cabecalho.length) {
      const o: Linha = {};
      cabecalho.forEach((k, i) => (o[k] = linha[i]));
      yield o;
    }
    linha = [];
  };

  for await (const pedaco of p.stdout) {
    const texto = dec.decode(pedaco as Buffer, { stream: true });
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (primeiro) { primeiro = false; if (c === '\uFEFF') continue; }
      if (aspas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; }
          else aspas = false;
        } else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === ';') { linha.push(campo); campo = ''; }
      else if (c === '\n') yield* fechaLinha();
      else if (c !== '\r') campo += c;
    }
  }
  if (campo || linha.length) yield* fechaLinha();
}

const num = (v: string | undefined) => (v === undefined || v === '' ? null : Number(String(v).replace(/\./g, '').replace(',', '.')));
const ehDoMunicipio = (cod: string) => cod === IBGE7 || cod === IBGE6;

// ---------- execução ----------
await mkdir(TMP, { recursive: true });
const lista = await listagem();
const assinaturas: Record<string, string> = {};
for (const a of ARQUIVOS) {
  const e = lista[`siconv_${a}.zip`];
  if (!e) throw new Error(`arquivo siconv_${a}.zip ausente na listagem (a fonte pode ter mudado de layout)`);
  assinaturas[a] = `${e.tamanho}|${e.modificado}|${e.md5}`;
}
const estadoPath = `${TMP}/estado.json`;
const anterior = existsSync(estadoPath) ? JSON.parse(await readFile(estadoPath, 'utf8')) : {};
if (!forcar && existsSync(SaidaPath) && ARQUIVOS.every((a) => anterior[a] === assinaturas[a])) {
  console.log('Sem mudança nos arquivos da fonte desde a última carga; nada a fazer (use --forcar para refazer).');
  process.exit(0);
}
const coleta = new Date().toISOString();

// 1) proposta: recorte por município (ID_PROPOSTA); sem campos bancários
const propostas: any[] = [];
const idsProposta = new Set<string>();
{
  const z = await baixar('siconv_proposta.zip');
  let lidas = 0;
  for await (const r of registros(z)) {
    lidas++;
    if (!ehDoMunicipio(r.COD_MUNIC_IBGE)) continue;
    idsProposta.add(r.ID_PROPOSTA);
    propostas.push({
      id_proposta: r.ID_PROPOSTA,
      proponente_cnpj: r.IDENTIF_PROPONENTE,
      proponente_nome: r.NM_PROPONENTE,
      natureza_juridica: r.NATUREZA_JURIDICA,
      orgao_superior: r.DESC_ORGAO_SUP,
      orgao: r.DESC_ORGAO,
      modalidade: r.MODALIDADE,
      situacao: r.SIT_PROPOSTA,
      objeto: r.OBJETO_PROPOSTA,
      vigencia_inicio: r.DIA_INIC_VIGENCIA_PROPOSTA,
      vigencia_fim: r.DIA_FIM_VIGENCIA_PROPOSTA,
      valor_global: num(r.VL_GLOBAL_PROP),
      valor_repasse: num(r.VL_REPASSE_PROP),
      valor_contrapartida: num(r.VL_CONTRAPARTIDA_PROP),
    });
  }
  await rm(z);
  console.log(`proposta: ${lidas} linhas; do município ${propostas.length}`);
}

// 2) convênio (por ID_PROPOSTA)
const convenios: any[] = [];
const nrConvenios = new Set<string>();
{
  const z = await baixar('siconv_convenio.zip');
  for await (const r of registros(z)) {
    if (!idsProposta.has(r.ID_PROPOSTA)) continue;
    nrConvenios.add(r.NR_CONVENIO);
    const repasse = num(r.VL_REPASSE_CONV);
    const desembolsado = num(r.VL_DESEMBOLSADO_CONV);
    convenios.push({
      nr_convenio: r.NR_CONVENIO,
      id_proposta: r.ID_PROPOSTA,
      situacao: r.SIT_CONVENIO,
      subsituacao: r.SUBSITUACAO_CONV,
      assinatura: r.DIA_ASSIN_CONV,
      vigencia_inicio: r.DIA_INIC_VIGENC_CONV,
      vigencia_fim: r.DIA_FIM_VIGENC_CONV,
      limite_prestacao_contas: r.DIA_LIMITE_PREST_CONTAS,
      valor_global: num(r.VL_GLOBAL_CONV),
      valor_repasse: repasse,
      valor_contrapartida: num(r.VL_CONTRAPARTIDA_CONV),
      valor_empenhado: num(r.VL_EMPENHADO_CONV),
      valor_desembolsado: desembolsado,
      saldo_a_liberar: repasse !== null && desembolsado !== null ? Math.round((repasse - desembolsado) * 100) / 100 : null,
      qtd_aditivos: num(r.QTD_TA),
      qtd_prorrogas: num(r.QTD_PRORROGA),
    });
  }
  await rm(z);
  console.log(`convenio: do município ${convenios.length}`);
}

// 3) desembolso, empenho e termo aditivo (por NR_CONVENIO); emenda (por ID_PROPOSTA)
const desembolsos: any[] = [];
const empenhos: any[] = [];
const aditivos: any[] = [];
const emendas: any[] = [];
for (const [arquivo, filtra, guarda] of [
  ['desembolso', (r: Linha) => nrConvenios.has(r.NR_CONVENIO), (r: Linha) => desembolsos.push({ id: r.ID_DESEMBOLSO, nr_convenio: r.NR_CONVENIO, data: r.DATA_DESEMBOLSO, valor: num(r.VL_DESEMBOLSADO) })],
  ['empenho', (r: Linha) => nrConvenios.has(r.NR_CONVENIO), (r: Linha) => empenhos.push({ id: r.ID_EMPENHO, nr_convenio: r.NR_CONVENIO, numero: r.NR_EMPENHO, data: r.DATA_EMISSAO, situacao: r.DESC_SITUACAO_EMPENHO, valor: num(r.VALOR_EMPENHO) })],
  ['termo_aditivo', (r: Linha) => nrConvenios.has(r.NR_CONVENIO), (r: Linha) => aditivos.push({ nr_convenio: r.NR_CONVENIO, numero: r.NUMERO_TA, tipo: r.TIPO_TA, assinatura: r.DT_ASSINATURA_TA, inicio: r.DT_INICIO_TA, fim: r.DT_FIM_TA, valor_global: num(r.VL_GLOBAL_TA), valor_repasse: num(r.VL_REPASSE_TA) })],
  ['emenda', (r: Linha) => idsProposta.has(r.ID_PROPOSTA), (r: Linha) => emendas.push({ id_proposta: r.ID_PROPOSTA, numero: r.NR_EMENDA, parlamentar: r.NOME_PARLAMENTAR, tipo_parlamentar: r.TIPO_PARLAMENTAR, impositivo: r.IND_IMPOSITIVO, valor_repasse: num(r.VALOR_REPASSE_EMENDA) })],
] as const) {
  const z = await baixar(`siconv_${arquivo}.zip`);
  let n = 0;
  for await (const r of registros(z)) if (filtra(r)) { guarda(r); n++; }
  await rm(z);
  console.log(`${arquivo}: ${n} registros do município`);
}

// 4) conciliação interna: desembolso por convênio × valor desembolsado informado no convênio
const somaDesembolso = new Map<string, number>();
for (const d of desembolsos) somaDesembolso.set(d.nr_convenio, (somaDesembolso.get(d.nr_convenio) ?? 0) + (d.valor ?? 0));
const naturezaPorProposta = new Map<string, string>(propostas.map((p) => [p.id_proposta, p.natureza_juridica as string]));
const esferaDe = (natureza: string) =>
  /municipal/i.test(natureza) ? 'municipal' : /estadual|distrito federal/i.test(natureza) ? 'estadual' : /federal/i.test(natureza) ? 'federal' : 'outros';
const r2 = (n: number) => Math.round(n * 100) / 100;
for (const c of convenios) {
  const soma = r2(somaDesembolso.get(c.nr_convenio) ?? 0);
  c.natureza_juridica = naturezaPorProposta.get(c.id_proposta) ?? null;
  c.esfera = esferaDe(c.natureza_juridica ?? '');
  c.desembolsado_conferido = soma;
  c.divergencia_desembolso = c.valor_desembolsado === null ? null : r2(c.valor_desembolsado - soma);
  // Regra-chave: saldo a liberar = repasse pactuado − total desembolsado. Se o convênio não informa o desembolsado
  // (campo em branco), usa-se a soma dos desembolsos registrados.
  const desembolsado = c.valor_desembolsado ?? soma;
  c.saldo_a_liberar = c.valor_repasse === null ? null : r2(c.valor_repasse - desembolsado);
}

// "Ativo" = em execução. Convênios concluídos/anulados com repasse não desembolsado NÃO são saldo a liberar real.
const emExecucao = (c: any) => /^em execu/i.test(c.situacao ?? '');
const soma = (lista: any[], campo: string) => r2(lista.reduce((s, c) => s + (c[campo] ?? 0), 0));
const resumoDe = (lista: any[]) => {
  const ativos = lista.filter(emExecucao);
  return {
    convenios: lista.length,
    em_execucao: ativos.length,
    valor_repasse_pactuado_em_execucao: soma(ativos, 'valor_repasse'),
    valor_desembolsado_em_execucao: r2(ativos.reduce((s, c) => s + (c.valor_desembolsado ?? c.desembolsado_conferido ?? 0), 0)),
    saldo_a_liberar_em_execucao: soma(ativos, 'saldo_a_liberar'),
    assinados_sem_nenhum_desembolso: ativos.filter((c) => (c.valor_desembolsado ?? c.desembolsado_conferido ?? 0) === 0).length,
  };
};
const resumo = {
  todas_as_esferas: resumoDe(convenios),
  por_esfera: Object.fromEntries(['municipal', 'estadual', 'federal', 'outros'].map((e) => [e, resumoDe(convenios.filter((c) => c.esfera === e))])),
  divergencias_desembolso: convenios.filter((c) => Math.abs(c.divergencia_desembolso ?? 0) > 0.01).length,
  nota: 'Saldo a liberar só é calculado como pendência real para convênios em execução. A esfera vem da natureza jurídica do proponente; "municipal" inclui a prefeitura e seus fundos.',
};

await writeFile(
  SaidaPath,
  JSON.stringify(
    {
      proveniencia: {
        fonte: 'Transferegov — arquivos abertos (siconv_*.zip), módulo Discricionárias e Legais',
        url_origem: `${BASE}/`,
        data_referencia: Object.fromEntries(ARQUIVOS.map((a) => [a, lista[`siconv_${a}.zip`].modificado])),
        data_coleta: coleta,
        id_carga: `transferegov-${coleta.slice(0, 10)}`,
        hash_arquivo: Object.fromEntries(ARQUIVOS.map((a) => [a, lista[`siconv_${a}.zip`].md5 || assinaturas[a]])),
      },
      municipio: { codigo_ibge: config.codigo_ibge },
      resumo,
      propostas,
      convenios,
      desembolsos,
      empenhos,
      aditivos,
      emendas,
    },
    null,
    1,
  ) + '\n',
);
await writeFile(estadoPath, JSON.stringify(assinaturas, null, 1));
console.log('Resumo:', JSON.stringify(resumo));
