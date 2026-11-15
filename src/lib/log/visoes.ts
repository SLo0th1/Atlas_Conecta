// Visões puras do histórico de alterações: filtro, resumo de uma linha e exportação em CSV. Sem acesso a arquivo ou página.
import { nomeMacroetapa } from '../carteira/macroetapas.ts';
import type { CodigoMacroetapa } from '../carteira/tipos.ts';
import { ROTULO_ACAO, ROTULO_ORIGEM, type RegistroLog, type TipoAcaoLog } from './tipos.ts';

export interface FiltroLog {
  de?: string; // AAAA-MM-DD, inclusivo
  ate?: string; // AAAA-MM-DD, inclusivo
  projeto?: string; // ID ou parte do nome
  autor?: string;
  acao?: string; // tipo de ação (ver ROTULO_ACAO)
  origem?: string;
  texto?: string;
  excecoes?: boolean; // somente registros que são exceção
}

const FUSO = 'America/Sao_Paulo';
const semAcento = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const norm = (s: unknown): string => semAcento(String(s ?? '')).toLowerCase().trim();

/** Dia (AAAA-MM-DD) do instante, no horário de Brasília. */
export function diaLocal(em: string): string {
  const d = new Date(em);
  if (Number.isNaN(d.getTime())) return em.slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** dd/mm/aaaa hh:mm no horário de Brasília. */
export function dataHoraBr(em: string): string {
  const d = new Date(em);
  if (Number.isNaN(d.getTime())) return em;
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

/** Tipos equivalentes: o motor grava 'passo' e 'pendencia'; o filtro usa 'registrar_passo' e 'resolver_pendencia'. */
export function acaoCanonica(t: string): string {
  return t === 'passo' ? 'registrar_passo' : t === 'pendencia' ? 'resolver_pendencia' : t;
}
/** Exceção = movimentação forçada ou registro marcado com `excecao`. */
export const ehExcecao = (r: Pick<RegistroLog, 'forcado' | 'excecao'>): boolean => r.forcado === true || !!r.excecao;
/** Tipo e motivo da exceção, para o detalhe. */
export function dadosExcecao(r: RegistroLog): { tipo: string; motivo: string } | null {
  if (r.excecao) return { tipo: r.excecao.tipo, motivo: r.excecao.motivo };
  if (r.forcado) return { tipo: 'movimentação forçada', motivo: r.motivo && r.motivo.trim() ? r.motivo : 'Não informado' };
  return null;
}
export const rotuloAcao = (t: TipoAcaoLog | string): string => ROTULO_ACAO[t as TipoAcaoLog] ?? String(t);
export const rotuloOrigem = (o: string): string => (ROTULO_ORIGEM as Record<string, string>)[o] ?? o;

const ROTULO_CAMPO: Record<string, string> = {
  nome: 'Nome', orgao: 'Órgão', responsavel: 'Responsável', tipo: 'Tipo', detalhamento: 'Detalhamento', sei: 'Processos SEI',
  observacao: 'Observação', regiao: 'Região', bairro: 'Bairro', corredor: 'Corredor', origem_valor: 'Origem do valor',
  tem_projeto: 'Tem projeto', prioridade: 'Prioridade', tipo_contratacao: 'Tipo de contratação', orgao_contratacao: 'Órgão da contratação',
  solicitacoes_financeiras: 'Solicitações financeiras', macroetapa: 'Macroetapa',
  'valores.projeto': 'Valor do projeto', 'valores.obra': 'Valor da obra', 'valores.executado': 'Valor executado',
  'valores.em_captacao': 'Valor em captação', 'valores.captado': 'Valor captado', 'valores.contrapartida': 'Contrapartida',
  'valores.custeio_municipio': 'Custeio do município', 'valores.total': 'Valor total', 'valores.com_solicitacao_financeira': 'Valor com solicitação financeira',
  'recurso.origem': 'Origem do recurso', 'recurso.tipo': 'Tipo do recurso', 'recurso.situacao': 'Situação do recurso',
  'recurso.fonte_programa': 'Programa / fonte', 'recurso.unidade_financiadora': 'Unidade financiadora',
  'recurso.sugestao_financiar': 'Sugestão de financiar', 'recurso.termo_compromisso': 'Termo de compromisso', 'recurso.numero_termo': 'Número do termo',
  'datas.inicio': 'Chegada da demanda', 'datas.pecas_tecnicas': 'Peças técnicas', 'datas.planejamento': 'Fim do planejamento',
  'datas.preparatorio': 'Fim do preparatório', 'datas.contratacao': 'Data de contratação', 'datas.mobilizacao': 'Data de mobilização',
  'datas.execucao_dias': 'Dias de execução', 'datas.encerramento': 'Entrega prevista',
};
export function rotuloCampo(campo: string): string {
  const r = ROTULO_CAMPO[campo];
  if (r) return r;
  const ultimo = campo.split('.').pop() ?? campo;
  const t = ultimo.replaceAll('_', ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Valor legível de um campo (antes ou depois). */
export function valorLegivel(campo: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return 'vazio';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (campo === 'macroetapa') return nomeMacroetapa(v as CodigoMacroetapa);
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'vazio';
  if (typeof v === 'number') return campo.startsWith('valores.') ? `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}` : v.toLocaleString('pt-BR');
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v.slice(8)}/${v.slice(5, 7)}/${v.slice(0, 4)}`;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Texto curto do que mudou, para a coluna "O que mudou". */
export function resumoRegistro(r: RegistroLog): string {
  const etapas = r.de !== undefined || r.para !== undefined ? `${r.de ? nomeMacroetapa(r.de) : 'Sem etapa'} → ${r.para ? nomeMacroetapa(r.para) : 'Sem etapa'}` : '';
  switch (acaoCanonica(r.tipo)) {
    case 'mover_macroetapa':
      return etapas || r.descricao || rotuloAcao(r.tipo);
    case 'atualizar_campos': {
      const cs = r.campos ?? [];
      if (cs.length === 0) return r.descricao ?? rotuloAcao(r.tipo);
      const um = (c: { campo: string; antes: unknown; depois: unknown }) => `${rotuloCampo(c.campo)}: ${valorLegivel(c.campo, c.antes)} → ${valorLegivel(c.campo, c.depois)}`;
      if (cs.length === 1) return um(cs[0]);
      return `${um(cs[0])} (e mais ${cs.length - 1} ${cs.length - 1 === 1 ? 'campo' : 'campos'})`;
    }
    case 'resolver_pendencia':
      return `${r.descricao ?? 'Pendência resolvida'}${etapas ? ` (${etapas})` : ''}`;
    default:
      return r.descricao ?? rotuloAcao(r.tipo);
  }
}

/** Texto de busca de um registro (sem acento, minúsculas): descrição, motivo, campos, nome e o resumo mostrado. */
function textoBusca(r: RegistroLog): string {
  const campos = (r.campos ?? []).map((c) => `${c.campo} ${rotuloCampo(c.campo)} ${valorLegivel(c.campo, c.antes)} ${valorLegivel(c.campo, c.depois)}`).join(' ');
  return norm([r.descricao, r.motivo, campos, r.projeto_nome, resumoRegistro(r)].filter(Boolean).join(' '));
}

export function filtrarLog(regs: RegistroLog[], f: FiltroLog): RegistroLog[] {
  const projeto = norm(f.projeto);
  const texto = norm(f.texto);
  const acao = f.acao ? acaoCanonica(f.acao) : '';
  return regs.filter((r) => {
    const dia = diaLocal(r.em);
    if (f.de && dia < f.de) return false;
    if (f.ate && dia > f.ate) return false;
    if (projeto && !(norm(r.projeto_id).includes(projeto) || norm(r.projeto_nome).includes(projeto))) return false;
    if (f.autor && r.autor !== f.autor) return false;
    if (acao && acaoCanonica(r.tipo) !== acao) return false;
    if (f.origem && r.origem !== f.origem) return false;
    if (f.excecoes && !ehExcecao(r)) return false;
    if (texto && !textoBusca(r).includes(texto)) return false;
    return true;
  });
}

/** Mais recentes primeiro (cópia). */
export const maisRecentes = (regs: RegistroLog[]): RegistroLog[] =>
  [...regs].sort((a, b) => (a.em < b.em ? 1 : a.em > b.em ? -1 : a.id < b.id ? 1 : a.id > b.id ? -1 : 0));

const CABECALHO_CSV = ['Data e hora', 'Projeto (ID)', 'Nome do projeto', 'Ação', 'O que mudou', 'Motivo', 'Por', 'Origem', 'Forçado'];

function celula(v: unknown): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // proteção contra injeção de fórmula em planilhas
  return `"${s.replaceAll('"', '""')}"`;
}

/** CSV com separador ';', todas as células entre aspas (aspas duplicadas) e linhas separadas por CRLF. */
export function paraCsv(regs: RegistroLog[]): string {
  const linhas = [CABECALHO_CSV.map(celula).join(';')];
  for (const r of regs) {
    linhas.push(
      [
        dataHoraBr(r.em), r.projeto_id === '*' ? 'Todos' : r.projeto_id, r.projeto_nome ?? '', rotuloAcao(r.tipo), resumoRegistro(r),
        r.motivo ?? '', r.autor, rotuloOrigem(r.origem), r.forcado ? 'Sim' : 'Não',
      ]
        .map(celula)
        .join(';'),
    );
  }
  return linhas.join('\r\n') + '\r\n';
}
