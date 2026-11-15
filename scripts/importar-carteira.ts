// Importador da Carteira de Projetos: lê a planilha (abas PIPELINE e BASE_OPERACIONAL) e grava
// carteira.json, importacao.json e conciliacao.md. O console mostra só contagens (a planilha tem dados internos).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ExcelJS from 'exceljs';
import { municipioAtivo } from '../src/lib/municipio-ativo.ts';
import { codigoMacroetapa, MACROETAPAS } from '../src/lib/carteira/macroetapas.ts';
import { bruto, dataIso, extrairSei, jaccard, normCab, numero, palavras, simNao, texto } from './lib/normalizar.ts';
import type { Carteira, DadosOperacionais, Projeto, ValoresAno } from '../src/lib/carteira/tipos.ts';
import type { RegistroLog } from '../src/lib/log/tipos.ts';

// ---------- histórico de alterações (log) da importação ----------

/** Campos comparados entre duas cargas: os mesmos editáveis do motor de movimentação, mais a macroetapa. */
const CAMPOS_SIMPLES = [
  'nome', 'orgao', 'responsavel', 'tipo', 'detalhamento', 'sei', 'observacao', 'regiao', 'bairro', 'corredor',
  'origem_valor', 'tem_projeto', 'prioridade', 'tipo_contratacao', 'orgao_contratacao', 'solicitacoes_financeiras',
];
const GRUPOS_COMPARADOS = ['valores', 'recurso', 'datas'] as const;
const lerCampo = (p: Projeto, campo: string): unknown => {
  let atual: any = p;
  for (const parte of campo.split('.')) atual = atual?.[parte];
  return atual === undefined ? null : atual;
};

function diferencas(a: Projeto, b: Projeto): { campo: string; antes: unknown; depois: unknown }[] {
  const campos = [...CAMPOS_SIMPLES];
  for (const g of GRUPOS_COMPARADOS) {
    const chaves = new Set([...Object.keys((a as any)[g] ?? {}), ...Object.keys((b as any)[g] ?? {})]);
    for (const k of chaves) campos.push(`${g}.${k}`);
  }
  campos.push('macroetapa');
  const mudancas: { campo: string; antes: unknown; depois: unknown }[] = [];
  for (const campo of campos) {
    const antes = lerCampo(a, campo);
    const depois = lerCampo(b, campo);
    if (JSON.stringify(antes) !== JSON.stringify(depois)) mudancas.push({ campo, antes, depois });
  }
  return mudancas;
}

/** Registros do log gerados ao comparar a carga anterior com a nova (sem carga anterior, só o registro da carga inicial). */
function registrosDaImportacao(anterior: Carteira | null, nova: Carteira, o: { arquivo: string; autor: string; em: string }): RegistroLog[] {
  const regs: RegistroLog[] = [];
  let n = 0;
  const add = (projeto_id: string, projeto_nome: string | null, r: Partial<RegistroLog> & Pick<RegistroLog, 'tipo'>) => {
    n++;
    regs.push({ id: `${projeto_id === '*' ? 'carga' : projeto_id}-${o.em}-${n}`, projeto_id, projeto_nome, origem: 'importacao', autor: o.autor, em: o.em, ...r });
  };
  let incluidos = 0;
  let alterados = 0;
  let retirados = 0;
  if (anterior) {
    const antes = new Map(anterior.projetos.map((p) => [p.id, p]));
    const agoraIds = new Set(nova.projetos.map((p) => p.id));
    for (const p of nova.projetos) {
      const a = antes.get(p.id);
      if (!a) {
        incluidos++;
        add(p.id, p.nome, { tipo: 'criado', descricao: `Projeto incluído pela planilha: ${p.nome}` });
        continue;
      }
      const dif = diferencas(a, p);
      if (dif.length === 0) continue;
      alterados++;
      if (dif.length === 1 && dif[0].campo === 'macroetapa') {
        add(p.id, p.nome, { tipo: 'mover_macroetapa', de: a.macroetapa, para: p.macroetapa ?? undefined });
      } else {
        add(p.id, p.nome, { tipo: 'atualizar_campos', campos: dif });
      }
    }
    for (const a of anterior.projetos) {
      if (agoraIds.has(a.id)) continue;
      retirados++;
      add(a.id, a.nome, { tipo: 'removido', descricao: `Projeto retirado da planilha: ${a.nome}` });
    }
  }
  const resumo = anterior ? `${incluidos} incluídos, ${alterados} alterados, ${retirados} retirados` : 'carga inicial';
  add('*', null, { tipo: 'carga', descricao: `Carga da planilha ${o.arquivo}: ${nova.projetos.length} projetos (${resumo})` });
  return regs;
}

// ---------- normalizações ----------


// ---------- leitura da aba ----------

class Aba {
  nome: string;
  ws: ExcelJS.Worksheet;
  cab = new Map<string, number>();
  constructor(wb: ExcelJS.Workbook, nome: string, linhaCab: number) {
    const ws = wb.getWorksheet(nome);
    if (!ws) throw new Error(`Aba não encontrada: ${nome}`);
    this.nome = nome;
    this.ws = ws;
    ws.getRow(linhaCab).eachCell({ includeEmpty: false }, (c, i) => {
      const k = normCab(bruto(c.value));
      if (k && !this.cab.has(k)) this.cab.set(k, i);
    });
  }
  /** Índice da coluna pelo cabeçalho (exato; senão pelo início, tolerando a falta do texto entre parênteses). */
  col(nome: string): number | null {
    const n = normCab(nome);
    const exato = this.cab.get(n);
    if (exato !== undefined) return exato;
    const base = normCab(nome.replace(/\(.*\)/s, ''));
    for (const [k, i] of this.cab) if (k === base || k.startsWith(base + ' ') || k.startsWith(base)) return i;
    return null;
  }
  exigir(nomes: string[]) {
    for (const n of nomes) if (this.col(n) === null) throw new Error(`Coluna não encontrada na aba ${this.nome}: ${n}`);
  }
  colComecando(prefixo: string): number | null {
    const p = normCab(prefixo);
    for (const [k, i] of this.cab) if (k.startsWith(p)) return i;
    return null;
  }
  valor(linha: ExcelJS.Row, nome: string): unknown {
    const i = this.col(nome);
    return i === null ? null : linha.getCell(i).value;
  }
}

const ehIdInteiro = (v: unknown): number | null => {
  const b = bruto(v);
  if (typeof b === 'number' && Number.isInteger(b)) return b;
  if (typeof b === 'string' && /^\d+$/.test(b.trim())) return Number(b.trim());
  return null;
};

const linhaTemConteudo = (row: ExcelJS.Row) => {
  let tem = false;
  row.eachCell({ includeEmpty: false }, (c) => {
    const b = bruto(c.value);
    if (b !== null && String(b).trim() !== '') tem = true;
  });
  return tem;
};

const ANOS = ['2026', '2027', '2028'];
const soma = (xs: (number | null)[]) => xs.reduce<number>((a, x) => a + (x ?? 0), 0);

// ---------- PIPELINE ----------

function lerPipeline(aba: Aba) {
  aba.exigir(['ID', 'Orgão', 'Nome do Projeto', 'SEI', 'Macroetapa', 'VALOR TOTAL', 'Valor Estimado Execução Obra']);
  const projetos: Projeto[] = [];
  const ignoradas: { linha: number; motivo: string }[] = [];
  let comConteudo = 0;
  const ultima = aba.ws.rowCount;
  for (let r = 2; r <= ultima; r++) {
    const row = aba.ws.getRow(r);
    if (!linhaTemConteudo(row)) continue;
    comConteudo++;
    const id = ehIdInteiro(aba.valor(row, 'ID'));
    if (id === null) {
      ignoradas.push({ linha: r, motivo: 'linha sem ID (total, anotação ou vazia)' });
      continue;
    }
    const pend: string[] = [];
    const t = (n: string) => texto(aba.valor(row, n));
    const n = (n: string) => numero(aba.valor(row, n), n, pend);
    const d = (n: string) => dataIso(aba.valor(row, n), n, pend);

    let nome = t('Nome do Projeto');
    if (!nome) {
      nome = `Projeto ${id}`;
      pend.push('Sem nome');
    }
    const seiTxt = t('SEI');
    const sei = extrairSei(seiTxt);
    if (seiTxt && sei.length === 0 && /\d/.test(seiTxt)) pend.push('SEI inválido'); // '-', 'não', 'sem' etc. = ausente
    const macroTxt = t('Macroetapa');
    const macroetapa = codigoMacroetapa(macroTxt);
    const regiaoTxt = t('Região');
    const corredorTxt = t('Corredor');

    const por_ano: Record<string, ValoresAno> = {};
    for (const a of ANOS) {
      por_ano[a] = {
        subtotal: n(`Valor Subtotal ${a}`),
        federal: n(`Recursos Federais ${a}.`),
        municipal: n(`Recursos Municipais ${a}`),
        outros: n(`Recursos - Outros ${a}`),
      };
    }

    const p: Projeto = {
      id: `P-${id}`,
      codigo_legado: id,
      nome,
      orgao: t('Orgão'),
      responsavel: t('Responsável Acompanhamento'),
      tipo: t('Tipo de Projeto'),
      detalhamento: t('Detalhamento Tipo de Projeto'),
      sei,
      observacao: t('Observação'),
      macroetapa,
      status_projeto: t('Status do Projeto'),
      regiao: regiaoTxt === '-' ? null : regiaoTxt,
      bairro: t('Bairro'),
      corredor: corredorTxt && normCab(corredorTxt) === 'nao' ? null : corredorTxt,
      origem_valor: t('Origem do Valor'),
      tem_projeto: simNao(aba.valor(row, 'Tem projeto')),
      prioridade: t('Prioridade'),
      tipo_contratacao: t('TIPO DE CONTRATAÇÃO'),
      orgao_contratacao: t('ÓRGÃO DA CONTRATAÇÃO'),
      solicitacoes_financeiras: t('SOLICITAÇÕES FINANCEIRAS'),
      valores: {
        projeto: n('Valor Estimado Execução Projeto'),
        obra: n('Valor Estimado Execução Obra'),
        executado: n('Valor Executado'),
        em_captacao: n('Valor em Captação'),
        captado: n('Valor Captado'),
        contrapartida: n('Contrapartida Obrigatória'),
        custeio_municipio: n('Custeio Municipio'),
        total: n('VALOR TOTAL'),
        com_solicitacao_financeira: n('VALOR COM SOLICITAÇÃO FINANCEIRA'),
      },
      recurso: {
        origem: t('Origem do Recurso'),
        tipo: t('TIPO DO RECURSO'),
        situacao: t('SITUAÇÃO'),
        fonte_programa: t('Fonte / Programa'),
        unidade_financiadora: t('Unidade Financiadora'),
        sugestao_financiar: t('Sugestão de Financiar'),
        termo_compromisso: simNao(aba.valor(row, 'Termo de compromisso')),
        numero_termo: t('Número Termo'),
      },
      datas: {
        inicio: d('Data Início do Projeto (Chegada da demanda na SECAP)'),
        pecas_tecnicas: d('Entrega de Peças Técnicas (Projetos, Especificações e Orçamentos)'),
        planejamento: d('Previsão Planejamento'),
        preparatorio: d('Previsão Preparatório'),
        contratacao: d('Previsão Contratação'),
        mobilizacao: d('Previsão Mobilizaçao'),
        execucao_dias: n('Previsão Execução (DIAS)'),
        encerramento: d('Previsão Encerramento'),
      },
      por_ano,
      atualizacao: { responsavel: t('Responsável pela Atualização'), data: d('Data da última Atualização') },
      operacional: null,
      pendencias: [],
      origem: { aba: aba.nome, linha: r },
    };

    // pendências do projeto (texto exato)
    if (!p.orgao) pend.push('Sem órgão');
    if (!p.regiao) pend.push('Sem região');
    if (!p.macroetapa) pend.push('Sem macroetapa');
    if (!p.valores.obra && !p.valores.total) pend.push('Sem valor de obra');
    if (!p.origem_valor) pend.push('Sem origem do valor');
    const seq = [p.datas.pecas_tecnicas, p.datas.planejamento, p.datas.preparatorio, p.datas.contratacao, p.datas.mobilizacao, p.datas.encerramento].filter((x): x is string => !!x);
    for (let i = 1; i < seq.length; i++) {
      if (seq[i] < seq[i - 1]) {
        pend.push('Datas previstas fora de ordem');
        break;
      }
    }
    const subs = ANOS.map((a) => p.por_ano[a].subtotal).filter((x): x is number => x !== null);
    if (subs.length > 0 && p.valores.total !== null && Math.abs(soma(subs) - p.valores.total) > 1) pend.push('Soma por ano diferente do valor total');
    p.pendencias = [...new Set(pend)];
    projetos.push(p);
  }
  projetos.sort((a, b) => a.codigo_legado - b.codigo_legado);
  return { projetos, ignoradas, comConteudo };
}

// ---------- BASE_OPERACIONAL ----------


const REGIOES = ['Campinas', 'Central', 'Leste', 'Macambira Cascavel', 'Meia Ponte', 'Mendanha', 'Noroeste', 'Norte', 'Oeste', 'Sudeste', 'Sudoeste', 'Sul', 'Várias/Não definido'];
const ANOS_BASE = ['2026', '2027', '2028', '2029'];

function lerBase(aba: Aba, projetos: Projeto[]) {
  aba.exigir(['ID', 'SEI', 'Local']);
  const porSei = new Map<string, Projeto[]>();
  for (const p of projetos) for (const s of p.sei) porSei.set(s, [...(porSei.get(s) ?? []), p]);
  const palavrasProjeto = new Map(projetos.map((p) => [p.id, palavras(p.nome)]));
  const colReuniao = aba.colComecando('Reunião');

  let registros = 0;
  let casadasSei = 0;
  let casadasNome = 0;
  const semPar: { id_base: string; seis: number; motivo: string }[] = [];
  const ultima = aba.ws.rowCount;
  for (let r = 5; r <= ultima; r++) {
    const row = aba.ws.getRow(r);
    const idN = ehIdInteiro(aba.valor(row, 'ID'));
    if (idN === null) continue;
    registros++;
    const idBase = String(idN);
    const seis = extrairSei(texto(aba.valor(row, 'SEI')));
    const candidatos = [...new Set(seis.flatMap((s) => porSei.get(s) ?? []))];
    let alvo: Projeto | null = null;
    let casamento: 'sei' | 'nome' = 'sei';
    if (candidatos.length === 1) {
      alvo = candidatos[0];
    } else {
      const local = texto(aba.valor(row, 'Local'));
      if (!local) {
        semPar.push({ id_base: idBase, seis: seis.length, motivo: candidatos.length > 1 ? 'vários projetos com o mesmo SEI e sem Local para desempatar' : 'sem SEI casável e sem Local' });
        continue;
      }
      const pl = palavras(local);
      const universo = candidatos.length > 1 ? candidatos : projetos;
      const pont = universo.map((p) => ({ p, j: jaccard(pl, palavrasProjeto.get(p.id) ?? new Set()) })).sort((a, b) => b.j - a.j);
      const melhor = pont[0];
      const segundo = pont[1]?.j ?? 0;
      if (melhor && melhor.j >= 0.5 && melhor.j - segundo >= 0.1) {
        alvo = melhor.p;
        casamento = 'nome';
      } else {
        semPar.push({ id_base: idBase, seis: seis.length, motivo: candidatos.length > 1 ? 'vários projetos com o mesmo SEI e nome sem semelhança suficiente' : 'nenhum projeto com SEI em comum e nome sem semelhança suficiente' });
        continue;
      }
    }
    if (alvo.operacional) {
      semPar.push({ id_base: idBase, seis: seis.length, motivo: 'projeto já casado' });
      continue;
    }
    const sem: string[] = [];
    const cron = (prefixo: string) => Object.fromEntries(ANOS_BASE.map((a) => [a, numero(aba.valor(row, `${prefixo} ${a}`), `${prefixo} ${a}`, sem)]));
    const op: DadosOperacionais = {
      id_base: idBase,
      casamento,
      situacao: texto(aba.valor(row, 'Situação')),
      reuniao: colReuniao === null ? null : texto(row.getCell(colReuniao).value),
      providencias: texto(aba.valor(row, 'Providências')),
      previsao_entrega: texto(aba.valor(row, 'Previsão de entrega')),
      ano: texto(aba.valor(row, 'Ano')),
      cronograma_fisico: cron('Cron. Físico'),
      cronograma_financeiro: cron('Cron. Financ.'),
      regioes: Object.fromEntries(REGIOES.map((g) => [g, numero(aba.valor(row, g), g, sem)])),
    };
    alvo.operacional = op;
    if (casamento === 'sei') casadasSei++;
    else casadasNome++;
  }
  return { registros, casadasSei, casadasNome, semPar };
}

// ---------- importação completa ----------

export async function importarCarteira(op: { planilha: string; saida: string; agora?: Date; anonimizar?: boolean; autor?: string }): Promise<{ carteira: Carteira; relatorio: object }> {
  const buf = readFileSync(op.planilha);
  const hash = createHash('sha256').update(buf).digest('hex');
  const agora = (op.agora ?? new Date()).toISOString();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(op.planilha);

  const pipe = lerPipeline(new Aba(wb, 'PIPELINE', 1));
  const base = lerBase(new Aba(wb, 'BASE_OPERACIONAL', 4), pipe.projetos);
  const projetos = pipe.projetos;

  if (op.anonimizar) {
    const nomes = [...new Set(projetos.flatMap((p) => [p.responsavel, p.atualizacao.responsavel]).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const rotulo = new Map(nomes.map((n, i) => [n, `Responsável ${i + 1}`]));
    for (const p of projetos) {
      if (p.responsavel) p.responsavel = rotulo.get(p.responsavel)!;
      if (p.atualizacao.responsavel) p.atualizacao.responsavel = rotulo.get(p.atualizacao.responsavel)!;
      p.observacao = null;
      if (p.operacional) {
        p.operacional.reuniao = null;
        p.operacional.providencias = null;
      }
    }
  }

  const carteira: Carteira = {
    prefeitura_id: municipioAtivo().codigo_ibge,
    // 'anonimizado' é campo opcional extra (tipos.ts não é alterado), por isso o spread.
    fonte: { arquivo: basename(op.planilha), hash, importado_em: agora, ficticio: false, ...(op.anonimizar ? { anonimizado: true } : {}) },
    projetos,
  };

  // totais
  const porMacro: Record<string, { qtd: number; valor: number }> = {};
  const porOrgao: Record<string, { qtd: number; valor: number }> = {};
  const acum = (m: Record<string, { qtd: number; valor: number }>, k: string, v: number | null) => {
    const e = (m[k] ??= { qtd: 0, valor: 0 });
    e.qtd++;
    e.valor += v ?? 0;
  };
  const porAno: Record<string, { subtotal: number; federal: number; municipal: number; outros: number }> = {};
  for (const a of ANOS) porAno[a] = { subtotal: 0, federal: 0, municipal: 0, outros: 0 };
  const pendTipo: Record<string, number> = {};
  for (const p of projetos) {
    acum(porMacro, p.macroetapa ?? 'sem', p.valores.total);
    acum(porOrgao, p.orgao ?? 'sem', p.valores.total);
    for (const a of ANOS) {
      const v = p.por_ano[a];
      porAno[a].subtotal += v.subtotal ?? 0;
      porAno[a].federal += v.federal ?? 0;
      porAno[a].municipal += v.municipal ?? 0;
      porAno[a].outros += v.outros ?? 0;
    }
    for (const t of p.pendencias) pendTipo[t] = (pendTipo[t] ?? 0) + 1;
  }
  const valorTotal = soma(projetos.map((p) => p.valores.total));
  const valorObra = soma(projetos.map((p) => p.valores.obra));

  const ambos = projetos.filter((p) => p.valores.total !== null && ANOS.some((a) => p.por_ano[a].subtotal !== null));
  const somaSub = soma(ambos.flatMap((p) => ANOS.map((a) => p.por_ano[a].subtotal)));
  const somaTot = soma(ambos.map((p) => p.valores.total));
  const fontesDe = (p: Projeto) => soma(ANOS.flatMap((a) => [p.por_ano[a].federal, p.por_ano[a].municipal, p.por_ano[a].outros]));
  const comFonte = projetos.filter((p) => fontesDe(p) > 0);
  const semFonte = projetos.length - comFonte.length;
  const somaFontes = soma(comFonte.map(fontesDe));
  const somaSubGlobal = soma(comFonte.flatMap((p) => ANOS.map((a) => p.por_ano[a].subtotal)));
  const regra = (nome: string, esperado: number, encontrado: number) => {
    const diferenca = encontrado - esperado;
    return { regra: nome, esperado: esperado as number | null, encontrado, diferenca: diferenca as number | null, ok: Math.abs(diferenca) <= 1, informativo: false };
  };
  const conciliacao = [
    regra('Linhas classificadas', pipe.comConteudo, projetos.length + pipe.ignoradas.length),
    regra('Soma por ano = valor total', somaTot, somaSub),
    regra('Fontes por ano = subtotal', somaSubGlobal, somaFontes),
    { regra: 'Projetos sem detalhamento de fonte por ano', esperado: null, encontrado: semFonte, diferenca: null, ok: true, informativo: true },
  ];

  const relatorio = {
    gerado_em: agora,
    arquivo: basename(op.planilha),
    hash,
    ...(op.anonimizar ? { anonimizado: true } : {}),
    abas: {
      PIPELINE: { linhas_com_conteudo: pipe.comConteudo, projetos: projetos.length, ignoradas: pipe.ignoradas },
      BASE_OPERACIONAL: { registros: base.registros, casadas_sei: base.casadasSei, casadas_nome: base.casadasNome, sem_par: base.semPar },
    },
    totais: { valor_total: valorTotal, valor_obra: valorObra, por_macroetapa: porMacro, por_orgao: porOrgao, por_ano: porAno },
    conciliacao,
    pendencias_por_tipo: pendTipo,
  };

  // Histórico: compara com a carteira anterior da pasta de saída (se houver) e ACRESCENTA ao historico.json, sem apagar nada.
  const caminhoAnterior = join(op.saida, 'carteira.json');
  let anterior: Carteira | null = null;
  if (existsSync(caminhoAnterior)) {
    try {
      anterior = JSON.parse(readFileSync(caminhoAnterior, 'utf8')) as Carteira;
      if (!Array.isArray(anterior.projetos)) anterior = null;
    } catch {
      anterior = null;
    }
  }
  const caminhoHistorico = join(op.saida, 'historico.json');
  const historicoAtual: { registros: RegistroLog[] } = existsSync(caminhoHistorico) ? JSON.parse(readFileSync(caminhoHistorico, 'utf8')) : { registros: [] };
  if (!Array.isArray(historicoAtual.registros)) throw new Error('historico.json existente é inválido: corrija ou mova o arquivo antes de importar.');
  const autor = op.anonimizar ? 'Importação da planilha' : (op.autor?.trim() || 'Importação da planilha');
  const novosRegistros = registrosDaImportacao(anterior, carteira, { arquivo: basename(op.planilha), autor, em: agora });

  mkdirSync(op.saida, { recursive: true });
  writeFileSync(caminhoHistorico, JSON.stringify({ ...historicoAtual, registros: [...historicoAtual.registros, ...novosRegistros] }, null, 2) + '\n', 'utf8');
  writeFileSync(join(op.saida, 'carteira.json'), JSON.stringify(carteira, null, 2) + '\n', 'utf8');
  writeFileSync(join(op.saida, 'importacao.json'), JSON.stringify(relatorio, null, 2) + '\n', 'utf8');
  writeFileSync(join(op.saida, 'conciliacao.md'), relatorioMd(relatorio), 'utf8');
  return { carteira, relatorio };
}

// ---------- conciliacao.md ----------

type Relatorio = ReturnType<typeof montarTipo>;
function montarTipo() {
  return null as unknown as {
    gerado_em: string;
    arquivo: string;
    hash: string;
    abas: {
      PIPELINE: { linhas_com_conteudo: number; projetos: number; ignoradas: { linha: number; motivo: string }[] };
      BASE_OPERACIONAL: { registros: number; casadas_sei: number; casadas_nome: number; sem_par: { id_base: string; seis: number; motivo: string }[] };
    };
    totais: {
      valor_total: number;
      valor_obra: number;
      por_macroetapa: Record<string, { qtd: number; valor: number }>;
      por_orgao: Record<string, { qtd: number; valor: number }>;
      por_ano: Record<string, { subtotal: number; federal: number; municipal: number; outros: number }>;
    };
    conciliacao: { regra: string; esperado: number | null; encontrado: number; diferenca: number | null; ok: boolean; informativo?: boolean }[];
    pendencias_por_tipo: Record<string, number>;
  };
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomeMacro = (c: string) => (c === 'sem' ? 'Sem macroetapa' : (MACROETAPAS.find((m) => m.codigo === c)?.rotulo ?? c));

function relatorioMd(rel: object): string {
  const r = rel as Relatorio;
  const L: string[] = [];
  L.push('# Conciliação da importação da carteira', '');
  L.push(`- Arquivo: ${r.arquivo}`, `- Impressão digital (SHA-256): ${r.hash}`, `- Gerado em: ${r.gerado_em}`, '');
  L.push('## Conferências', '', '| Regra | Esperado | Encontrado | Diferença | Resultado |', '|---|---:|---:|---:|---|');
  for (const c of r.conciliacao) L.push(`| ${c.regra} | ${c.esperado ?? '-'} | ${c.encontrado} | ${c.diferenca ?? '-'} | ${c.informativo ? 'Informativo' : c.ok ? 'Confere' : 'DIVERGE'} |`);
  L.push('', 'A conferência "Fontes por ano = subtotal" considera só os projetos que detalham a fonte (federal, municipal, outros) por ano; nos demais a planilha não detalha a fonte por ano.');
  L.push('', '## Aba PIPELINE', '', `- Linhas com conteúdo: ${r.abas.PIPELINE.linhas_com_conteudo}`, `- Projetos importados: ${r.abas.PIPELINE.projetos}`, `- Linhas ignoradas: ${r.abas.PIPELINE.ignoradas.length}`, '');
  if (r.abas.PIPELINE.ignoradas.length) {
    L.push('| Linha | Motivo |', '|---:|---|');
    for (const i of r.abas.PIPELINE.ignoradas) L.push(`| ${i.linha} | ${i.motivo} |`);
    L.push('');
  }
  const b = r.abas.BASE_OPERACIONAL;
  L.push('## Aba BASE_OPERACIONAL', '', `- Registros: ${b.registros}`, `- Casados pelo número SEI: ${b.casadas_sei}`, `- Casados pelo nome: ${b.casadas_nome}`, `- Sem par: ${b.sem_par.length}`, '');
  if (b.sem_par.length) {
    L.push('| ID na base | Quantidade de SEIs | Motivo |', '|---|---:|---|');
    for (const s of b.sem_par) L.push(`| ${s.id_base} | ${s.seis} | ${s.motivo} |`);
    L.push('');
  }
  L.push('## Totais', '', `- Valor total: ${brl(r.totais.valor_total)}`, `- Valor de obra: ${brl(r.totais.valor_obra)}`, '');
  L.push('### Por macroetapa', '', '| Macroetapa | Projetos | Valor total |', '|---|---:|---:|');
  for (const [k, v] of Object.entries(r.totais.por_macroetapa).sort()) L.push(`| ${nomeMacro(k)} | ${v.qtd} | ${brl(v.valor)} |`);
  L.push('', '### Por órgão', '', '| Órgão | Projetos | Valor total |', '|---|---:|---:|');
  for (const [k, v] of Object.entries(r.totais.por_orgao).sort()) L.push(`| ${k === 'sem' ? 'Sem órgão' : k} | ${v.qtd} | ${brl(v.valor)} |`);
  L.push('', '### Por ano', '', '| Ano | Subtotal | Federal | Municipal | Outros |', '|---|---:|---:|---:|---:|');
  for (const [k, v] of Object.entries(r.totais.por_ano)) L.push(`| ${k} | ${brl(v.subtotal)} | ${brl(v.federal)} | ${brl(v.municipal)} | ${brl(v.outros)} |`);
  L.push('', '## Pendências por tipo', '', '| Pendência | Projetos |', '|---|---:|');
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
    console.error('Uso: node scripts/importar-carteira.ts --planilha <caminho> [--saida <pasta>] [--autor <nome>] [--anonimizar]');
    process.exit(1);
  }
  const saida = pega('--saida') ?? join('.govnexa-dados', String(municipioAtivo().codigo_ibge));
  try {
    const { carteira, relatorio } = await importarCarteira({ planilha, saida, anonimizar: args.includes('--anonimizar'), autor: pega('--autor') });
    const rel = relatorio as Relatorio;
    console.log(`Importação concluída: ${carteira.projetos.length} projetos, ${rel.abas.PIPELINE.ignoradas.length} linhas ignoradas, ${rel.abas.BASE_OPERACIONAL.casadas_sei + rel.abas.BASE_OPERACIONAL.casadas_nome} registros da base casados, ${rel.abas.BASE_OPERACIONAL.sem_par.length} sem par.`);
    console.log(`Arquivos gravados em: ${saida}`);
  } catch (e) {
    console.error(`Falha na importação: ${(e as Error).message}`);
    process.exit(1);
  }
}
