-- GovNexa: histórico de alterações (log) do ciclo de vida do projeto (migração 002).
-- NÃO executar em produção sem aprovação do dono. Depende da 001 (tabelas, papel govnexa_app e RLS por prefeitura).
-- evento_projeto (da 001) guarda o que acontece em um projeto; evento_sistema guarda o que não pertence a um projeto
-- (por exemplo, a carga da planilha) e as ações sobre projetos que já não estão na carteira. Ambas são imutáveis.

BEGIN;

CREATE TABLE evento_sistema (
  id            text PRIMARY KEY,
  prefeitura_id integer     NOT NULL,
  tipo          text        NOT NULL,
  origem        text        NOT NULL,
  autor         text        NOT NULL,
  em            timestamptz NOT NULL,
  descricao     text,
  detalhes      jsonb -- projeto_id (quando a ação é sobre um projeto), de, para, campos, motivo, forcado
);
CREATE INDEX evento_sistema_prefeitura_em_idx ON evento_sistema (prefeitura_id, em);
CREATE INDEX evento_projeto_prefeitura_em_idx ON evento_projeto (prefeitura_id, em);

ALTER TABLE evento_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY isolamento_prefeitura ON evento_sistema
  USING (prefeitura_id = current_setting('app.prefeitura_id', true)::int)
  WITH CHECK (prefeitura_id = current_setting('app.prefeitura_id', true)::int);

-- Sem UPDATE nem DELETE: o histórico não se apaga nem se reescreve.
GRANT SELECT, INSERT ON evento_sistema TO govnexa_app;

-- Visão única do log. security_invoker faz a RLS das tabelas valer para quem consulta (sem isso, valeria a do dono da visão).
CREATE VIEW log_alteracoes WITH (security_invoker = true) AS
  SELECT e.id, e.prefeitura_id, e.projeto_id, p.nome AS projeto_nome, e.tipo, e.origem, e.autor, e.em,
         e.de, e.para, e.campos, e.motivo, e.forcado, e.descricao
    FROM evento_projeto e
    LEFT JOIN projeto p ON p.prefeitura_id = e.prefeitura_id AND p.id = e.projeto_id
  UNION ALL
  SELECT s.id, s.prefeitura_id, COALESCE(s.detalhes ->> 'projeto_id', '*') AS projeto_id, NULL::text AS projeto_nome,
         s.tipo, s.origem, s.autor, s.em,
         (s.detalhes ->> 'de')::char(2), (s.detalhes ->> 'para')::char(2), s.detalhes -> 'campos', s.detalhes ->> 'motivo',
         (s.detalhes ->> 'forcado')::boolean, s.descricao
    FROM evento_sistema s;

GRANT SELECT ON log_alteracoes TO govnexa_app;

COMMIT;
