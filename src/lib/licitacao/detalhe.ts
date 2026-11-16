// Licitação em detalhe, montada com as datas reais dos documentos do processo no SEI.
// Fases da Lei 14.133: interna (planejamento) e externa (do edital publicado ao início da obra).
// Cada fase usa a data do PRIMEIRO documento-chave dela. Fase sem documento não é inventada: fica "sem documento".
import { marcosDoProcesso, ondeEsta, paralisacaoAberta, resumirProcesso, type MarcoEncontrado, type OndeEsta, type ResumoSei } from '../sei/analise.ts';
import type { ProcessoSei } from '../sei/tipos.ts';
import { validarPiso } from '../prazos/lei14133.ts';

export type Bloco = 'interna' | 'externa';
export interface DefFase {
  id: string;
  rotulo: string;
  bloco: Bloco;
  marcos: string[]; // ids de MARCOS (src/lib/sei/analise.ts), em ordem de preferência para a data
  opcional?: boolean; // nem toda licitação tem (ex.: matriz de risco)
}

export const FASES: DefFase[] = [
  { id: 'demanda', rotulo: 'Demanda formalizada (DFD)', bloco: 'interna', marcos: ['dfd'] },
  { id: 'etp', rotulo: 'Estudo técnico preliminar (ETP)', bloco: 'interna', marcos: ['etp'] },
  { id: 'tr', rotulo: 'Termo de referência ou projeto básico', bloco: 'interna', marcos: ['tr'] },
  { id: 'precos', rotulo: 'Pesquisa de preços', bloco: 'interna', marcos: ['precos'] },
  { id: 'risco', rotulo: 'Matriz de risco', bloco: 'interna', marcos: ['risco'], opcional: true },
  { id: 'minuta', rotulo: 'Minuta do edital ou do contrato', bloco: 'interna', marcos: ['minuta'] },
  { id: 'juridico', rotulo: 'Parecer jurídico', bloco: 'interna', marcos: ['juridico'] },
  { id: 'publicacao', rotulo: 'Edital publicado', bloco: 'externa', marcos: ['aviso', 'edital'] },
  { id: 'julgamento', rotulo: 'Julgamento', bloco: 'externa', marcos: ['julgamento'] },
  { id: 'homologacao', rotulo: 'Homologação', bloco: 'externa', marcos: ['homologacao'] },
  { id: 'contrato', rotulo: 'Contrato', bloco: 'externa', marcos: ['contrato', 'contrato-doc'] },
  { id: 'os', rotulo: 'Ordem de serviço (início)', bloco: 'externa', marcos: ['os', 'os-doc'] },
];

export type SituacaoFase = 'feita' | 'sem_documento' | 'atual' | 'pendente';

export interface Fase {
  def: DefFase;
  situacao: SituacaoFase;
  data: string | null; // AAAA-MM-DD do documento que marca a fase
  documento: string | null; // tipo do documento usado
  conferir: boolean; // a data veio de um documento de confiança média
  publico: boolean | null; // o documento é público (conteúdo legível) ou restrito (PDF)
  diasDesdeAnterior: number | null; // dias corridos desde a fase feita anterior
}

export interface ChecagemPrazo {
  id: string;
  rotulo: string;
  situacao: 'ok' | 'alerta' | 'sem_dado';
  texto: string;
}

export interface DetalheLicitacao {
  numero: string | null;
  tipo: string | null;
  geradoEm: string | null;
  fases: Fase[];
  faseAtual: Fase | null;
  duracao: { interna: number | null; externa: number | null; total: number | null; totalAteHoje: boolean; conferir: boolean };
  prazos: ChecagemPrazo[];
  onde: OndeEsta | null;
  paralisacao: string | null; // data do termo de paralisação aberto
  resumo: ResumoSei;
}

/** Tipos de objeto para o prazo mínimo de publicidade (art. 55). Obras comuns é o padrão das obras da carteira. */
export const PISOS_PUBLICIDADE: { id: string; rotulo: string }[] = [
  { id: 'publicidade_servicos_comuns_obras_comuns', rotulo: 'Obras e serviços comuns (10 dias úteis)' },
  { id: 'publicidade_servicos_especiais_obras_especiais', rotulo: 'Obras e serviços especiais (25 dias úteis)' },
  { id: 'publicidade_bens_menor_preco', rotulo: 'Bens, menor preço (8 dias úteis)' },
  { id: 'publicidade_tecnica_e_preco', rotulo: 'Técnica e preço (35 dias úteis)' },
  { id: 'publicidade_semi_integrada', rotulo: 'Contratação semi-integrada (35 dias úteis)' },
  { id: 'publicidade_integrada', rotulo: 'Contratação integrada (60 dias úteis)' },
];

const dias = (de: string, ate: string): number => Math.round((Date.parse(`${ate}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000);
/** Duração só quando faz sentido: data inválida ou ordem invertida (documento fora de ordem, relógio errado) = null. */
const duracaoEntre = (de: string | null, ate: string | null): number | null => {
  if (!de || !ate) return null;
  const n = dias(de, ate);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function dataDaFase(def: DefFase, marcos: Map<string, MarcoEncontrado>): { data: string; m: MarcoEncontrado } | null {
  // Preferência: o primeiro marco da lista que tenha data (ex.: aviso antes de edital, que pode ser minuta).
  for (const id of def.marcos) {
    const m = marcos.get(id);
    if (m?.primeiro.data) return { data: m.primeiro.data, m };
  }
  return null;
}

export function montarLicitacao(p: ProcessoSei, hoje: string, municipio: number, pisoId = PISOS_PUBLICIDADE[0].id): DetalheLicitacao {
  const marcos = new Map(marcosDoProcesso(p).map((m) => [m.marco.id, m]));
  const brutas = FASES.map((def) => ({ def, achado: dataDaFase(def, marcos) }));
  const ultimaFeita = brutas.reduce((acc, f, i) => (f.achado ? i : acc), -1);
  // Fase atual = a primeira obrigatória depois da última com documento (-1 = todas feitas).
  const idxAtual = FASES.findIndex((f, j) => j > ultimaFeita && !f.opcional);
  let anterior: string | null = null;
  const fases: Fase[] = brutas.map(({ def, achado }, i) => {
    const situacao: SituacaoFase = achado ? 'feita' : i < ultimaFeita ? 'sem_documento' : i === idxAtual ? 'atual' : 'pendente';
    const data = achado?.data ?? null;
    const f: Fase = {
      def,
      situacao,
      data,
      documento: achado?.m.primeiro.tipo ?? null,
      conferir: achado?.m.marco.confianca === 'media',
      publico: achado ? achado.m.primeiro.publico : null,
      // Conta a partir da data mais recente até aqui; peça feita em paralelo (data anterior) fica sem contagem.
      diasDesdeAnterior: data && anterior && data >= anterior ? duracaoEntre(anterior, data) : null,
    };
    if (data && (!anterior || data > anterior)) anterior = data;
    return f;
  });

  const d = (id: string) => fases.find((f) => f.def.id === id)?.data ?? null;
  const inicio = d('demanda') ?? fases.find((f) => f.def.bloco === 'interna' && f.data)?.data ?? null;
  const publicacao = d('publicacao');
  const contrato = d('contrato');
  const totalAteHoje = !contrato;
  const duracao = {
    interna: duracaoEntre(inicio, publicacao),
    externa: duracaoEntre(publicacao, contrato),
    total: duracaoEntre(inicio, contrato ?? hoje),
    totalAteHoje,
    // contrato vindo de documento genérico ("Contrato...", pode ser aditivo): a duração também pede conferência
    conferir: !!contrato && !!fases.find((f) => f.def.id === 'contrato')?.conferir,
  };

  const prazos: ChecagemPrazo[] = [];
  const julgamento = d('julgamento');
  const piso = PISOS_PUBLICIDADE.find((x) => x.id === pisoId) ?? PISOS_PUBLICIDADE[0];
  if (publicacao && julgamento) {
    const v = validarPiso(piso.id, publicacao, julgamento, municipio);
    prazos.push({
      id: 'publicidade',
      rotulo: `Prazo mínimo de publicidade — ${piso.rotulo}`,
      situacao: v.ok ? 'ok' : 'alerta',
      texto: `${v.texto} Conta da publicação do edital até a ata de julgamento (aproximação da abertura das propostas).`,
    });
  } else
    prazos.push({ id: 'publicidade', rotulo: `Prazo mínimo de publicidade — ${piso.rotulo}`, situacao: 'sem_dado', texto: 'Precisa da data do edital publicado e da ata de julgamento.' });
  prazos.push({
    id: 'pncp',
    rotulo: 'Contrato publicado no PNCP (até 20 dias úteis)',
    situacao: 'sem_dado',
    texto: contrato ? 'Falta a data de publicação no PNCP (entra com a integração do PNCP).' : 'Ainda sem contrato.',
  });

  return {
    numero: p.numero,
    tipo: p.tipo,
    geradoEm: p.geradoEm,
    fases,
    faseAtual: fases.find((f) => f.situacao === 'atual') ?? null,
    duracao,
    prazos,
    onde: ondeEsta(p, hoje),
    paralisacao: paralisacaoAberta(p)?.data ?? null,
    resumo: resumirProcesso(p),
  };
}

/** Só os dígitos do número do processo, para casar "26.9.000000446-9" com a carteira. */
export const digitosProcesso = (n: string | null | undefined): string => String(n ?? '').replace(/\D/g, '');
