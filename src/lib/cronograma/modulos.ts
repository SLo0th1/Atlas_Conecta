// Guia "Cronogramas" no mesmo formato dos demais módulos (colunas, linhas, ficha e busca).
import { br } from '../dados/formato.ts';
import type { Detalhe } from '../dados/detalhes.ts';
import type { Modulo } from '../dados/tipos.ts';
import { carregarCarteira } from '../carteira/carga.ts';
import { carregarCronogramas } from './carga.ts';
import type { Cronograma } from './tipos.ts';
import { diasEntre, etapasDoCronograma, resumoCronograma, rotuloRitmo, statusNaData } from './visoes.ts';

const pct = (n: number): string => `${Math.round(n)}%`;
export const hojeIso = (): string => new Date().toISOString().slice(0, 10);

function detalheCronograma(c: Cronograma, hoje: string): Detalhe {
  const r = resumoCronograma(c, hoje);
  const projeto = c.projeto_id ? carregarCarteira().projetos.find((p) => p.id === c.projeto_id) : undefined;
  const atrasadas = etapasDoCronograma(c)
    .filter((e) => ['atrasada', 'inicio_atrasado'].includes(statusNaData(e, hoje)))
    .map((e) => {
      const ref = e.fim_previsto && e.fim_previsto < hoje ? e.fim_previsto : e.inicio_previsto;
      const dias = ref ? diasEntre(ref, hoje) : 0;
      return `${e.nome} · ${e.unidade ?? 'Sem unidade'} · ${dias} dia${dias === 1 ? '' : 's'} de atraso`;
    });
  return {
    titulo: c.titulo,
    secoes: [
      {
        titulo: 'Resumo',
        itens: [
          `Fase atual: ${r.faseAtual}`,
          `Realizado: ${pct(r.realizadoPct)} · Previsto até hoje: ${pct(r.previstoPct)} · Ritmo: ${rotuloRitmo(r.ritmo)}`,
          `Etapas concluídas: ${r.concluidas} de ${r.etapas}`,
          `Vencem nos próximos 7 dias: ${r.proximos7}`,
          `Entrega prevista: ${br(r.entregaPrevista)}`,
        ],
      },
      { titulo: 'Projeto da carteira', itens: [projeto ? `${projeto.id} · ${projeto.nome}` : 'Sem correspondência na carteira'] },
      { titulo: 'Etapas atrasadas', itens: atrasadas.length ? atrasadas : ['Nenhuma'] },
    ],
    links: [{ rotulo: 'Abrir a página do cronograma', url: `/plataforma/cronograma/${c.id}/` }],
  };
}

function montarCronogramas(): Modulo {
  const cr = carregarCronogramas();
  const hoje = hojeIso();
  const carteira = carregarCarteira();
  const lista = cr.cronogramas;
  return {
    slug: 'projetos-cronogramas',
    title: 'Cronogramas',
    group: 'Projetos',
    columns: ['Projeto', 'Fase atual', 'Realizado', 'Previsto', 'Ritmo', 'Atrasadas', 'Entrega'],
    rows: lista.map((c) => {
      const r = resumoCronograma(c, hoje);
      return [c.titulo, r.faseAtual, pct(r.realizadoPct), pct(r.previstoPct), rotuloRitmo(r.ritmo), r.atrasadas, br(r.entregaPrevista)];
    }),
    detalhes: lista.map((c) => detalheCronograma(c, hoje)),
    busca: lista.map((c) => [c.titulo, c.endereco, c.sei.join(' '), carteira.projetos.find((p) => p.id === c.projeto_id)?.nome].filter(Boolean).join(' ')),
    fields: [],
    source: 'govnexa-cronogramas',
    ficticio: cr.fonte.ficticio,
    fonte: cr.fonte.ficticio ? 'Dados fictícios de exemplo (os cronogramas reais entram pelo repositório privado).' : `Planilha ${cr.fonte.arquivo}, importada em ${br(cr.fonte.importado_em)}.`,
  };
}

/** Troca o item 'projetos-cronogramas' do catálogo pelo módulo completo montado a partir dos Cronogramas. */
export function comCronogramas<T extends { slug: string }>(lista: T[]): T[] {
  return lista.map((m) => (m.slug === 'projetos-cronogramas' ? (montarCronogramas() as unknown as T) : m));
}
