// Mapa de impacto: quais partes do código cada etapa do Fluxo usa.
// Serve para (1) saber quais etapas uma mudança afeta, (2) lembrar de atualizar o Fluxo e (3) escolher os testes a conferir.
// Padrões no estilo glob simples: '**' = qualquer caminho; '*' = qualquer nome dentro da pasta.

/** Partes usadas por TODAS as telas: mudança aqui afeta o sistema inteiro. */
export const TRANSVERSAL = [
  'src/layouts/**', 'src/styles/**', 'src/components/DataTable.astro', 'src/components/Icon.astro',
  'src/lib/govnexa/catalogo.ts', 'src/lib/marca.ts', 'src/lib/municipio-ativo.ts', 'src/pages/plataforma/[...module].astro',
  'middleware.ts', 'api/**', 'lib/**', 'vercel.json', 'astro.config.*', 'package.json',
];

/** Etapa do mapa geral (id de fluxo.ts) → partes do código. */
export const COMPONENTES: Record<string, string[]> = {
  inicio: ['src/lib/carteira/modulos.ts', 'src/lib/carteira/visoes.ts'],
  planilha: ['scripts/importar-carteira.ts', 'scripts/importar-cronogramas.ts', 'scripts/lib/**', 'scripts/baixar-dados.mjs', 'data/carga-real/**', 'src/lib/carteira/carga.ts', 'src/lib/cronograma/carga.ts'],
  cadastro: ['src/components/carteira/NovoProjeto.astro', 'src/lib/carteira/movimentacao.ts', 'src/lib/carteira/tipos.ts', 'src/lib/repositorio/**', 'db/migracoes/**'],
  estruturacao: ['src/lib/carteira/macroetapas.ts', 'src/components/carteira/Kanban.astro', 'src/lib/carteira/modulos.ts'],
  precisaRecurso: ['src/lib/carteira/visoes.ts'],
  fontesFederais: ['coletores/**', 'src/lib/dados/**', '.github/workflows/atualizar-dados*.yml'],
  oportunidade: ['src/lib/dados/captacao.ts', 'src/lib/dados/detalhes.ts', 'src/lib/projetos/**'],
  convenio: ['src/lib/dados/captacao.ts', 'src/lib/dados/detalhes-convenio.ts'],
  clausula: ['src/lib/dados/alertas.ts'],
  planejamento: ['src/lib/cronograma/**', 'src/components/cronograma/**', 'src/pages/plataforma/cronograma/**', 'src/components/carteira/Gantt.astro'],
  portao: ['src/lib/carteira/movimentacao.ts', 'src/lib/carteira/simulacao.ts', 'src/components/carteira/PendenciasEtapa.astro'],
  preparatorio: ['src/lib/carteira/macroetapas.ts', 'src/lib/cronograma/**'],
  juridico: ['src/lib/cronograma/visoes.ts', 'src/components/cronograma/Parado.astro'],
  sei: ['scripts/importar-cronogramas.ts'],
  publicacao: ['src/data/modules.json'],
  pncp: [],
  julgamento: ['src/data/modules.json'],
  habilitado: ['src/data/modules.json'],
  homologacao: ['src/data/modules.json'],
  mobilizacao: ['src/lib/carteira/macroetapas.ts', 'src/components/carteira/Kanban.astro'],
  execucao: ['src/lib/carteira/macroetapas.ts', 'src/components/carteira/Gantt.astro'],
  conclusao: ['src/lib/carteira/macroetapas.ts'],
  fim: ['src/lib/log/**'],
  movimentacao: ['src/lib/carteira/movimentacao.ts', 'src/lib/carteira/simulacao.ts', 'src/components/carteira/Kanban.astro', 'src/components/carteira/PendenciasEtapa.astro'],
  alertas: ['src/lib/dados/alertas.ts', 'src/lib/carteira/visoes.ts'],
  parado: ['src/lib/cronograma/visoes.ts', 'src/components/cronograma/Parado.astro'],
  sala: ['src/lib/sala/**', 'src/components/sala/**', 'src/pages/plataforma/sala-de-guerra/**'],
  painel: ['src/components/carteira/VisaoOrgaos.astro', 'src/lib/govnexa/catalogo.ts'],
  log: ['src/lib/log/**', 'src/components/log/**', 'db/migracoes/002_*'],
};

/** O próprio mapa: mudar estes arquivos é mudar o Fluxo (sem exigir outra atualização). */
export const ARQUIVOS_DO_FLUXO = ['src/lib/govnexa/fluxo.ts', 'src/lib/govnexa/subfluxos.ts', 'src/lib/govnexa/impacto.ts', 'src/components/fluxo/**', 'src/pages/plataforma/fluxo/**'];

const paraRegex = (padrao: string): RegExp =>
  new RegExp('^' + padrao.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$');
export const casa = (arquivo: string, padrao: string): boolean => paraRegex(padrao).test(arquivo.replace(/\\/g, '/'));

/** Para uma lista de arquivos alterados: etapas afetadas, se é transversal, se o Fluxo foi atualizado e o que ficou sem mapa. */
export function etapasAfetadas(arquivos: string[]): { etapas: string[]; transversal: string[]; fluxoAtualizado: boolean; semMapa: string[] } {
  const etapas = new Set<string>();
  const transversal: string[] = [];
  const semMapa: string[] = [];
  let fluxoAtualizado = false;
  for (const a of arquivos) {
    const arq = a.replace(/\\/g, '/');
    if (ARQUIVOS_DO_FLUXO.some((p) => casa(arq, p))) { fluxoAtualizado = true; continue; }
    if (TRANSVERSAL.some((p) => casa(arq, p))) { transversal.push(arq); continue; }
    let achou = false;
    for (const [etapa, padroes] of Object.entries(COMPONENTES)) if (padroes.some((p) => casa(arq, p))) { etapas.add(etapa); achou = true; }
    if (!achou && /^(src|scripts|db|coletores)\//.test(arq)) semMapa.push(arq);
  }
  return { etapas: [...etapas].sort(), transversal, fluxoAtualizado, semMapa };
}
