// Análise de um processo lido do SEI: documentos-chave (marcos), etapa sugerida, onde o processo está e há quantos dias.
// A sugestão nunca muda a etapa sozinha: ela vira uma proposta que alguém aprova (mesma regra do Kanban e das pendências).
import type { CodigoMacroetapa } from '../carteira/tipos.ts';
import type { DocumentoSei, ProcessoSei } from './tipos.ts';

export type Confianca = 'alta' | 'media';

export interface Marco {
  id: string;
  rotulo: string; // em português simples, para a tela
  termos: string[]; // começo do "Tipo" do documento, sem acento e em minúsculas
  etapa: CodigoMacroetapa | null; // etapa que o documento indica que o processo já alcançou; null = só alerta
  confianca: Confianca;
  alerta?: boolean;
  excecoes?: string[]; // começos de tipo que parecem o marco mas não são (ex.: 'contrato social' é documento da empresa)
}

/** Ordem do ciclo da Lei 14.133. O termo casa com o COMEÇO do tipo (assim "Anexo Documento de Formalização..." não conta como DFD,
 * e "Minuta de Contrato" não conta como contrato). */
export const MARCOS: Marco[] = [
  { id: 'dfd', rotulo: 'Demanda formalizada (DFD)', termos: ['documento de formalizacao da demanda', 'documento de formalizacao de demanda', 'dfd'], etapa: '02', confianca: 'alta' },
  { id: 'etp', rotulo: 'Estudo técnico preliminar (ETP)', termos: ['estudo tecnico preliminar', 'etp'], etapa: '02', confianca: 'alta' },
  { id: 'tr', rotulo: 'Termo de referência ou projeto básico', termos: ['termo de referencia', 'projeto basico'], etapa: '02', confianca: 'alta' },
  { id: 'risco', rotulo: 'Matriz de risco', termos: ['matriz de risco'], etapa: '02', confianca: 'alta' },
  { id: 'precos', rotulo: 'Pesquisa de preços', termos: ['mapa de precos', 'estimativa de precos', 'pesquisa de precos'], etapa: '02', confianca: 'alta' },
  { id: 'minuta', rotulo: 'Minuta (edital ou contrato)', termos: ['minuta'], etapa: '02', confianca: 'alta' },
  { id: 'juridico', rotulo: 'Parecer jurídico', termos: ['parecer juridico'], etapa: '02', confianca: 'alta' },
  // Edital e contrato também entram em minuta na fase 02 (para o parecer jurídico): sozinhos, pedem conferência.
  { id: 'edital', rotulo: 'Edital', termos: ['edital'], etapa: '03', confianca: 'media' },
  { id: 'aviso', rotulo: 'Aviso de licitação', termos: ['aviso de licitacao', 'aviso de contratacao', 'aviso de edital'], etapa: '03', confianca: 'alta' },
  { id: 'julgamento', rotulo: 'Ata de julgamento', termos: ['ata de julgamento', 'ata da sessao', 'ata de sessao'], etapa: '03', confianca: 'alta' },
  { id: 'homologacao', rotulo: 'Homologação ou adjudicação', termos: ['termo de homologacao', 'homologacao', 'termo de adjudicacao', 'adjudicacao'], etapa: '03', confianca: 'alta' },
  { id: 'contrato', rotulo: 'Contrato assinado', termos: ['termo de contrato', 'extrato de contrato', 'contrato assinado'], etapa: '04', confianca: 'alta' },
  { id: 'contrato-doc', rotulo: 'Contrato', termos: ['contrato'], etapa: '04', confianca: 'media', excecoes: ['contrato social'] },
  { id: 'empenho', rotulo: 'Nota de empenho', termos: ['nota de empenho'], etapa: '04', confianca: 'media' },
  { id: 'os', rotulo: 'Ordem de serviço de início', termos: ['ordem de servico de inicio', 'ordem de inicio'], etapa: '05', confianca: 'alta' },
  { id: 'os-doc', rotulo: 'Ordem de serviço', termos: ['ordem de servico'], etapa: '05', confianca: 'media' },
  { id: 'medicao', rotulo: 'Medição', termos: ['boletim de medicao', 'medicao'], etapa: '05', confianca: 'alta' },
  { id: 'recebimento', rotulo: 'Termo de recebimento', termos: ['termo de recebimento'], etapa: '06', confianca: 'alta' },
  { id: 'paralisacao', rotulo: 'Paralisação da obra', termos: ['termo de paralisacao', 'ordem de servico de paralisacao', 'ordem de paralisacao'], etapa: null, confianca: 'alta', alerta: true },
  { id: 'reinicio', rotulo: 'Reinício da obra', termos: ['termo de reinicio', 'ordem de reinicio', 'ordem de servico de reinicio', 'termo de retomada', 'ordem de retomada', 'ordem de servico de retomada'], etapa: null, confianca: 'alta' },
];

export const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** O termo casa com o começo do tipo e termina numa fronteira de palavra ("contrato 12" sim; "contratacao" não). */
const comecaCom = (tipo: string, termo: string): boolean =>
  tipo.startsWith(termo) && (tipo.length === termo.length || /[^a-z]/.test(tipo[termo.length]));

export function marcoDoDocumento(tipo: string): Marco | null {
  const t = normalizar(tipo);
  let melhor: { m: Marco; tam: number } | null = null;
  for (const m of MARCOS) {
    if (m.excecoes?.some((x) => comecaCom(t, x))) continue;
    for (const termo of m.termos) if (comecaCom(t, termo) && (!melhor || termo.length > melhor.tam)) melhor = { m, tam: termo.length };
  }
  return melhor?.m ?? null;
}

export interface MarcoEncontrado {
  marco: Marco;
  primeiro: DocumentoSei; // primeiro documento desse tipo (mais antigo)
  quantos: number;
}

/** Marcos presentes no processo, na ordem do ciclo. */
export function marcosDoProcesso(p: ProcessoSei): MarcoEncontrado[] {
  const achados = new Map<string, MarcoEncontrado>();
  for (const d of p.documentos) {
    const m = marcoDoDocumento(d.tipo);
    if (!m) continue;
    const a = achados.get(m.id);
    if (!a) achados.set(m.id, { marco: m, primeiro: d, quantos: 1 });
    else {
      a.quantos++;
      if (d.data && (!a.primeiro.data || d.data < a.primeiro.data)) a.primeiro = d;
    }
  }
  return MARCOS.filter((m) => achados.has(m.id)).map((m) => achados.get(m.id)!);
}

export type Sugestao =
  | { tipo: 'sem_marco' }
  | { tipo: 'avancar' | 'igual' | 'atras'; etapa: CodigoMacroetapa; base: MarcoEncontrado; conferir: boolean };

/** Etapa que os documentos indicam, comparada com a etapa atual do projeto.
 * avancar = o SEI mostra que o projeto já passou da etapa registrada (vira proposta para aprovar);
 * atras = a etapa registrada está à frente do que o SEI mostra (não volta sozinho; só avisa). */
export function sugerirEtapa(p: ProcessoSei, atual: CodigoMacroetapa | null): Sugestao {
  const marcos = marcosDoProcesso(p).filter((m) => m.marco.etapa !== null);
  if (!marcos.length) return { tipo: 'sem_marco' };
  // O mais avançado; no empate, o de confiança alta.
  const base = marcos.reduce((a, b) => {
    const ea = a.marco.etapa!, eb = b.marco.etapa!;
    if (eb > ea) return b;
    if (eb === ea && a.marco.confianca === 'media' && b.marco.confianca === 'alta') return b;
    return a;
  });
  const etapa = base.marco.etapa!;
  const conferir = base.marco.confianca === 'media';
  if (atual === null || etapa > atual) return { tipo: 'avancar', etapa, base, conferir };
  return { tipo: etapa === atual ? 'igual' : 'atras', etapa, base, conferir };
}

/** Obra paralisada: há termo de paralisação sem termo de reinício depois dele. */
export function paralisacaoAberta(p: ProcessoSei): DocumentoSei | null {
  let ultimaPar: DocumentoSei | null = null;
  let ultimoReinicio: string | null = null;
  for (const d of p.documentos) {
    const m = marcoDoDocumento(d.tipo);
    if (m?.id === 'paralisacao' && (!ultimaPar || (d.data ?? '') >= (ultimaPar.data ?? ''))) ultimaPar = d;
    if (m?.id === 'reinicio' && (d.data ?? '') > (ultimoReinicio ?? '')) ultimoReinicio = d.data ?? '';
  }
  if (!ultimaPar) return null;
  return ultimoReinicio !== null && ultimoReinicio >= (ultimaPar.data ?? '') ? null : ultimaPar;
}

export interface OndeEsta {
  unidade: string;
  desde: string; // AAAA-MM-DD do primeiro andamento seguido nessa unidade
  dias: number | null; // dias corridos até hoje; null se hoje for anterior (relógio errado)
  ultimo: { dataHora: string; descricao: string };
}

const diasEntre = (de: string, ate: string): number => Math.round((Date.parse(`${ate}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000);

/** Onde o processo está agora (unidade do andamento mais recente) e há quantos dias está nela sem sair. */
export function ondeEsta(p: ProcessoSei, hoje: string): OndeEsta | null {
  const [ultimo] = p.andamentos;
  if (!ultimo) return null;
  let desde = ultimo.dataHora;
  for (const a of p.andamentos) {
    if (a.unidade !== ultimo.unidade) break;
    desde = a.dataHora;
  }
  const dia = desde.slice(0, 10);
  const dias = diasEntre(dia, hoje);
  return { unidade: ultimo.unidade, desde: dia, dias: dias < 0 ? null : dias, ultimo: { dataHora: ultimo.dataHora, descricao: ultimo.descricao } };
}

export interface ResumoSei {
  documentos: number;
  publicos: number;
  restritos: number;
  andamentos: number;
  incompleto: boolean; // a legenda diz mais registros do que a página trouxe
}

export function resumirProcesso(p: ProcessoSei): ResumoSei {
  const publicos = p.documentos.filter((d) => d.publico).length;
  return {
    documentos: p.documentos.length,
    publicos,
    restritos: p.documentos.length - publicos,
    andamentos: p.andamentos.length,
    incompleto: (p.totalDocumentos ?? 0) > p.documentos.length || (p.totalAndamentos ?? 0) > p.andamentos.length,
  };
}
