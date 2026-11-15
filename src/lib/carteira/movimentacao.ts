// Motor de regras da movimentação de projetos (GovNexa, Fase 2). Funções puras: nunca mutam a entrada.
// Todo caminho (Kanban, ficha, pendência, SEI, importação) passa por aqui e gera histórico.
import type { CodigoMacroetapa, Projeto } from './tipos.ts';

export type OrigemEvento = 'kanban' | 'ficha' | 'pendencia' | 'sei' | 'importacao';

interface EventoBase {
  projeto_id: string;
  origem: OrigemEvento;
  autor: string;
  em: string; // ISO
  motivo?: string;
}
export type Evento =
  | (EventoBase & { tipo: 'mover_macroetapa'; para: CodigoMacroetapa; forcar?: boolean })
  | (EventoBase & { tipo: 'registrar_passo'; descricao: string; data: string })
  | (EventoBase & { tipo: 'resolver_pendencia'; pendencia: string; decisao: 'aprovada' | 'reprovada' })
  | (EventoBase & { tipo: 'atualizar_campos'; campos: Record<string, unknown> });

export interface RegistroHistorico {
  id: string; // `${projeto_id}-${em}-${n}`
  projeto_id: string;
  tipo: 'mover_macroetapa' | 'passo' | 'pendencia' | 'atualizar_campos' | 'criado';
  origem: OrigemEvento;
  autor: string;
  em: string;
  de?: CodigoMacroetapa | null;
  para?: CodigoMacroetapa;
  campos?: { campo: string; antes: unknown; depois: unknown }[];
  motivo?: string;
  forcado?: boolean;
  descricao?: string;
}

export type ResultadoMovimentacao =
  | { ok: true; projeto: Projeto; historico: RegistroHistorico[] }
  | { ok: false; erro: string; faltando?: string[] };

const ORDEM: CodigoMacroetapa[] = ['00', '01', '02', '03', '04', '05', '06'];
const vazio = (v: unknown): boolean => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

/** O que falta para o projeto entrar na macroetapa `para` (lista vazia = pode). */
export function portaoPara(p: Projeto, para: CodigoMacroetapa): string[] {
  const f: string[] = [];
  switch (para) {
    case '01':
      if (vazio(p.nome)) f.push('Nome do projeto');
      if (vazio(p.orgao)) f.push('Órgão');
      break;
    case '02':
      if (p.valores?.obra == null && p.valores?.total == null) f.push('Valor da obra');
      if (vazio(p.origem_valor)) f.push('Origem do valor');
      if (vazio(p.datas?.pecas_tecnicas)) f.push('Data de entrega das peças técnicas');
      break;
    case '03':
      if (p.tem_projeto !== true) f.push('Projeto elaborado (tem projeto = sim)');
      if (vazio(p.recurso?.origem)) f.push('Origem do recurso');
      if (String(p.recurso?.origem ?? '').trim().toLowerCase() === 'federal' && p.recurso?.termo_compromisso !== true) {
        f.push('Termo de compromisso do recurso federal');
      }
      break;
    case '04':
      if (vazio(p.tipo_contratacao)) f.push('Tipo de contratação');
      if (vazio(p.datas?.contratacao)) f.push('Data prevista de contratação');
      break;
    case '05':
      if (vazio(p.datas?.mobilizacao)) f.push('Data prevista de mobilização');
      break;
    case '06':
      if (p.valores?.executado == null) f.push('Valor executado');
      break;
    default:
      break;
  }
  return f;
}

const CAMPOS_SIMPLES = new Set([
  'nome', 'orgao', 'responsavel', 'tipo', 'detalhamento', 'sei', 'observacao', 'regiao', 'bairro', 'corredor',
  'origem_valor', 'tem_projeto', 'prioridade', 'tipo_contratacao', 'orgao_contratacao', 'solicitacoes_financeiras',
]);
const GRUPOS = new Set(['valores', 'recurso', 'datas']);
const PERIGOSOS = new Set(['__proto__', 'constructor', 'prototype']);

function campoPermitido(campo: string): boolean {
  if (CAMPOS_SIMPLES.has(campo)) return true;
  const partes = campo.split('.');
  return partes.length === 2 && GRUPOS.has(partes[0]) && partes[1] !== '' && !PERIGOSOS.has(partes[1]);
}
function ler(p: Projeto, campo: string): unknown {
  let atual: any = p;
  for (const parte of campo.split('.')) atual = atual?.[parte];
  return atual === undefined ? null : atual;
}
function gravar(p: Projeto, campo: string, valor: unknown): void {
  const partes = campo.split('.');
  let atual: any = p;
  for (let i = 0; i < partes.length - 1; i++) {
    if (atual[partes[i]] == null || typeof atual[partes[i]] !== 'object') atual[partes[i]] = {};
    atual = atual[partes[i]];
  }
  atual[partes[partes.length - 1]] = valor;
}

function registro(p: Projeto, e: Evento, n: number, r: Partial<RegistroHistorico> & Pick<RegistroHistorico, 'tipo'>): RegistroHistorico {
  const base: RegistroHistorico = { id: `${p.id}-${e.em}-${n}`, projeto_id: p.id, origem: e.origem, autor: e.autor, em: e.em, ...r };
  if (e.motivo && base.motivo === undefined) base.motivo = e.motivo;
  return base;
}

const temMotivo = (e: Evento): boolean => !vazio(e.motivo);

export function aplicarEvento(entrada: Projeto, e: Evento): ResultadoMovimentacao {
  if (entrada.id !== e.projeto_id) return { ok: false, erro: 'Evento de outro projeto.' };
  const p = structuredClone(entrada);

  switch (e.tipo) {
    case 'mover_macroetapa': {
      const atual = p.macroetapa;
      const para = e.para;
      if (!ORDEM.includes(para)) return { ok: false, erro: 'Macroetapa inválida.' };
      if (atual === para) return { ok: false, erro: 'O projeto já está nesta macroetapa.' };
      let forcado = false;
      if (atual === null) {
        if (!temMotivo(e)) return { ok: false, erro: 'Para definir a primeira etapa, informe o motivo.' };
      } else {
        const delta = ORDEM.indexOf(para) - ORDEM.indexOf(atual);
        if (delta < 0) {
          if (!temMotivo(e)) return { ok: false, erro: 'Para voltar de etapa, informe o motivo.' };
        } else if (delta > 1) {
          if (!(e.forcar && temMotivo(e))) return { ok: false, erro: 'Avançar mais de uma etapa exige forçar com motivo.' };
          forcado = true;
        } else {
          const faltando = portaoPara(p, para);
          if (faltando.length > 0) {
            if (!(e.forcar && temMotivo(e))) return { ok: false, erro: 'Faltam requisitos para avançar.', faltando };
            forcado = true;
          }
        }
      }
      p.macroetapa = para;
      const r: Partial<RegistroHistorico> & { tipo: 'mover_macroetapa' } = { tipo: 'mover_macroetapa', de: atual, para };
      if (forcado) r.forcado = true;
      return { ok: true, projeto: p, historico: [registro(p, e, 1, r)] };
    }
    case 'registrar_passo': {
      if (vazio(e.descricao)) return { ok: false, erro: 'Descreva o passo.' };
      if (vazio(e.data)) return { ok: false, erro: 'Informe a data do passo.' };
      p.atualizacao = { ...(p.atualizacao ?? { responsavel: null, data: null }), data: e.data };
      return { ok: true, projeto: p, historico: [registro(p, e, 1, { tipo: 'passo', descricao: e.descricao })] };
    }
    case 'resolver_pendencia': {
      const i = p.pendencias.indexOf(e.pendencia);
      if (i < 0) return { ok: false, erro: 'Pendência não encontrada.' };
      if (e.decisao === 'aprovada') {
        p.pendencias.splice(i, 1);
        return { ok: true, projeto: p, historico: [registro(p, e, 1, { tipo: 'pendencia', descricao: `Pendência aprovada: ${e.pendencia}` })] };
      }
      if (!temMotivo(e)) return { ok: false, erro: 'Para reprovar a pendência, informe o motivo.' };
      const atual = p.macroetapa;
      const r: Partial<RegistroHistorico> & { tipo: 'pendencia' } = { tipo: 'pendencia', descricao: `Pendência reprovada: ${e.pendencia}` };
      if (atual !== null && atual !== '00') {
        const para = ORDEM[ORDEM.indexOf(atual) - 1];
        p.macroetapa = para;
        r.de = atual;
        r.para = para;
      }
      return { ok: true, projeto: p, historico: [registro(p, e, 1, r)] };
    }
    case 'atualizar_campos': {
      const chaves = Object.keys(e.campos ?? {});
      for (const c of chaves) {
        if (c === 'macroetapa') return { ok: false, erro: 'Use a movimentação de etapa para mudar a macroetapa.' };
        if (!campoPermitido(c)) return { ok: false, erro: `Campo não editável: ${c}` };
      }
      const mudancas: { campo: string; antes: unknown; depois: unknown }[] = [];
      for (const c of chaves) {
        const antes = ler(p, c);
        const depois = e.campos[c] === undefined ? null : e.campos[c];
        if (JSON.stringify(antes) === JSON.stringify(depois)) continue;
        mudancas.push({ campo: c, antes, depois });
        gravar(p, c, depois);
      }
      if (mudancas.length === 0) return { ok: false, erro: 'Nenhuma alteração.' };
      if (mudancas.some((m) => m.campo === 'prioridade' || m.campo.startsWith('valores.')) && !temMotivo(e)) {
        return { ok: false, erro: 'Mudança de valor ou prioridade exige motivo.' };
      }
      return { ok: true, projeto: p, historico: [registro(p, e, 1, { tipo: 'atualizar_campos', campos: mudancas })] };
    }
    default:
      return { ok: false, erro: 'Tipo de evento desconhecido.' };
  }
}

/** Aplica os eventos em sequência (simulação e testes). Para no primeiro erro. */
export function aplicarEventos<C extends { projetos: Projeto[] }>(
  carteira: C,
  eventos: Evento[],
): { ok: true; carteira: C; historico: RegistroHistorico[] } | { ok: false; erro: string; faltando?: string[]; indice: number } {
  const nova = structuredClone(carteira);
  const historico: RegistroHistorico[] = [];
  for (let indice = 0; indice < eventos.length; indice++) {
    const e = eventos[indice];
    const pos = nova.projetos.findIndex((p) => p.id === e.projeto_id);
    if (pos < 0) return { ok: false, erro: 'Projeto não encontrado.', indice };
    const r = aplicarEvento(nova.projetos[pos], e);
    if (!r.ok) return { ok: false, erro: r.erro, faltando: r.faltando, indice };
    nova.projetos[pos] = r.projeto;
    for (const h of r.historico) historico.push({ ...h, id: `${h.projeto_id}-${h.em}-${historico.length + 1}` });
  }
  return { ok: true, carteira: nova, historico };
}

export type ResultadoCriacao =
  | { ok: true; projeto: Projeto; historico: RegistroHistorico[] }
  | { ok: false; erro: string; faltando: string[] };

const texto = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
const numero = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const COMPROMISSOS = ['decidido', 'condicionado', 'ideia'];
const CHAVES_VALORES = ['projeto', 'obra', 'executado', 'em_captacao', 'captado', 'contrapartida', 'custeio_municipio', 'total', 'com_solicitacao_financeira'] as const;
const CHAVES_RECURSO = ['origem', 'tipo', 'situacao', 'fonte_programa', 'unidade_financiadora', 'sugestao_financiar', 'numero_termo'] as const;
const CHAVES_DATAS = ['inicio', 'pecas_tecnicas', 'planejamento', 'preparatorio', 'contratacao', 'mobilizacao', 'encerramento'] as const;

/** Cria um projeto novo na macroetapa 00 (função pura). Obrigatórios: nome e órgão; o resto vira null. */
export function criarProjeto(
  dados: Partial<Projeto> & { nome: string; orgao: string },
  ctx: { autor: string; em: string; proximoCodigo: number; origem: OrigemEvento },
): { ok: true; projeto: Projeto; historico: RegistroHistorico[] } | { ok: false; erro: string; faltando: string[] } {
  const nome = texto(dados?.nome);
  const orgao = texto(dados?.orgao);
  const faltando: string[] = [];
  if (!nome) faltando.push('Nome do projeto');
  if (!orgao) faltando.push('Órgão');
  if (faltando.length > 0 || !nome || !orgao) return { ok: false, erro: 'Faltam dados obrigatórios.', faltando };

  const valores: any = {};
  for (const k of CHAVES_VALORES) valores[k] = numero((dados.valores as any)?.[k]);
  const recurso: any = {};
  for (const k of CHAVES_RECURSO) recurso[k] = texto((dados.recurso as any)?.[k]);
  recurso.termo_compromisso = typeof dados.recurso?.termo_compromisso === 'boolean' ? dados.recurso.termo_compromisso : null;
  const datas: any = {};
  for (const k of CHAVES_DATAS) datas[k] = texto((dados.datas as any)?.[k]);
  datas.execucao_dias = numero(dados.datas?.execucao_dias);

  const id = `P-${ctx.proximoCodigo}`;
  const p: Projeto = {
    id,
    codigo_legado: ctx.proximoCodigo,
    nome,
    orgao,
    responsavel: texto(dados.responsavel),
    tipo: texto(dados.tipo),
    detalhamento: texto(dados.detalhamento),
    sei: Array.isArray(dados.sei) ? dados.sei.map(texto).filter((x): x is string => x !== null) : [],
    observacao: texto(dados.observacao),
    macroetapa: '00',
    status_projeto: null,
    regiao: texto(dados.regiao),
    bairro: texto(dados.bairro),
    corredor: null,
    origem_valor: texto(dados.origem_valor),
    tem_projeto: typeof dados.tem_projeto === 'boolean' ? dados.tem_projeto : null,
    prioridade: texto(dados.prioridade),
    compromisso: COMPROMISSOS.includes(dados.compromisso as string) ? dados.compromisso : 'ideia',
    tipo_contratacao: texto(dados.tipo_contratacao),
    orgao_contratacao: texto(dados.orgao_contratacao),
    solicitacoes_financeiras: null,
    valores,
    recurso,
    datas,
    por_ano: {},
    atualizacao: { responsavel: null, data: null },
    operacional: null,
    pendencias: [],
    origem: { aba: 'CADASTRO', linha: 0 },
  };
  if (!p.regiao) p.pendencias.push('Sem região');
  if (p.valores.obra === null) p.pendencias.push('Sem valor de obra');
  if (!p.origem_valor) p.pendencias.push('Sem origem do valor');

  const campos: { campo: string; antes: unknown; depois: unknown }[] = [];
  const add = (campo: string, depois: unknown) => {
    if (depois !== null && depois !== undefined && !(Array.isArray(depois) && depois.length === 0)) campos.push({ campo, antes: null, depois });
  };
  for (const c of ['nome', 'orgao', 'responsavel', 'tipo', 'detalhamento', 'sei', 'observacao', 'regiao', 'bairro', 'origem_valor', 'tem_projeto', 'prioridade', 'compromisso', 'tipo_contratacao', 'orgao_contratacao'] as const) add(c, p[c]);
  for (const k of CHAVES_VALORES) add(`valores.${k}`, p.valores[k]);
  for (const k of [...CHAVES_RECURSO, 'termo_compromisso'] as const) add(`recurso.${k}`, (p.recurso as any)[k]);
  for (const k of [...CHAVES_DATAS, 'execucao_dias'] as const) add(`datas.${k}`, (p.datas as any)[k]);

  const historico: RegistroHistorico[] = [
    { id: `${id}-${ctx.em}-1`, projeto_id: id, tipo: 'criado', origem: ctx.origem, autor: ctx.autor, em: ctx.em, para: '00', descricao: 'Projeto incluído no cadastro', campos },
  ];
  return { ok: true, projeto: p, historico };
}
