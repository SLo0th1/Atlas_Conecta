// Coletor Fase 1 (módulo Oportunidades): programas do Transferegov abertos para proposta e elegíveis ao município.
// Uso: node coletores/programas-abertos.ts
// Fonte: siconv_programa.zip (Discricionárias e Legais), ver docs/fontes/transferegov-arquivos.md e novo-pac-editais.md.
// O arquivo tem 1 linha por programa × natureza jurídica × UF; aqui agregamos por programa.
// Saída: data/core/programas-abertos-<ibge>.json (com proveniência). Classifica por tema (data/config/temas.json).
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { baixarArquivo, registrosCsv } from './lib/zip-csv.ts';

const BASE = 'https://api-publica.transferegov.gestao.gov.br/downloads/dadosgov';
const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const ibgeMun = JSON.parse(await readFile('data/core/ibge-municipios.json', 'utf8')).municipios.find((m: any) => m.codigo_ibge === config.codigo_ibge);
if (!ibgeMun) throw new Error('Município não está na tabela do IBGE (rode coletores/ibge-municipios.ts)');
const temas: { id: string; nome: string; palavras_chave: string[]; orgaos_concedentes: string[] }[] = JSON.parse(await readFile('data/config/temas.json', 'utf8')).temas;

const hoje = new Date();
const hojeIso = hoje.toISOString().slice(0, 10);
const paraIso = (d: string) => (/^\d{2}\/\d{2}\/\d{4}$/.test(d) ? `${d.slice(6)}-${d.slice(3, 5)}-${d.slice(0, 2)}` : null);
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const listagem = await (await fetch(`${BASE}/?restype=container&comp=list`)).text();
const bloco = listagem.match(/<Blob>(?:(?!<\/Blob>)[\s\S])*siconv_programa\.zip[\s\S]*?<\/Blob>/)?.[0] ?? '';
const modificado = bloco.match(/<Last-Modified>([^<]*)</)?.[1] ?? 'desconhecida';

await mkdir('data/raw/transferegov', { recursive: true });
const zip = await baixarArquivo(`${BASE}/siconv_programa.zip`, 'data/raw/transferegov/siconv_programa.zip');

type Programa = {
  codigo: string; nome: string; orgao_superior: string; situacao: string; modalidade: string; acao_orcamentaria: string;
  disponibilizado_em: string | null;
  prazos: { proposta_ate: string | null; emendas_ate: string | null; beneficiario_especifico_ate: string | null };
  naturezas: Set<string>; ufs: Set<string>;
};
const porPrograma = new Map<string, Programa>();
let lidas = 0;
for await (const r of registrosCsv(zip)) {
  lidas++;
  if (r.SIT_PROGRAMA !== 'DISPONIBILIZADO') continue;
  const fins = [paraIso(r.DT_PROG_FIM_RECEB_PROP), paraIso(r.DT_PROG_FIM_EMENDA_PAR), paraIso(r.DT_PROG_FIM_BENEF_ESP)];
  if (!fins.some((f) => f !== null && f >= hojeIso)) continue; // sem prazo aberto
  let p = porPrograma.get(r.COD_PROGRAMA);
  if (!p) {
    p = {
      codigo: r.COD_PROGRAMA, nome: r.NOME_PROGRAMA, orgao_superior: r.DESC_ORGAO_SUP_PROGRAMA, situacao: r.SIT_PROGRAMA,
      modalidade: r.MODALIDADE_PROGRAMA, acao_orcamentaria: r.ACAO_ORCAMENTARIA, disponibilizado_em: paraIso(r.DATA_DISPONIBILIZACAO),
      prazos: { proposta_ate: paraIso(r.DT_PROG_FIM_RECEB_PROP), emendas_ate: paraIso(r.DT_PROG_FIM_EMENDA_PAR), beneficiario_especifico_ate: paraIso(r.DT_PROG_FIM_BENEF_ESP) },
      naturezas: new Set(), ufs: new Set(),
    };
    porPrograma.set(r.COD_PROGRAMA, p);
  }
  p.naturezas.add(r.NATUREZA_JURIDICA_PROGRAMA);
  p.ufs.add(r.UF_PROGRAMA);
}
await rm(zip);

const abertos = [...porPrograma.values()];
const elegiveis = abertos.filter((p) => p.naturezas.has('Administração Pública Municipal') && (p.ufs.has(ibgeMun.uf) || p.ufs.has('')));
const classificar = (p: Programa) => {
  const texto = norm(`${p.nome} ${p.orgao_superior} ${p.acao_orcamentaria}`);
  return temas.filter((t) => t.palavras_chave.some((k) => texto.includes(norm(k)))).map((t) => t.id);
};
const saida = elegiveis
  .map((p) => ({
    codigo: p.codigo, nome: p.nome, orgao_superior: p.orgao_superior, modalidade: p.modalidade, acao_orcamentaria: p.acao_orcamentaria,
    disponibilizado_em: p.disponibilizado_em, prazos: p.prazos, publico: [...p.naturezas], ufs: [...p.ufs].sort(), temas: classificar(p),
  }))
  .sort((a, b) => (a.prazos.proposta_ate ?? a.prazos.emendas_ate ?? '9999').localeCompare(b.prazos.proposta_ate ?? b.prazos.emendas_ate ?? '9999'));

await mkdir('data/core', { recursive: true });
await writeFile(
  `data/core/programas-abertos-${config.codigo_ibge}.json`,
  JSON.stringify(
    {
      proveniencia: {
        fonte: 'Transferegov — arquivo aberto siconv_programa.zip (Discricionárias e Legais)',
        url_origem: `${BASE}/siconv_programa.zip`,
        data_referencia: modificado,
        data_coleta: hoje.toISOString(),
        id_carga: `programas-abertos-${hojeIso}`,
      },
      criterio: 'situação DISPONIBILIZADO, com algum prazo (proposta, emendas ou beneficiário específico) igual ou posterior à data da coleta, aberto a "Administração Pública Municipal" na UF do município (ou sem UF). Classificação por tema = correspondência de palavras-chave de data/config/temas.json (rascunho, a validar).',
      municipio: { codigo_ibge: config.codigo_ibge, uf: ibgeMun.uf },
      resumo: { linhas_lidas: lidas, programas_abertos_no_pais: abertos.length, programas_elegiveis_ao_municipio: saida.length, sem_tema_classificado: saida.filter((p) => p.temas.length === 0).length },
      programas: saida,
    },
    null,
    1,
  ) + '\n',
);
console.log(`linhas ${lidas}; programas com prazo aberto no país: ${abertos.length}; elegíveis a ${ibgeMun.nome}/${ibgeMun.uf}: ${saida.length}; sem tema: ${saida.filter((p) => p.temas.length === 0).length}`);
const porTema: Record<string, number> = {};
for (const p of saida) for (const t of p.temas) porTema[t] = (porTema[t] ?? 0) + 1;
console.log('por tema:', JSON.stringify(porTema));
