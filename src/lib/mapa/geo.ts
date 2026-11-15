// Funções puras do mapa das obras: geocodificação por bairro (texto), categoria, situação, validação e posicionamento.
import type { Projeto } from '../carteira/tipos.ts';
import type { CategoriaObra, Localizacao, PontoGeo, PrecisaoLocal } from './tipos.ts';

export const GOIANIA = {
  centro: { lat: -16.6869, lng: -49.2648 },
  caixa: { latMin: -16.85, latMax: -16.45, lngMin: -49.5, lngMax: -49.05 },
} as const;

export interface GeoBairro { busca: string; lat?: number; lng?: number; encontrado: boolean }
export interface GeoBairros { gerado_em?: string; fonte?: string; bairros: Record<string, GeoBairro> }

const ABREVIACOES: Record<string, string> = {
  bro: 'Bairro', s: 'Setor', st: 'Setor', jd: 'Jardim', res: 'Residencial', vl: 'Vila', pq: 'Parque',
  cj: 'Conjunto', conj: 'Conjunto', lot: 'Loteamento', chac: 'Chácaras', cond: 'Condomínio',
  prq: 'Parque', sir: 'Sítio de Recreio', vlg: 'Village', cjr: 'Conjunto Residencial', con: 'Condomínio', esp: 'Esplanada', faz: 'Fazenda',
};

/** Nome do bairro sem o tipo do começo ("Bairro Santa Genoveva" → "Santa Genoveva"); null se não houver tipo conhecido. */
export function semTipoDeBairro(expandido: string): string | null {
  const tipos = [...new Set(Object.values(ABREVIACOES))].sort((a, b) => b.length - a.length);
  const t = tipos.find((x) => expandido.toLowerCase().startsWith(x.toLowerCase() + ' '));
  const resto = t ? expandido.slice(t.length).trim() : '';
  return resto ? resto : null;
}

/** Expande abreviações de bairro da planilha ("S Oeste" → "Setor Oeste"); só tokens no início ou isolados, sem diferenciar maiúscula. */
export function expandirBairro(t: string): string {
  return t
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const chave = tok.replace(/\.$/, '').toLowerCase();
      return Object.hasOwn(ABREVIACOES, chave) ? ABREVIACOES[chave] : tok;
    })
    .join(' ');
}

export const dentroDeGoiania = (p: PontoGeo): boolean =>
  Number.isFinite(p?.lat) && Number.isFinite(p?.lng) &&
  p.lat >= GOIANIA.caixa.latMin && p.lat <= GOIANIA.caixa.latMax && p.lng >= GOIANIA.caixa.lngMin && p.lng <= GOIANIA.caixa.lngMax;

const MAX_TRECHOS = 20;
const MAX_PONTOS = 200;
const ehNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const ehPonto = (v: unknown): v is PontoGeo => !!v && typeof v === 'object' && ehNumero((v as PontoGeo).lat) && ehNumero((v as PontoGeo).lng);

/** Erros em português simples; lista vazia = localização válida. */
export function validarLocalizacao(l: unknown): string[] {
  const erros: string[] = [];
  if (!l || typeof l !== 'object') return ['Localização inválida.'];
  const loc = l as Record<string, unknown>;
  if (loc.tipo === 'ponto') {
    if (!ehPonto(loc.ponto)) erros.push('O ponto precisa de latitude e longitude numéricas.');
    else if (!dentroDeGoiania(loc.ponto)) erros.push('O ponto está fora de Goiânia.');
    return erros;
  }
  if (loc.tipo === 'trechos') {
    const trechos = loc.trechos;
    if (!Array.isArray(trechos) || trechos.length === 0) return ['Inclua ao menos um trecho de rua.'];
    if (trechos.length > MAX_TRECHOS) erros.push(`No máximo ${MAX_TRECHOS} trechos por obra.`);
    trechos.slice(0, MAX_TRECHOS).forEach((t, i) => {
      const n = i + 1;
      const rua = (t as { rua?: unknown })?.rua;
      if (typeof rua !== 'string' || !rua.trim()) erros.push(`Trecho ${n}: informe o nome da rua.`);
      const linha = (t as { linha?: unknown })?.linha;
      if (!Array.isArray(linha) || linha.length < 2) {
        erros.push(`Trecho ${n}: desenhe ao menos 2 pontos no mapa.`);
        return;
      }
      if (linha.length > MAX_PONTOS) erros.push(`Trecho ${n}: no máximo ${MAX_PONTOS} pontos.`);
      if (!linha.every(ehPonto)) erros.push(`Trecho ${n}: há ponto sem latitude e longitude numéricas.`);
      else if (!linha.every(dentroDeGoiania)) erros.push(`Trecho ${n}: há ponto fora de Goiânia.`);
    });
    return erros;
  }
  return ['Tipo de localização inválido (use ponto ou trechos).'];
}

const semAcento = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
const contem = (nome: string, termos: string[]): boolean => termos.some((t) => nome.includes(t));
/** Siglas curtas só casam como palavra inteira (evita "UBS" dentro de "SUBSOLO"). */
const siglaNoNome = (nome: string, siglas: string[]): boolean => siglas.some((s) => new RegExp(`(^|[^A-Z0-9])${s}([^A-Z0-9]|$)`).test(nome));

export const ROTULO_CATEGORIA: Record<CategoriaObra, string> = {
  saude: 'Saúde',
  educacao: 'Educação',
  assistencia: 'Assistência social',
  via: 'Ruas e pavimentação',
  ponte: 'Pontes e viadutos',
  drenagem: 'Drenagem',
  lazer: 'Parques e lazer',
  cultura: 'Cultura',
  edificacao: 'Outras edificações',
};

/** Primeira regra que casar, na ordem da ordem de serviço. */
export function categoriaObra(p: Projeto): CategoriaObra {
  const nome = semAcento(p.nome ?? '');
  const det = semAcento(p.detalhamento ?? '');
  const org = semAcento(p.orgao ?? '');
  if (det === 'OAE' || contem(nome, ['PONTE', 'VIADUTO', 'TRINCHEIRA'])) return 'ponte';
  if (['CORREDOR', 'RECAPEAMENTO', 'BAIRRO', 'CALCADA', 'SINALIZACAO', 'CANAL / VIA'].includes(det) || contem(nome, ['PAVIMENTA', 'RECAPE', 'ASFALT', 'CORREDOR'])) return 'via';
  if (['ALAGAMENTO', 'CANAL', 'CONTENCAO'].includes(det) || contem(nome, ['DRENAGEM', 'GALERIA'])) return 'drenagem';
  if (org === 'SMS' || siglaNoNome(nome, ['UBS', 'UPA', 'CAIS']) || contem(nome, ['HOSPITAL', 'SAUDE', 'MATERNIDADE'])) return 'saude';
  if (org === 'SME' || siglaNoNome(nome, ['CMEI']) || contem(nome, ['ESCOLA', 'EDUCACAO'])) return 'educacao';
  if (org === 'SEMASDH' || siglaNoNome(nome, ['CRAS', 'CREAS']) || contem(nome, ['ACOLHIMENTO'])) return 'assistencia';
  if (['PARQUE', 'PRACA', 'QUADRA', 'CLUBE', 'CENTRO ESPORTIVO', 'MIRANTE'].includes(det) || org === 'SEMEL' || org === 'AMMA') return 'lazer';
  if (org === 'SECULT' || det === 'MONUMENTO') return 'cultura';
  return 'edificacao';
}

export type SituacaoMapa = 'execucao' | 'mobilizacao' | 'contratacao' | 'planejamento' | 'concluida' | 'sem';
export const ROTULO_SITUACAO_MAPA: Record<SituacaoMapa, string> = {
  execucao: 'Em execução',
  mobilizacao: 'Mobilização',
  contratacao: 'Em contratação',
  planejamento: 'Planejamento',
  concluida: 'Concluída',
  sem: 'Sem etapa',
};
export function situacaoMapa(p: Pick<Projeto, 'macroetapa'>): SituacaoMapa {
  switch (p.macroetapa) {
    case '05': return 'execucao';
    case '04': return 'mobilizacao';
    case '02': case '03': return 'contratacao';
    case '00': case '01': return 'planejamento';
    case '06': return 'concluida';
    default: return 'sem';
  }
}

/** Ordem: simulada válida > cadastrada válida > centro do bairro (geocodificado) > nada. */
export function localizarProjeto(p: Projeto, geoBairros: GeoBairros, simulada?: Localizacao | null): { localizacao: Localizacao; precisao: PrecisaoLocal } | null {
  if (simulada && validarLocalizacao(simulada).length === 0) return { localizacao: simulada, precisao: 'cadastrada' };
  if (p.localizacao && validarLocalizacao(p.localizacao).length === 0) return { localizacao: p.localizacao, precisao: 'cadastrada' };
  const g = p.bairro ? geoBairros.bairros[p.bairro.trim()] : undefined;
  if (g && g.encontrado === true && ehNumero(g.lat) && ehNumero(g.lng)) {
    return { localizacao: { tipo: 'ponto', ponto: { lat: g.lat, lng: g.lng }, endereco: null }, precisao: 'bairro' };
  }
  return null;
}

/** Itens com o mesmo ponto (5 casas) ficam em espiral determinística (ordem por id); o primeiro fica no ponto original. */
export function espalharSobrepostos(itens: { id: string; ponto: PontoGeo }[]): Map<string, PontoGeo> {
  const grupos = new Map<string, { id: string; ponto: PontoGeo }[]>();
  for (const it of itens) {
    const k = `${it.ponto.lat.toFixed(5)},${it.ponto.lng.toFixed(5)}`;
    const g = grupos.get(k);
    if (g) g.push(it);
    else grupos.set(k, [it]);
  }
  const saida = new Map<string, PontoGeo>();
  for (const g of grupos.values()) {
    g.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    g.forEach((it, i) => {
      if (i === 0) saida.set(it.id, { ...it.ponto });
      else {
        const r = 0.0006 * Math.sqrt(i);
        const a = i * 2.4;
        saida.set(it.id, { lat: it.ponto.lat + r * Math.sin(a), lng: it.ponto.lng + r * Math.cos(a) });
      }
    });
  }
  return saida;
}
