-- GovNexa: localização das obras (ponto ou trechos de rua) e fotos por projeto (migração 004).
-- NÃO executar em produção sem aprovação do dono. Multi-prefeitura: toda tabela tem prefeitura_id e RLS.
-- A aplicação define o município da sessão com: SELECT set_config('app.prefeitura_id', '<IBGE>', true);

BEGIN;

ALTER TABLE projeto ADD COLUMN IF NOT EXISTS localizacao jsonb
  CHECK (localizacao IS NULL OR localizacao->>'tipo' IN ('ponto','trechos'));

CREATE TABLE IF NOT EXISTS projeto_foto (
  prefeitura_id integer     NOT NULL,
  projeto_id    text        NOT NULL,
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  arquivo_chave text        NOT NULL,           -- chave no armazenamento de arquivos (nunca URL pública fixa)
  tipo_mime     text        NOT NULL CHECK (tipo_mime IN ('image/jpeg','image/png','image/webp')),
  tamanho_bytes integer     NOT NULL CHECK (tamanho_bytes > 0 AND tamanho_bytes <= 10485760),
  legenda       text        CHECK (char_length(legenda) <= 200),
  tirada_em     date,
  capa          boolean     NOT NULL DEFAULT false,
  enviada_por   text        NOT NULL,
  enviada_em    timestamptz NOT NULL DEFAULT now(),
  removida_em   timestamptz,
  PRIMARY KEY (prefeitura_id, id),
  FOREIGN KEY (prefeitura_id, projeto_id) REFERENCES projeto (prefeitura_id, id)
);
CREATE INDEX IF NOT EXISTS projeto_foto_projeto_idx ON projeto_foto (prefeitura_id, projeto_id) WHERE removida_em IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projeto_foto_uma_capa ON projeto_foto (prefeitura_id, projeto_id) WHERE capa AND removida_em IS NULL;

ALTER TABLE projeto_foto ENABLE ROW LEVEL SECURITY;
CREATE POLICY isolamento_prefeitura ON projeto_foto
  USING (prefeitura_id = current_setting('app.prefeitura_id', true)::int)
  WITH CHECK (prefeitura_id = current_setting('app.prefeitura_id', true)::int);
GRANT SELECT, INSERT, UPDATE ON projeto_foto TO govnexa_app;  -- sem DELETE: remoção = removida_em

COMMIT;
