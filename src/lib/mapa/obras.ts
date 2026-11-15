// Dados do mapa das obras: lê a geocodificação por bairro e monta a lista de obras com localização.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { caminhoCarteira } from '../carteira/carga.ts';
import type { Carteira, Projeto } from '../carteira/tipos.ts';
import { farol, fimDaMacroetapaAtual, valorProjeto } from '../carteira/visoes.ts';
import { categoriaObra, espalharSobrepostos, localizarProjeto, situacaoMapa, type GeoBairros, type SituacaoMapa } from './geo.ts';
import type { CategoriaObra, Localizacao, PrecisaoLocal } from './tipos.ts';

export function carregarGeoBairros(): GeoBairros {
  const arquivo = join(dirname(caminhoCarteira()), 'geo-bairros.json');
  if (!existsSync(arquivo)) return { bairros: {} };
  const g = JSON.parse(readFileSync(arquivo, 'utf8')) as GeoBairros;
  return { ...g, bairros: g.bairros ?? {} };
}

export interface ObraBasica {
  id: string;
  nome: string;
  orgao: string | null;
  categoria: CategoriaObra;
  situacao: SituacaoMapa;
  valor: number | null;
  /** Executado ÷ total (0 a 100) só se coerente (mesma regra do painel); senão null. */
  percentual: number | null;
  /** Fim previsto da macroetapa atual (ISO) ou null. */
  prazo: string | null;
  farol: { cor: 'verde' | 'amarelo' | 'vermelho'; texto: string };
  foto: string | null;
  bairro: string | null;
}
export interface ObraMapa extends ObraBasica {
  precisao: PrecisaoLocal;
  localizacao: Localizacao;
}

function basica(p: Projeto, hoje: string): ObraBasica {
  const valor = valorProjeto(p);
  const executado = p.valores.executado;
  const f = farol(p, hoje);
  const fotos = p.fotos ?? [];
  const capa = fotos.find((x) => x.capa) ?? fotos[0];
  return {
    id: p.id,
    nome: p.nome,
    orgao: p.orgao,
    categoria: categoriaObra(p),
    situacao: situacaoMapa(p),
    valor,
    percentual: valor !== null && valor > 0 && executado !== null && executado <= valor ? (executado / valor) * 100 : null,
    prazo: fimDaMacroetapaAtual(p),
    farol: { cor: f.cor, texto: f.motivo },
    foto: capa ? capa.url : null,
    bairro: p.bairro,
  };
}

export function obrasDoMapa(carteira: Carteira, geo: GeoBairros, hoje: string): { obras: ObraMapa[]; semLocal: number } {
  const obras: ObraMapa[] = [];
  let semLocal = 0;
  for (const p of carteira.projetos) {
    const loc = localizarProjeto(p, geo);
    if (!loc) { semLocal++; continue; }
    obras.push({ ...basica(p, hoje), precisao: loc.precisao, localizacao: loc.localizacao });
  }
  const pontosBairro = obras
    .filter((o) => o.precisao === 'bairro' && o.localizacao.tipo === 'ponto')
    .map((o) => ({ id: o.id, ponto: (o.localizacao as Extract<Localizacao, { tipo: 'ponto' }>).ponto }));
  const espalhados = espalharSobrepostos(pontosBairro);
  for (const o of obras) {
    const novo = espalhados.get(o.id);
    if (novo && o.localizacao.tipo === 'ponto') o.localizacao = { ...o.localizacao, ponto: novo };
  }
  return { obras, semLocal };
}

/** Dados mínimos dos projetos sem localização (o mapa os mostra se houver localização simulada na sessão). */
export function obrasSemLocal(carteira: Carteira, geo: GeoBairros, hoje: string): ObraBasica[] {
  return carteira.projetos.filter((p) => !localizarProjeto(p, geo)).map((p) => basica(p, hoje));
}
