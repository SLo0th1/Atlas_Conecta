// Repositório somente leitura sobre os JSON (MVP). Valida os eventos com o motor, mas não grava.
import { aplicarEvento, criarProjeto } from '../carteira/movimentacao.ts';
import { carregarCarteira } from '../carteira/carga.ts';
import { carregarCronogramas } from '../cronograma/carga.ts';
import { carregarHistorico } from '../log/carga.ts';
import { maisRecentes } from '../log/visoes.ts';
import type { RepositorioProjetos } from './tipos.ts';

export function criarRepositorioJson(): RepositorioProjetos {
  return {
    podeGravar: false,
    async listarProjetos() {
      return carregarCarteira().projetos;
    },
    async obterProjeto(id) {
      return carregarCarteira().projetos.find((p) => p.id === id) ?? null;
    },
    async historico() {
      return [];
    },
    async listarHistorico() {
      return maisRecentes(carregarHistorico().registros);
    },
    async aplicar(e) {
      const p = carregarCarteira().projetos.find((x) => x.id === e.projeto_id);
      if (!p) return { ok: false, erro: 'Projeto não encontrado.' };
      const r = aplicarEvento(p, e);
      if (!r.ok) return r.faltando ? { ok: false, erro: r.erro, faltando: r.faltando } : { ok: false, erro: r.erro };
      return { ok: false, erro: 'Gravação indisponível: o banco de dados ainda não foi configurado.' };
    },
    async criarProjeto(dados, autor) {
      const codigos = carregarCarteira().projetos.map((x) => x.codigo_legado);
      const r = criarProjeto(dados, { autor, em: new Date().toISOString(), proximoCodigo: Math.max(0, ...codigos) + 1, origem: 'ficha' });
      if (!r.ok) return r;
      return { ok: false, erro: 'Gravação indisponível: o banco de dados ainda não foi configurado.' };
    },
    async listarCronogramas() {
      return carregarCronogramas().cronogramas;
    },
  };
}
