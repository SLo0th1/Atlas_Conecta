// Repositório PostgreSQL (sem dependência: recebe um cliente com query(sql, params)).
// Regras: todo valor vai por parâmetro ($1, $2...), nunca concatenado no SQL; toda consulta roda numa transação que
// começa com set_config('app.prefeitura_id', ...) para a política de RLS (db/migracoes/001_govnexa_carteira.sql).
import { aplicarEvento, criarProjeto } from '../carteira/movimentacao.ts';
import type { Evento, RegistroHistorico } from '../carteira/movimentacao.ts';
import type { Projeto } from '../carteira/tipos.ts';
import type { Cronograma, EtapaCronograma, FaseCronograma } from '../cronograma/tipos.ts';
import type { RegistroLog } from '../log/tipos.ts';
import type { RepositorioProjetos, ResultadoAplicacao, ResultadoCriacaoProjeto } from './tipos.ts';

export interface ClienteSql {
  query(sql: string, params: unknown[]): Promise<{ rows: any[] }>;
}

const COLUNAS_TEXTO = [
  'nome', 'orgao', 'responsavel', 'tipo', 'detalhamento', 'observacao', 'macroetapa', 'status_projeto', 'regiao', 'bairro',
  'corredor', 'origem_valor', 'tem_projeto', 'prioridade', 'compromisso', 'tipo_contratacao', 'orgao_contratacao', 'solicitacoes_financeiras',
] as const;
const COLUNAS_JSON = ['valores', 'recurso', 'datas', 'por_ano', 'atualizacao', 'operacional', 'origem'] as const;
const COLUNAS_ARRAY = ['sei', 'pendencias'] as const;
const TODAS = ['id', 'codigo_legado', ...COLUNAS_TEXTO, ...COLUNAS_JSON, ...COLUNAS_ARRAY] as const;
const LISTA_COLUNAS = TODAS.join(', ');

function linhaParaProjeto(r: any): Projeto {
  const p: any = {};
  for (const c of TODAS) p[c] = r[c] ?? (c === 'sei' || c === 'pendencias' ? [] : null);
  return p as Projeto;
}
const COLUNAS_LOG = 'id, projeto_id, projeto_nome, tipo, origem, autor, em, de, para, campos, motivo, forcado, descricao';
const iso = (v: unknown): string => (typeof v === 'string' ? v : new Date(v as any).toISOString());
function linhaParaHistorico(r: any): RegistroHistorico {
  const h: any = { id: r.id, projeto_id: r.projeto_id, tipo: r.tipo, origem: r.origem, autor: r.autor, em: iso(r.em) };
  if (r.de != null) h.de = r.de;
  if (r.para != null) h.para = r.para;
  if (r.campos != null) h.campos = r.campos;
  if (r.motivo != null) h.motivo = r.motivo;
  if (r.forcado) h.forcado = true;
  if (r.descricao != null) h.descricao = r.descricao;
  return h as RegistroHistorico;
}
function linhaParaLog(r: any): RegistroLog {
  const h: any = linhaParaHistorico(r);
  if (r.projeto_nome != null) h.projeto_nome = r.projeto_nome;
  return h as RegistroLog;
}

export function criarRepositorioPostgres(cliente: ClienteSql, prefeituraId: number): RepositorioProjetos {
  async function transacao<T>(fn: () => Promise<T>): Promise<T> {
    await cliente.query('BEGIN', []);
    try {
      await cliente.query("SELECT set_config('app.prefeitura_id', $1, true)", [String(prefeituraId)]);
      const r = await fn();
      await cliente.query('COMMIT', []);
      return r;
    } catch (erro) {
      try {
        await cliente.query('ROLLBACK', []);
      } catch {
        /* a falha original é a que importa */
      }
      throw erro;
    }
  }

  return {
    podeGravar: true,
    listarProjetos: () =>
      transacao(async () => {
        const r = await cliente.query(`SELECT ${LISTA_COLUNAS} FROM projeto WHERE prefeitura_id = $1 ORDER BY codigo_legado, id`, [prefeituraId]);
        return r.rows.map(linhaParaProjeto);
      }),
    obterProjeto: (id) =>
      transacao(async () => {
        const r = await cliente.query(`SELECT ${LISTA_COLUNAS} FROM projeto WHERE prefeitura_id = $1 AND id = $2`, [prefeituraId, id]);
        return r.rows[0] ? linhaParaProjeto(r.rows[0]) : null;
      }),
    historico: (projetoId) =>
      transacao(async () => {
        const r = await cliente.query(
          `SELECT ${COLUNAS_LOG} FROM log_alteracoes WHERE prefeitura_id = $1 AND projeto_id = $2 ORDER BY em, id`,
          [prefeituraId, projetoId],
        );
        return r.rows.map(linhaParaHistorico);
      }),
    listarHistorico: () =>
      transacao(async () => {
        // A visão log_alteracoes une evento_projeto e evento_sistema (security_invoker: a RLS vale para quem consulta).
        const r = await cliente.query(`SELECT ${COLUNAS_LOG} FROM log_alteracoes WHERE prefeitura_id = $1 ORDER BY em DESC, id DESC`, [prefeituraId]);
        return r.rows.map(linhaParaLog);
      }),
    listarCronogramas: () =>
      transacao(async () => {
        const c = await cliente.query(
          'SELECT id, aba, titulo, endereco, sei, projeto_id, casamento, pendencias FROM cronograma WHERE prefeitura_id = $1 ORDER BY id',
          [prefeituraId],
        );
        const e = await cliente.query(
          `SELECT cronograma_id, ordem, fase, nome, unidade, responsavel, situacao_planilha, duracao_prevista,
            to_char(inicio_previsto, 'YYYY-MM-DD') AS inicio_previsto, to_char(fim_previsto, 'YYYY-MM-DD') AS fim_previsto,
            to_char(inicio_real, 'YYYY-MM-DD') AS inicio_real, to_char(fim_real, 'YYYY-MM-DD') AS fim_real,
            status, ciclo, pendencias, origem
           FROM etapa_cronograma WHERE prefeitura_id = $1 ORDER BY cronograma_id, ordem`,
          [prefeituraId],
        );
        return c.rows.map((row): Cronograma => {
          const fases: FaseCronograma[] = [];
          for (const x of e.rows.filter((y) => y.cronograma_id === row.id)) {
            let fase = fases.find((f) => f.nome === x.fase);
            if (!fase) {
              fase = { nome: x.fase, ordem: fases.length + 1, etapas: [] };
              fases.push(fase);
            }
            const { cronograma_id: _omitido, ...etapa } = x;
            fase.etapas.push({ ...etapa, pendencias: etapa.pendencias ?? [] } as EtapaCronograma);
          }
          return {
            id: row.id, aba: row.aba, titulo: row.titulo, endereco: row.endereco ?? null, sei: row.sei ?? [],
            projeto_id: row.projeto_id ?? null, casamento: row.casamento ?? null, fases, pendencias: row.pendencias ?? [],
          };
        });
      }),
    async criarProjeto(dados, autor): Promise<ResultadoCriacaoProjeto> {
      return transacao(async (): Promise<ResultadoCriacaoProjeto> => {
        const m = await cliente.query('SELECT coalesce(max(codigo_legado), 0) + 1 AS proximo FROM projeto WHERE prefeitura_id = $1', [prefeituraId]);
        const proximoCodigo = Number(m.rows[0]?.proximo ?? 1);
        const res = criarProjeto(dados, { autor, em: new Date().toISOString(), proximoCodigo, origem: 'ficha' });
        if (!res.ok) return res;
        const p: any = res.projeto;
        // Nomes de coluna vêm de listas fixas no código; valores só por parâmetro.
        const cols: string[] = ['prefeitura_id', 'id', 'codigo_legado'];
        const marcas: string[] = ['$1', '$2', '$3'];
        const params: unknown[] = [prefeituraId, p.id, p.codigo_legado];
        const add = (col: string, valor: unknown, cast = '') => {
          params.push(valor);
          cols.push(col);
          marcas.push(`$${params.length}${cast}`);
        };
        for (const c of COLUNAS_TEXTO) add(c, p[c] ?? null);
        for (const c of COLUNAS_JSON) add(c, p[c] == null ? null : JSON.stringify(p[c]), '::jsonb');
        for (const c of COLUNAS_ARRAY) add(c, p[c] ?? [], '::text[]');
        await cliente.query(`INSERT INTO projeto (${cols.join(', ')}, atualizado_em) VALUES (${marcas.join(', ')}, now())`, params);
        for (const h of res.historico) {
          await cliente.query(
            `INSERT INTO evento_projeto (id, prefeitura_id, projeto_id, tipo, origem, autor, em, de, para, campos, motivo, forcado, descricao)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13)`,
            [h.id, prefeituraId, h.projeto_id, h.tipo, h.origem, h.autor, h.em, h.de ?? null, h.para ?? null,
              h.campos ? JSON.stringify(h.campos) : null, h.motivo ?? null, h.forcado ?? false, h.descricao ?? null],
          );
        }
        return { ok: true, projeto: res.projeto, historico: res.historico };
      });
    },
    async aplicar(e: Evento): Promise<ResultadoAplicacao> {
      return transacao(async (): Promise<ResultadoAplicacao> => {
        const r = await cliente.query(`SELECT ${LISTA_COLUNAS} FROM projeto WHERE prefeitura_id = $1 AND id = $2 FOR UPDATE`, [prefeituraId, e.projeto_id]);
        if (!r.rows[0]) return { ok: false, erro: 'Projeto não encontrado.' };
        const res = aplicarEvento(linhaParaProjeto(r.rows[0]), e);
        if (!res.ok) return res.faltando ? { ok: false, erro: res.erro, faltando: res.faltando } : { ok: false, erro: res.erro };
        const p: any = res.projeto;
        // Nomes de coluna vêm de listas fixas no código; valores só por parâmetro.
        const sets: string[] = [];
        const params: unknown[] = [prefeituraId, p.id];
        const add = (col: string, valor: unknown, cast = '') => {
          params.push(valor);
          sets.push(`${col} = $${params.length}${cast}`);
        };
        for (const c of COLUNAS_TEXTO) add(c, p[c] ?? null);
        for (const c of COLUNAS_JSON) add(c, p[c] == null ? null : JSON.stringify(p[c]), '::jsonb');
        for (const c of COLUNAS_ARRAY) add(c, p[c] ?? [], '::text[]');
        await cliente.query(`UPDATE projeto SET ${sets.join(', ')}, atualizado_em = now() WHERE prefeitura_id = $1 AND id = $2`, params);
        for (const h of res.historico) {
          await cliente.query(
            `INSERT INTO evento_projeto (id, prefeitura_id, projeto_id, tipo, origem, autor, em, de, para, campos, motivo, forcado, descricao)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13)`,
            [h.id, prefeituraId, h.projeto_id, h.tipo, h.origem, h.autor, h.em, h.de ?? null, h.para ?? null,
              h.campos ? JSON.stringify(h.campos) : null, h.motivo ?? null, h.forcado ?? false, h.descricao ?? null],
          );
        }
        return { ok: true, historico: res.historico };
      });
    },
  };
}
