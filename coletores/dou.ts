// Coletor Fase 1: Diário Oficial da União (base de dados abertos da Imprensa Nacional) — citações ao município e aos seus CNPJs.
// Uso: node coletores/dou.ts [caminho.zip ...]   (padrão: todos os .zip de data/raw/dou)
// Fonte: docs/fontes/dou-base-dados.md. Os ZIPs mensais (S01/S02/S03 + MMAAAA) são baixados pelo navegador
// (o acesso automatizado ao in.gov.br falha); este coletor lê os arquivos já salvos e extrai só as citações.
// Saída: data/core/dou-citacoes-<ibge>.json (base do alerta "publicação no DOU citando o município ou os CNPJs").
import { spawnSync } from 'node:child_process';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const tarBin = process.platform === 'win32' ? 'C:/Windows/System32/tar.exe' : 'bsdtar';
const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const IBGE: number = config.codigo_ibge;
const nomeMun = (JSON.parse(await readFile('data/core/ibge-municipios.json', 'utf8')).municipios.find((m: any) => m.codigo_ibge === IBGE)?.nome as string) ?? '';
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const nomeN = norm(nomeMun);

// CNPJs monitorados: da configuração validada e, enquanto não houver validação, os candidatos ativos de natureza municipal.
const cnpjs = new Set<string>(config.cnpjs ?? []);
const cand = `data/core/cnpjs-candidatos-${IBGE}.json`;
if (existsSync(cand)) {
  for (const c of JSON.parse(await readFile(cand, 'utf8')).cnpjs)
    if (c.situacao_cadastral === '02' && ['1244', '1333', '1309'].includes(c.natureza_juridica)) cnpjs.add(c.cnpj);
}
const fmt = (c: string) => c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
const reCnpj = new RegExp([...cnpjs].map((c) => `${c}|${fmt(c).replace(/[./-]/g, '\\$&')}`).join('|') || '$^');
const reMunicipio = new RegExp(`(munic[ií]pio de ${nomeN}|prefeitura (municipal )?de ${nomeN}|prefeito (municipal )?de ${nomeN})`, 'i');

const raiz = 'data/raw/dou';
const zips = process.argv.slice(2).length ? process.argv.slice(2) : (await readdir(raiz)).filter((f) => f.toLowerCase().endsWith('.zip')).map((f) => join(raiz, f));
if (zips.length === 0) throw new Error(`Nenhum ZIP em ${raiz}. Baixe os arquivos pelo navegador (ver docs/fontes/dou-base-dados.md).`);

const atributo = (x: string, nome: string) => x.match(new RegExp(`${nome}="([^"]*)"`))?.[1] ?? '';
const decodifica = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const citacoes: any[] = [];
const arquivosLidos: string[] = [];

for (const zip of zips) {
  const tmp = join(raiz, `tmp-${Date.now()}`);
  await mkdir(tmp, { recursive: true });
  const r = spawnSync(tarBin, ['-xf', zip, '-C', tmp, '--include=*.xml'], { stdio: 'ignore' });
  if (r.status !== 0) console.warn(`Aviso: extração de ${zip} terminou com status ${r.status}`);
  const arquivos = (await readdir(tmp)).filter((f) => f.endsWith('.xml'));
  for (const f of arquivos) {
    const x = await readFile(join(tmp, f), 'utf8');
    const texto = decodifica(x.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
    const porCnpj = reCnpj.test(texto);
    if (!porCnpj && !reMunicipio.test(norm(texto))) continue;
    const alvo = porCnpj ? reCnpj : reMunicipio;
    const idx = (porCnpj ? texto : norm(texto)).search(alvo);
    citacoes.push({
      data: atributo(x, 'pubDate'),
      secao: atributo(x, 'pubName'),
      tipo: atributo(x, 'artType'),
      orgao: decodifica(atributo(x, 'artCategory')),
      titulo: decodifica(x.match(/<Identifica><!\[CDATA\[([^\]]*)/)?.[1]?.trim() ?? ''),
      motivo: porCnpj ? 'cita CNPJ monitorado' : 'cita o município',
      trecho: texto.slice(Math.max(0, idx - 120), idx + 200).trim(),
      url_pdf: decodifica(atributo(x, 'pdfPage')),
      id_materia: atributo(x, 'idMateria'),
    });
  }
  arquivosLidos.push(`${zip} (${arquivos.length} publicações)`);
  await rm(tmp, { recursive: true, force: true });
}

// Remove duplicatas (mesma matéria citada em mais de um arquivo) e ordena por data.
const unicas = [...new Map(citacoes.map((c) => [`${c.id_materia}|${c.motivo}`, c])).values()].sort((a, b) => a.data.split('/').reverse().join('').localeCompare(b.data.split('/').reverse().join('')));
await writeFile(
  `data/core/dou-citacoes-${IBGE}.json`,
  JSON.stringify(
    {
      proveniencia: {
        fonte: 'Imprensa Nacional — Diário Oficial da União, base de dados abertos (XML)',
        url_origem: 'https://www.in.gov.br/acesso-a-informacao/dados-abertos/base-de-dados',
        data_referencia: arquivosLidos,
        data_coleta: new Date().toISOString(),
        id_carga: `dou-${new Date().toISOString().slice(0, 10)}`,
      },
      municipio: { codigo_ibge: IBGE, nome: nomeMun },
      cnpjs_monitorados: [...cnpjs].length,
      resumo: { citacoes: unicas.length, por_cnpj: unicas.filter((c) => c.motivo.startsWith('cita CNPJ')).length },
      citacoes: unicas,
    },
    null,
    1,
  ) + '\n',
);
console.log(`arquivos: ${arquivosLidos.join('; ')}\ncitações: ${unicas.length} (por CNPJ monitorado: ${unicas.filter((c) => c.motivo.startsWith('cita CNPJ')).length}); CNPJs monitorados: ${cnpjs.size}`);
