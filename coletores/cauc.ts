// Coletor Fase 1: CAUC (regularidade do município para transferências voluntárias) — CSV aberto do Tesouro Transparente.
// Uso: node coletores/cauc.ts
// Fonte: docs/fontes/cauc.md. Saída: data/core/cauc-<ibge>.json (situação do dia) e cauc-historico-<ibge>.json
// (uma entrada por MUDANÇA de situação de item — base dos alertas "item irregular no CAUC").
// Interpretação das células (metadado oficial): data = validade da comprovação; "!" = não foi possível obter
// a comprovação (pendência); "Desabilitado" = item indisponível para todos os entes.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const CSV_URL =
  'https://www.tesourotransparente.gov.br/ckan/dataset/72b5f371-0c35-4613-8076-c99c821a6410/resource/07af297a-5e59-494a-a88a-55ddfd2f4b01/download/relatorio-situacao-de-varios-entes---municipios---uf-todas---abrangencia-1.csv';
const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const IBGE: number = config.codigo_ibge;
const itens: Record<string, string> = JSON.parse(await readFile('data/config/cauc-itens.json', 'utf8')).itens;

async function baixar(): Promise<{ texto: string; hash: string }> {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const r = await fetch(CSV_URL);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      return { texto: new TextDecoder('latin1').decode(buf), hash: createHash('sha256').update(buf).digest('hex') };
    } catch (e) {
      if (tentativa === 4) throw new Error(`CAUC: ${(e as Error).message}`);
      await new Promise((ok) => setTimeout(ok, 8000 * tentativa)); // a hospedagem do Tesouro é instável
    }
  }
  throw new Error('inalcançável');
}

const { texto, hash } = await baixar();
const linhas = texto.split(/\r?\n/).filter((l) => l.length > 0);
const campos = (l: string) => l.replace(/^"/, '').replace(/"$/, '').split('";"');
const dataPesquisa = linhas[0].match(/(\d{2}\/\d{2}\/\d{4})/)?.[1]; // "Data da Pesquisa: dd/mm/aaaa"
if (!dataPesquisa) throw new Error('Preâmbulo do CSV mudou: "Data da Pesquisa" não encontrada (layout alterado?)');
const iCab = linhas.findIndex((l) => campos(l)[0] === 'UF');
if (iCab < 0) throw new Error('Cabeçalho do CSV não encontrado (layout alterado?)');
const cab = campos(linhas[iCab]);
const iIbge = cab.indexOf('Código IBGE');
const linha = linhas.slice(iCab + 1).map(campos).find((c) => Number(c[iIbge]) === IBGE);
if (!linha) throw new Error(`Município ${IBGE} não encontrado no CAUC`);

const [d, m, a] = dataPesquisa.split('/').map(Number);
const hoje = Date.UTC(a, m - 1, d);
const itensSituacao = Object.keys(itens).map((codigo) => {
  const bruto = (linha[cab.indexOf(codigo)] ?? '').trim();
  let situacao: 'regular' | 'vencido' | 'pendente' | 'indisponivel' | 'sem_informacao' | 'desconhecido';
  let validade: string | null = null;
  if (bruto === '!') situacao = 'pendente';
  else if (/desabilitado/i.test(bruto)) situacao = 'indisponivel';
  else if (/^\d{2}\/\d{2}\/(\d{2}|\d{4})$/.test(bruto)) {
    const [dd, mm, aa0] = bruto.split('/').map(Number);
    const aa = aa0 < 100 ? 2000 + aa0 : aa0; // o CSV usa ano com 2 dígitos (dd/mm/aa)
    validade = `${aa}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    situacao = Date.UTC(aa, mm - 1, dd) >= hoje ? 'regular' : 'vencido';
  } else if (bruto === '') situacao = 'sem_informacao';
  else situacao = 'desconhecido';
  return { item: codigo, descricao: itens[codigo], valor_original: bruto, situacao, validade };
});

const irregulares = itensSituacao.filter((i) => i.situacao === 'pendente' || i.situacao === 'vencido' || i.situacao === 'desconhecido');
const atual = {
  proveniencia: {
    fonte: 'Tesouro Nacional — CAUC (Tesouro Transparente, CSV aberto de municípios)',
    url_origem: CSV_URL,
    data_referencia: dataPesquisa,
    data_coleta: new Date().toISOString(),
    id_carga: `cauc-${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    hash_arquivo: hash,
  },
  municipio: { codigo_ibge: IBGE, nome: linha[cab.indexOf('Nome do Ente Federado')] ?? null },
  situacao_geral: irregulares.length === 0 ? 'regular' : 'com_pendencias',
  itens_com_pendencia: irregulares.map((i) => i.item),
  itens: itensSituacao,
};

// Histórico: registra só mudanças de situação por item.
const histPath = `data/core/cauc-historico-${IBGE}.json`;
const hist: { eventos: any[] } = existsSync(histPath) ? JSON.parse(await readFile(histPath, 'utf8')) : { eventos: [] };
const ultimo = new Map<string, string>();
for (const e of hist.eventos) ultimo.set(e.item, e.situacao_nova);
const novos: any[] = [];
for (const i of itensSituacao) {
  const antes = ultimo.get(i.item) ?? null;
  if (antes !== i.situacao)
    novos.push({ data_referencia: dataPesquisa, item: i.item, situacao_anterior: antes, situacao_nova: i.situacao, validade: i.validade });
}
hist.eventos.push(...novos);

await mkdir('data/core', { recursive: true });
await writeFile(`data/core/cauc-${IBGE}.json`, JSON.stringify(atual, null, 1) + '\n');
await writeFile(histPath, JSON.stringify(hist, null, 1) + '\n');
console.log(`CAUC ${atual.municipio.nome} (${dataPesquisa}): ${atual.situacao_geral}; pendências: ${atual.itens_com_pendencia.join(', ') || 'nenhuma'}`);
console.log(`Mudanças registradas no histórico: ${novos.length}`);
const resumo = itensSituacao.reduce<Record<string, number>>((s, i) => ((s[i.situacao] = (s[i.situacao] ?? 0) + 1), s), {});
console.log('Itens por situação:', JSON.stringify(resumo));
