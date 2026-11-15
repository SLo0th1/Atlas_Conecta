-- GovNexa: carteira de projetos, histórico imutável e cronogramas (migração 001).
-- NÃO executar em produção sem aprovação do dono. Multi-prefeitura: toda tabela tem prefeitura_id e RLS.
-- A aplicação define o município da sessão com: SELECT set_config('app.prefeitura_id', '<IBGE>', true);

BEGIN;

CREATE TABLE prefeitura (
  id   integer PRIMARY KEY, -- código IBGE (é o próprio prefeitura_id)
  nome text    NOT NULL,
  uf   char(2) NOT NULL
);

CREATE TABLE projeto (
  prefeitura_id            integer NOT NULL REFERENCES prefeitura (id),
  id                       text    NOT NULL,
  codigo_legado            integer,
  nome                     text    NOT NULL,
  orgao                    text,
  responsavel              text,
  tipo                     text,
  detalhamento             text,
  sei                      text[]  NOT NULL DEFAULT '{}',
  observacao               text,
  macroetapa               char(2) CHECK (macroetapa IN ('00','01','02','03','04','05','06')),
  status_projeto           text,
  regiao                   text,
  bairro                   text,
  corredor                 text,
  origem_valor             text,
  tem_projeto              boolean,
  prioridade               text,
  tipo_contratacao         text,
  orgao_contratacao        text,
  solicitacoes_financeiras text,
  valores                  jsonb,
  recurso                  jsonb,
  datas                    jsonb,
  por_ano                  jsonb,
  atualizacao              jsonb,
  operacional              jsonb,
  pendencias               text[]  NOT NULL DEFAULT '{}',
  origem                   jsonb,
  criado_em                timestamptz NOT NULL DEFAULT now(),
  atualizado_em            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (prefeitura_id, id)
);
CREATE INDEX projeto_macroetapa_idx ON projeto (prefeitura_id, macroetapa);

CREATE TABLE evento_projeto (
  id            text PRIMARY KEY,
  prefeitura_id integer     NOT NULL,
  projeto_id    text        NOT NULL,
  tipo          text        NOT NULL,
  origem        text        NOT NULL,
  autor         text        NOT NULL,
  em            timestamptz NOT NULL,
  de            char(2),
  para          char(2),
  campos        jsonb,
  motivo        text,
  forcado       boolean,
  descricao     text,
  FOREIGN KEY (prefeitura_id, projeto_id) REFERENCES projeto (prefeitura_id, id)
);
CREATE INDEX evento_projeto_projeto_idx ON evento_projeto (prefeitura_id, projeto_id);

CREATE TABLE cronograma (
  prefeitura_id integer NOT NULL REFERENCES prefeitura (id),
  id            text    NOT NULL,
  aba           text,
  titulo        text,
  endereco      text,
  sei           text[]  NOT NULL DEFAULT '{}',
  projeto_id    text,
  casamento     text,
  pendencias    text[]  NOT NULL DEFAULT '{}',
  PRIMARY KEY (prefeitura_id, id)
);

CREATE TABLE etapa_cronograma (
  prefeitura_id     integer NOT NULL,
  cronograma_id     text    NOT NULL,
  ordem             integer NOT NULL,
  fase              text,
  nome              text    NOT NULL,
  unidade           text,
  responsavel       text,
  situacao_planilha text,
  duracao_prevista  integer,
  inicio_previsto   date,
  fim_previsto      date,
  inicio_real       date,
  fim_real          date,
  status            text,
  ciclo             integer,
  pendencias        text[]  NOT NULL DEFAULT '{}',
  origem            jsonb,
  PRIMARY KEY (prefeitura_id, cronograma_id, ordem),
  FOREIGN KEY (prefeitura_id, cronograma_id) REFERENCES cronograma (prefeitura_id, id)
);

-- Isolamento por prefeitura (RLS). Em prefeitura a chave é o próprio id.
ALTER TABLE prefeitura        ENABLE ROW LEVEL SECURITY;
ALTER TABLE projeto           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_projeto    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cronograma        ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapa_cronograma  ENABLE ROW LEVEL SECURITY;

CREATE POLICY isolamento_prefeitura ON prefeitura
  USING (id = current_setting('app.prefeitura_id', true)::int)
  WITH CHECK (id = current_setting('app.prefeitura_id', true)::int);
CREATE POLICY isolamento_prefeitura ON projeto
  USING (prefeitura_id = current_setting('app.prefeitura_id', true)::int)
  WITH CHECK (prefeitura_id = current_setting('app.prefeitura_id', true)::int);
CREATE POLICY isolamento_prefeitura ON evento_projeto
  USING (prefeitura_id = current_setting('app.prefeitura_id', true)::int)
  WITH CHECK (prefeitura_id = current_setting('app.prefeitura_id', true)::int);
CREATE POLICY isolamento_prefeitura ON cronograma
  USING (prefeitura_id = current_setting('app.prefeitura_id', true)::int)
  WITH CHECK (prefeitura_id = current_setting('app.prefeitura_id', true)::int);
CREATE POLICY isolamento_prefeitura ON etapa_cronograma
  USING (prefeitura_id = current_setting('app.prefeitura_id', true)::int)
  WITH CHECK (prefeitura_id = current_setting('app.prefeitura_id', true)::int);

-- Papel da aplicação: sem login próprio, sem DELETE (histórico imutável; eventos sem UPDATE/DELETE).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'govnexa_app') THEN
    CREATE ROLE govnexa_app NOLOGIN;
  END IF;
END
$$;
GRANT SELECT, INSERT, UPDATE ON prefeitura, projeto, cronograma, etapa_cronograma TO govnexa_app;
GRANT SELECT, INSERT ON evento_projeto TO govnexa_app;

COMMIT;
