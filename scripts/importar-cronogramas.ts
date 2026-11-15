// Importador dos Cronogramas detalhados (GovNexa, Fase 2): lê a planilha do GEPP (uma aba por projeto) e grava
// cronogramas.json, cronogramas-importacao.json e cronogramas-conciliacao.md. O console mostra só contagens.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ExcelJS from 'exceljs';
import { municipioAtivo } from '../src/lib/municipio-ativo.ts';
import type { Carteira } from '../src/lib/carteira/tipos.ts';
import type { Cronograma, Cronogramas, EtapaCronograma, FaseCronograma, StatusEtapa } from '../src/lib/cronograma/tipos.ts';
import { bruto, dataIso, extrairSei, jaccard, normCab, numero, palavras, semAcento, texto } from './lib/normalizar.ts';

const slug = (s: string) =>
  semAcento(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ehCopia = (nome: string) => /^(copia de|sugestao)/.test(normCab(nome));

function localizarCabecalho(ws: ExcelJS.Worksheet): { linha: number; colNome: number } | null {
  for (let r = 1; r <= 10; r++) {
    let achou = 0;
    ws.getRow(r).eachCell({ includeEmpty: false }, (c, i) => {
      if (!achou && normCab(bruto(c.value)) === 'nome do marco') achou = i;
    });
    if (achou) return { linha: r, colNome: achou };
  }
  return null;
}

const limparUnidade = (u: string): string | null => u.replace(/\*/g, '').replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ').trim() || null;

function separarResponsavel(t: string | null): { responsavel: string | null; unidade: string | null } {
  if (!t) return { responsavel: null, unidade: null };
  const i = t.lastIndexOf(' - ');
  if (i >= 0) return { responsavel: t.slice(0, i).trim() || null, unidade: limparUnidade(t.slice(i + 3)) };
  if (t.includes('/') || (t === t.toUpperCase() && t !== t.toLowerCase())) return { responsavel: null, unidade: limparUnidade(t) };
  return { responsavel: t, unidade: null };
}

function calcularStatus(e: Pick<EtapaCronograma, 'inicio_previsto' | 'fim_previsto' | 'inicio_real' | 'fim_real'>, hoje: string): StatusEtapa {
  if (e.fim_real) return 'concluida';
  if (e.inicio_real && e.fim_previsto && hoje > e.fim_previsto) return 'atrasada';
  if (e.inicio_real) return 'em_andamento';
  if (e.inicio_previsto && hoje > e.inicio_previsto) return 'inicio_atrasado';
  return 'a_fazer';
}

const SITUACOES = ['nao iniciado', 'concluido', 'em andamento', 'atrasado', 'paralisado', 'cancelado'];
const situacaoReconhecida = (sit: string | null) => !!sit && SITUACOES.includes(normCab(sit));

/** Status calculados considerados equivalentes à situação digitada na planilha (null = situação sem equivalência avaliada). */
function equivalentes(sit: string | null): StatusEtapa[] | null {
  if (!sit) return null;
  const n = normCab(sit);
  if (n.includes('conclu')) return ['concluida'];
  if (n.includes('atras')) return ['atrasada', 'inicio_atrasado'];
  if (n.includes('andamento')) return ['em_andamento', 'atrasada'];
  if (n.includes('nao iniciado')) return ['a_fazer', 'inicio_atrasado'];
  return null;
}

const LEGENDA = ['orientacao de cores', 'orientacao para o lancamento', 'secretaria secap precisa verificar', 'obs:'];

const RE_CICLO = /(\d+)\s*[ªa°º]\s*(entrega|valida|dilig|protocolo|revis)/i;

export interface RelatorioCronogramas {
  gerado_em: string;
  arquivo: string;
  hash: string;
  anonimizado?: boolean;
  abas: { lidas: number; ignoradas: { aba: string; motivo: string }[] };
  cronogramas: number;
  etapas: number;
  fases: number;
  casamento: { sei: number; nome: number; sem_par: number };
  por_status: Record<string, number>;
  pendencias_por_tipo: Record<string, number>;
  fases_vazias_descartadas: number;
  linhas_legenda_ignoradas: number;
  responsaveis_so_unidade: number;
}

export async function importarCronogramas(op: { planilha: string; saida: string; carteira?: string; anonimizar?: boolean; agora?: Date }): Promise<{ cronogramas: Cronogramas; relatorio: RelatorioCronogramas }> {
  const buf = readFileSync(op.planilha);
  const hash = createHash('sha256').update(buf).digest('hex');
  const agoraD = op.agora ?? new Date();
  const agora = agoraD.toISOString();
  const hoje = agora.slice(0, 10);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(op.planilha);

  const caminhoCarteira = op.carteira ?? join(op.saida, 'carteira.json');
  const projetos = existsSync(caminhoCarteira) ? (JSON.parse(readFileSync(caminhoCarteira, 'utf8')) as Carteira).projetos : [];
  const palavrasProjeto = projetos.map((p) => ({ p, w: palavras(p.nome) }));

  const ignoradas: { aba: string; motivo: string }[] = [];
  const lista: Cronograma[] = [];
  const ids = new Set<string>();
  let lidas = 0;
  let fasesVazias = 0;
  let soUnidade = 0;
  let legendaIgnoradas = 0;

  for (const ws of wb.worksheets) {
    if (ehCopia(ws.name)) {
      ignoradas.push({ aba: ws.name, motivo: 'cópia ou modelo' });
      continue;
    }
    const cab = localizarCabecalho(ws);
    if (!cab) {
      ignoradas.push({ aba: ws.name, motivo: 'sem cabeçalho NOME DO MARCO' });
      continue;
    }
    lidas++;
    const mapa = new Map<string, number>();
    ws.getRow(cab.linha).eachCell({ includeEmpty: false }, (c, i) => {
      const k = normCab(bruto(c.value));
      if (k && !mapa.has(k)) mapa.set(k, i);
    });
    const col = (nome: string): number | null => {
      const n = normCab(nome);
      const exato = mapa.get(n);
      if (exato !== undefined) return exato;
      for (const [k, i] of mapa) if (k.startsWith(n)) return i;
      return null;
    };
    const cResp = col('ÁREA - RESPONSÁVEIS');
    const cSit = col('SITUAÇÃO');
    const cDur = col('DURAÇÃO (DIAS) PREVISTO');
    const cIP = col('DATA INÍCIO PREVISTO');
    const cFP = col('DATA TÉRMINO PREVISTO');
    const cIR = col('DATA INÍCIO REALIZADO');
    const cFR = col('DATA TÉRMINO REALIZADO');
    const val = (row: ExcelJS.Row, c: number | null) => (c === null ? null : row.getCell(c).value);

    const titulo = texto(ws.getRow(1).getCell(cab.colNome).value) ?? ws.name;
    const endereco = texto(ws.getRow(2).getCell(cab.colNome).value);
    const sei = extrairSei(texto(ws.getRow(3).getCell(cab.colNome).value));

    let id = 'C-' + slug(ws.name);
    for (let n = 2; ids.has(id); n++) id = `C-${slug(ws.name)}-${n}`;
    ids.add(id);

    const fases: FaseCronograma[] = [];
    let faseAtual: FaseCronograma | null = null;
    let ordem = 0;
    for (let r = cab.linha + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const celulasTexto = [cab.colNome, cIP, cFP, cIR, cFR].map((c) => (c === null ? null : texto(row.getCell(c).value)));
      if (celulasTexto.some((t) => t !== null && LEGENDA.some((p) => normCab(t).startsWith(p)))) {
        // a partir daqui é a legenda/instruções da aba: conta as linhas com conteúdo e para
        for (let x = r; x <= ws.rowCount; x++) {
          let tem = false;
          ws.getRow(x).eachCell({ includeEmpty: false }, (c) => {
            const b = bruto(c.value);
            if (b !== null && String(b).trim() !== '') tem = true;
          });
          if (tem) legendaIgnoradas++;
        }
        break;
      }
      const nomeCelula = celulasTexto[0];
      if (nomeCelula && row.getCell(cab.colNome).font?.bold && !texto(val(row, cResp))) {
        // macroetapa: nome em negrito e sem responsável = fase (as datas são o resumo da fase, não uma etapa)
        faseAtual = { nome: nomeCelula.split(' (')[0].replace(/\s+/g, ' ').trim(), ordem: fases.length + 1, etapas: [] };
        fases.push(faseAtual);
        continue;
      }
      const textoLetras = celulasTexto.slice(1).find((t) => t !== null && /[A-Za-zÀ-ÿ]/.test(t)) ?? null;
      if (textoLetras !== null) {
        // célula de data com letras (título de fase em célula mesclada): vira fase, sem pendência de data
        const nomeFase = (nomeCelula ?? textoLetras).split(' (')[0].replace(/\s+/g, ' ').trim();
        if (nomeFase) {
          faseAtual = { nome: nomeFase, ordem: fases.length + 1, etapas: [] };
          fases.push(faseAtual);
        }
        continue;
      }
      const nome = nomeCelula;
      if (!nome) continue;
      const respTxt = texto(val(row, cResp));
      const pend: string[] = [];
      const inicio_previsto = dataIso(val(row, cIP), 'DATA INÍCIO PREVISTO', pend);
      const fim_previsto = dataIso(val(row, cFP), 'DATA TÉRMINO PREVISTO', pend);
      const inicio_real = dataIso(val(row, cIR), 'DATA INÍCIO REALIZADO', pend);
      const fim_real = dataIso(val(row, cFR), 'DATA TÉRMINO REALIZADO', pend);
      const situacao_planilha = texto(val(row, cSit));
      const temData = !!(inicio_previsto || fim_previsto || inicio_real || fim_real);
      if (!respTxt && !temData && !situacaoReconhecida(situacao_planilha)) {
        faseAtual = { nome, ordem: fases.length + 1, etapas: [] };
        fases.push(faseAtual);
        continue;
      }
      if (!respTxt) pend.push('Sem responsável');
      if (!faseAtual) {
        faseAtual = { nome: 'Geral', ordem: fases.length + 1, etapas: [] };
        fases.push(faseAtual);
      }
      const { responsavel, unidade } = separarResponsavel(respTxt);
      if (respTxt && !respTxt.includes(' - ') && unidade && !responsavel) soUnidade++;
      const status = calcularStatus({ inicio_previsto, fim_previsto, inicio_real, fim_real }, hoje);
      if (situacao_planilha && normCab(situacao_planilha).includes('conclu') && !fim_real) pend.push('Concluída na planilha sem data de término real');
      if ((inicio_previsto && fim_previsto && fim_previsto < inicio_previsto) || (inicio_real && fim_real && fim_real < inicio_real)) pend.push('Término antes do início');
      const equiv = equivalentes(situacao_planilha);
      if (equiv && !equiv.includes(status)) pend.push('Situação da planilha diferente da calculada');
      const m = nome.match(RE_CICLO);
      ordem++;
      faseAtual.etapas.push({
        ordem,
        nome,
        fase: faseAtual.nome,
        unidade,
        responsavel,
        situacao_planilha,
        duracao_prevista: numero(val(row, cDur), 'DURAÇÃO (DIAS) PREVISTO', []),
        inicio_previsto,
        fim_previsto,
        inicio_real,
        fim_real,
        status,
        ciclo: m ? Number(m[1]) : null,
        pendencias: [...new Set(pend)],
        origem: { aba: ws.name, linha: r },
      });
    }

    const fasesComEtapas = fases.filter((f) => f.etapas.length > 0);
    fasesVazias += fases.length - fasesComEtapas.length;
    fasesComEtapas.forEach((f, i) => (f.ordem = i + 1));
    fases.length = 0;
    fases.push(...fasesComEtapas);

    // casamento com a carteira
    const pendCron: string[] = [];
    let projeto_id: string | null = null;
    let casamento: 'sei' | 'nome' | null = null;
    const comSei = projetos.filter((p) => p.sei.some((s) => sei.includes(s)));
    if (comSei.length === 1) {
      projeto_id = comSei[0].id;
      casamento = 'sei';
    } else if (projetos.length > 0) {
      const wt = palavras(titulo);
      const pont = palavrasProjeto.map(({ p, w }) => ({ p, j: jaccard(wt, w) })).sort((a, b) => b.j - a.j);
      if (pont[0] && pont[0].j >= 0.4 && pont[0].j - (pont[1]?.j ?? 0) >= 0.1) {
        projeto_id = pont[0].p.id;
        casamento = 'nome';
      }
    }
    if (!projeto_id) pendCron.push('Sem projeto correspondente na carteira');

    lista.push({ id, aba: ws.name, titulo, endereco, sei, projeto_id, casamento, fases, pendencias: pendCron });
  }

  if (op.anonimizar) {
    const nomes = [...new Set(lista.flatMap((c) => c.fases.flatMap((f) => f.etapas.map((e) => e.responsavel))).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const rotulo = new Map(nomes.map((n, i) => [n, `Responsável ${i + 1}`]));
    for (const c of lista) {
      c.endereco = null;
      for (const f of c.fases) for (const e of f.etapas) if (e.responsavel) e.responsavel = rotulo.get(e.responsavel)!;
    }
  }

  const cronogramas: Cronogramas = {
    prefeitura_id: municipioAtivo().codigo_ibge,
    // 'anonimizado' é campo opcional do contrato.
    fonte: { arquivo: basename(op.planilha), hash, importado_em: agora, ficticio: false, ...(op.anonimizar ? { anonimizado: true } : {}) },
    cronogramas: lista,
  };

  const por_status: Record<string, number> = {};
  const pendTipo: Record<string, number> = {};
  let etapas = 0;
  let fasesN = 0;
  const cas = { sei: 0, nome: 0, sem_par: 0 };
  for (const c of lista) {
    if (c.casamento === 'sei') cas.sei++;
    else if (c.casamento === 'nome') cas.nome++;
    else cas.sem_par++;
    for (const p of c.pendencias) pendTipo[p] = (pendTipo[p] ?? 0) + 1;
    fasesN += c.fases.length;
    for (const f of c.fases)
      for (const e of f.etapas) {
        etapas++;
        por_status[e.status] = (por_status[e.status] ?? 0) + 1;
        for (const p of e.pendencias) {
          const k = p.replace(/^Data não reconhecida em .*/, 'Data não reconhecida');
          pendTipo[k] = (pendTipo[k] ?? 0) + 1;
        }
      }
  }

  const relatorio: RelatorioCronogramas = {
    gerado_em: agora,
    arquivo: basename(op.planilha),
    hash,
    ...(op.anonimizar ? { anonimizado: true } : {}),
    abas: { lidas, ignoradas },
    cronogramas: lista.length,
    etapas,
    fases: fasesN,
    casamento: cas,
    por_status,
    pendencias_por_tipo: pendTipo,
    fases_vazias_descartadas: fasesVazias,
    linhas_legenda_ignoradas: legendaIgnoradas,
    responsaveis_so_unidade: soUnidade,
  };

  mkdirSync(op.saida, { recursive: true });
  writeFileSync(join(op.saida, 'cronogramas.json'), JSON.stringify(cronogramas, null, 2) + '\n', 'utf8');
  writeFileSync(join(op.saida, 'cronogramas-importacao.json'), JSON.stringify(relatorio, null, 2) + '\n', 'utf8');
  writeFileSync(join(op.saida, 'cronogramas-conciliacao.md'), relatorioMd(relatorio), 'utf8');
  return { cronogramas, relatorio };
}

function relatorioMd(r: RelatorioCronogramas): string {
  const L: string[] = ['# Conciliação da importação dos cronogramas', ''];
  L.push(`- Arquivo: ${r.arquivo}`, `- Impressão digital (SHA-256): ${r.hash}`, `- Gerado em: ${r.gerado_em}`, '');
  L.push('## Abas', '', `- Lidas: ${r.abas.lidas}`, `- Ignoradas: ${r.abas.ignoradas.length}`, '');
  if (r.abas.ignoradas.length) {
    L.push('| Aba | Motivo |', '|---|---|');
    for (const i of r.abas.ignoradas) L.push(`| ${i.aba} | ${i.motivo} |`);
    L.push('');
  }
  L.push('## Totais', '', `- Cronogramas: ${r.cronogramas}`, `- Fases: ${r.fases}`, `- Etapas: ${r.etapas}`, `- Fases vazias descartadas: ${r.fases_vazias_descartadas}`, `- Linhas de legenda ignoradas: ${r.linhas_legenda_ignoradas}`, `- Responsáveis tratados só como unidade: ${r.responsaveis_so_unidade}`, '');
  L.push('## Casamento com a carteira', '', `- Por número SEI: ${r.casamento.sei}`, `- Por nome: ${r.casamento.nome}`, `- Sem par: ${r.casamento.sem_par}`, '');
  L.push('## Etapas por situação calculada', '', '| Situação | Etapas |', '|---|---:|');
  for (const [k, v] of Object.entries(r.por_status).sort()) L.push(`| ${k} | ${v} |`);
  L.push('', '## Pendências por tipo', '', '| Pendência | Ocorrências |', '|---|---:|');
  for (const [k, v] of Object.entries(r.pendencias_por_tipo).sort((a, b) => b[1] - a[1])) L.push(`| ${k} | ${v} |`);
  L.push('');
  return L.join('\n');
}

// ---------- CLI ----------

const executadoDireto = !!process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (executadoDireto) {
  const args = process.argv.slice(2);
  const pega = (nome: string) => {
    const i = args.indexOf(nome);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const planilha = pega('--planilha');
  if (!planilha) {
    console.error('Uso: node scripts/importar-cronogramas.ts --planilha <caminho> [--saida <pasta>] [--carteira <carteira.json>] [--anonimizar]');
    process.exit(1);
  }
  const saida = pega('--saida') ?? join('.govnexa-dados', String(municipioAtivo().codigo_ibge));
  try {
    const { relatorio: r } = await importarCronogramas({ planilha, saida, carteira: pega('--carteira'), anonimizar: args.includes('--anonimizar') });
    console.log(`Importação concluída: ${r.abas.lidas} abas lidas, ${r.abas.ignoradas.length} ignoradas, ${r.cronogramas} cronogramas, ${r.fases} fases, ${r.etapas} etapas, ${r.fases_vazias_descartadas} fases vazias descartadas, ${r.linhas_legenda_ignoradas} linhas de legenda ignoradas, ${r.responsaveis_so_unidade} responsáveis só-unidade.`);
    console.log(`Casamento com a carteira: ${r.casamento.sei} por SEI, ${r.casamento.nome} por nome, ${r.casamento.sem_par} sem par.`);
    console.log(`Etapas por situação: ${Object.entries(r.por_status).map(([k, v]) => `${k}=${v}`).join(', ')}.`);
    console.log(`Arquivos gravados em: ${saida}`);
  } catch (e) {
    console.error(`Falha na importação: ${(e as Error).message}`);
    process.exit(1);
  }
}
