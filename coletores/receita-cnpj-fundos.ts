// Coletor T5: CNPJs candidatos do município e dos fundos (Receita Federal, dados abertos do CNPJ).
// Uso: node coletores/receita-cnpj-fundos.ts [AAAA-MM] [--teste]
//   --teste: processa só o arquivo 1 de Empresas e de Estabelecimentos (validação rápida).
// Os ZIPs são baixados um a um, lidos em fluxo e apagados; nada além do resultado filtrado é guardado.
// Resultado: data/core/cnpjs-candidatos-<ibge>.json — SEMPRE "pendente_validacao" até a prefeitura confirmar.
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const TOKEN = 'YggdBLfdninEJX9'; // token público do compartilhamento da Receita (ver docs/fontes/receita-cnpj.md)
const WEBDAV = 'https://arquivos.receitafederal.gov.br/public.php/webdav';
const pasta = process.argv.find((a) => /^\d{4}-\d{2}$/.test(a)) ?? '2026-10';
const teste = process.argv.includes('--teste');
const TMP = 'data/raw/receita';

const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const IBGE: number = config.codigo_ibge;

// Naturezas jurídicas de interesse (docs/fontes/receita-cnpj.md): fundos municipais e entes municipais.
const NATUREZAS: Record<string, string> = {
  '1333': 'Fundo Público da Administração Direta Municipal',
  '1309': 'Fundo Público da Administração Indireta Municipal',
  '1244': 'Município',
  '1031': 'Órgão Público do Poder Executivo Municipal',
  '1120': 'Autarquia Municipal',
  '1155': 'Fundação Pública de Direito Público Municipal',
};

const tarBin = process.platform === 'win32' ? 'C:\\Windows\\System32\\tar.exe' : 'bsdtar';
const auth = 'Basic ' + Buffer.from(`${TOKEN}:`).toString('base64');

async function baixar(nome: string): Promise<string> {
  const destino = `${TMP}/${nome}`;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const r = await fetch(`${WEBDAV}/${pasta}/${nome}`, { headers: { authorization: auth } });
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

async function* linhas(zip: string) {
  const p = spawn(tarBin, ['-xOf', zip], { stdio: ['ignore', 'pipe', 'ignore'] });
  p.stdout.setEncoding('latin1');
  for await (const l of createInterface({ input: p.stdout, crlfDelay: Infinity })) yield l;
}

const campos = (l: string) => l.replace(/^"/, '').replace(/"$/, '').split('";"');

await mkdir(TMP, { recursive: true });

// 1) Código do município na Receita (não é o IBGE): casar por nome + UF do arquivo do IBGE.
const ibge = JSON.parse(await readFile('data/core/ibge-municipios.json', 'utf8'));
const alvoIbge = ibge.municipios.find((m: any) => m.codigo_ibge === IBGE);
const normaliza = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
const munZip = await baixar('Municipios.zip');
const codigosRfb: string[] = [];
for await (const l of linhas(munZip)) {
  const [cod, nome] = campos(l);
  if (normaliza(nome) === normaliza(alvoIbge.nome)) codigosRfb.push(cod);
}
await rm(munZip);
if (codigosRfb.length === 0) throw new Error('Município não encontrado na tabela da Receita');
console.log(`Município ${alvoIbge.nome}/${alvoIbge.uf}: códigos Receita ${codigosRfb.join(',')}`);

// 2) Empresas: guarda cnpj_basico das naturezas de interesse (todo o Brasil; só inteiros em memória).
const N = teste ? 1 : 10;
const empresas = new Map<string, { razao: string; natureza: string }>();
for (let i = 0; i < N; i++) {
  const nome = `Empresas${teste ? 1 : i}.zip`;
  const z = await baixar(nome);
  let lidas = 0;
  for await (const l of linhas(z)) {
    const c = campos(l); // 0 basico, 1 razao, 2 natureza
    lidas++;
    if (NATUREZAS[c[2]]) empresas.set(c[0], { razao: c[1], natureza: c[2] });
  }
  await rm(z);
  console.log(`${nome}: ${lidas} linhas; candidatas acumuladas ${empresas.size}`);
}

// 3) Estabelecimentos: filtra município e UF, e cruza com as naturezas de interesse.
const achados: any[] = [];
for (let i = 0; i < N; i++) {
  const nome = `Estabelecimentos${teste ? 1 : i}.zip`;
  const z = await baixar(nome);
  let lidas = 0;
  for await (const l of linhas(z)) {
    const c = campos(l);
    lidas++;
    // 0 basico, 1 ordem, 2 dv, 3 matriz/filial, 4 fantasia, 5 situação, 19 UF, 20 município RFB, 27 e-mail
    if (c[19] !== alvoIbge.uf || !codigosRfb.includes(c[20])) continue;
    const e = empresas.get(c[0]);
    if (!e) continue;
    achados.push({
      cnpj: `${c[0]}${c[1]}${c[2]}`,
      razao_social: e.razao,
      nome_fantasia: c[4] || null,
      natureza_juridica: e.natureza,
      natureza_descricao: NATUREZAS[e.natureza],
      situacao_cadastral: c[5],
      matriz: c[3] === '1',
      cnae_principal: c[11] ?? null,
      status_validacao: 'pendente_validacao',
    });
  }
  await rm(z);
  console.log(`${nome}: ${lidas} linhas; achados ${achados.length}`);
}

achados.sort((a, b) => a.natureza_juridica.localeCompare(b.natureza_juridica) || a.razao_social.localeCompare(b.razao_social));
const saida = {
  proveniencia: {
    fonte: 'Receita Federal — Dados Abertos do CNPJ',
    url_origem: `${WEBDAV}/${pasta}/ (Empresas*.zip, Estabelecimentos*.zip, Municipios.zip)`,
    data_referencia: pasta,
    data_coleta: new Date().toISOString(),
    id_carga: `receita-cnpj-${pasta}${teste ? '-teste' : ''}`,
    observacao: teste ? 'EXECUÇÃO DE TESTE: só o arquivo 1 de cada tipo; lista incompleta.' : 'Carga completa.',
  },
  municipio: { codigo_ibge: IBGE, nome: alvoIbge.nome, uf: alvoIbge.uf, codigos_receita: codigosRfb },
  aviso: 'Lista candidata. Nenhum CNPJ é considerado válido até a validação pela prefeitura.',
  cnpjs: achados,
};
await writeFile(`data/core/cnpjs-candidatos-${IBGE}${teste ? '-teste' : ''}.json`, JSON.stringify(saida, null, 1) + '\n');
console.log(`Concluído: ${achados.length} CNPJs candidatos.`);
