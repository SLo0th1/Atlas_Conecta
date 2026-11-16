// Obras que ficam FORA do mapa (sem localização cadastrada válida e sem centro de bairro encontrado), para a equipe cadastrar.
import type { Carteira } from '../carteira/tipos.ts';
import { localizarProjeto, type GeoBairros } from './geo.ts';

export interface ProjetoPendente { id: string; nome: string; orgao: string | null }
export interface ObrasSemLocalizacao {
  bairroNaoEncontrado: { bairro: string; projetos: ProjetoPendente[] }[];
  semBairro: ProjetoPendente[];
}

const porNome = (a: ProjetoPendente, b: ProjetoPendente): number => a.nome.localeCompare(b.nome, 'pt-BR') || a.id.localeCompare(b.id);

export function obrasSemLocalizacao(carteira: Carteira, geo: GeoBairros): ObrasSemLocalizacao {
  const grupos = new Map<string, ProjetoPendente[]>();
  const semBairro: ProjetoPendente[] = [];
  for (const p of carteira.projetos) {
    if (localizarProjeto(p, geo)) continue;
    const item = { id: p.id, nome: p.nome, orgao: p.orgao };
    const bairro = p.bairro?.trim();
    if (!bairro) { semBairro.push(item); continue; }
    grupos.set(bairro, [...(grupos.get(bairro) ?? []), item]);
  }
  return {
    bairroNaoEncontrado: [...grupos.entries()]
      .map(([bairro, projetos]) => ({ bairro, projetos: projetos.sort(porNome) }))
      .sort((a, b) => a.bairro.localeCompare(b.bairro, 'pt-BR')),
    semBairro: semBairro.sort(porNome),
  };
}
