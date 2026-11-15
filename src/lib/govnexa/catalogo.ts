// Catálogo de módulos do GovNexa (Fase 0): agrupa as telas existentes por módulo e acrescenta Projetos e Gestão.
export type ModuloId = 'projetos' | 'captacao' | 'licitacoes' | 'gestao' | 'conta';

export const MODULOS: { id: ModuloId; nome: string; descricao: string; ativo: boolean }[] = [
  { id: 'projetos', nome: 'Projetos', descricao: 'Carteira de projetos, cronograma, Kanban e Gantt.', ativo: true },
  { id: 'captacao', nome: 'Captação', descricao: 'Oportunidades, convênios, alertas e parecer de elegibilidade.', ativo: true },
  { id: 'licitacoes', nome: 'Licitações', descricao: 'Operação, planejamento, preços, automação, mercado e cadastros.', ativo: true },
  { id: 'gestao', nome: 'Gestão', descricao: 'Painel do prefeito: foto atual de todos os módulos ativos.', ativo: true },
  { id: 'conta', nome: 'Conta', descricao: 'Relatórios, perfil e configurações.', ativo: true },
];

export const GRUPO_PARA_MODULO: Record<string, ModuloId> = {
  Operação: 'licitacoes',
  Planejamento: 'licitacoes',
  Preços: 'licitacoes',
  Automação: 'licitacoes',
  Mercado: 'licitacoes',
  Cadastros: 'licitacoes',
  Captação: 'captacao',
  Conta: 'conta',
  Projetos: 'projetos',
  Gestão: 'gestao',
};

const textosGestao: Record<string, string> = {
  projetos: 'Carteira por fase, entregas previstas e o que está parado',
  captacao: 'Convênios, saldo a liberar e cláusulas suspensivas a vencer',
  licitacoes: 'Licitações em andamento, colocados e próximos prazos',
};

export const NOVOS_MODULOS = [
  {
    slug: 'projetos',
    title: 'Projetos · Início',
    group: 'Projetos',
    // Conteúdo montado a partir da carteira em src/lib/carteira/modulos.ts (montarInicio).
    columns: [] as string[],
    rows: [] as (string | number)[][],
    fields: [] as string[],
    source: 'govnexa-roteiro',
  },
  {
    slug: 'projetos-carteira',
    title: 'Carteira de projetos',
    group: 'Projetos',
    columns: [] as string[],
    rows: [] as (string | number)[][],
    fields: [] as string[],
    source: 'govnexa-carteira',
  },
  {
    slug: 'projetos-kanban',
    title: 'Kanban por macroetapa',
    group: 'Projetos',
    columns: [] as string[],
    rows: [] as (string | number)[][],
    fields: [] as string[],
    source: 'govnexa-carteira',
  },
  {
    slug: 'projetos-gantt',
    title: 'Gantt geral',
    group: 'Projetos',
    columns: [] as string[],
    rows: [] as (string | number)[][],
    fields: [] as string[],
    source: 'govnexa-carteira',
  },
  {
    slug: 'projetos-orgaos',
    title: 'Visão por órgão',
    group: 'Projetos',
    columns: [] as string[],
    rows: [] as (string | number)[][],
    fields: [] as string[],
    source: 'govnexa-carteira',
  },
  {
    slug: 'gestao',
    title: 'Gestão · Painel',
    group: 'Gestão',
    columns: ['Módulo', 'Situação', 'O que mostrará na Gestão'],
    rows: MODULOS.filter((m) => m.id !== 'gestao' && m.id !== 'conta').map((m) => [m.nome, 'Ativo', textosGestao[m.id]]),
    fields: [] as string[],
    source: 'govnexa-modulos',
  },
];

/** Base seguida dos módulos novos. Cast único: a forma dos novos itens espelha a de modules.json (slug, title, group, columns, rows, fields, source). */
export function catalogoCompleto<T>(base: T[]): T[] {
  return [...base, ...(NOVOS_MODULOS as unknown as T[])];
}

export function menuPorModulo<T extends { group: string }>(lista: T[]) {
  const resultado: { id: ModuloId; nome: string; grupos: { grupo: string; itens: T[] }[] }[] = [];
  for (const mod of MODULOS) {
    if (!mod.ativo) continue;
    const grupos: { grupo: string; itens: T[] }[] = [];
    for (const item of lista) {
      const destino = GRUPO_PARA_MODULO[item.group];
      if (!destino) throw new Error(`Grupo sem módulo: ${item.group}`);
      if (destino !== mod.id) continue;
      let g = grupos.find((x) => x.grupo === item.group);
      if (!g) grupos.push((g = { grupo: item.group, itens: [] }));
      g.itens.push(item);
    }
    if (grupos.length) resultado.push({ id: mod.id, nome: mod.nome, grupos });
  }
  return resultado;
}
