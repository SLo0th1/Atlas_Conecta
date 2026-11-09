-- Esquema PostgreSQL do bloco Captação (RASCUNHO da Fase 0; ainda não aplicado a nenhum banco).
-- Base: Plano Mestre, Parte 4. Toda tabela de dados guarda proveniência (Parte 3.3).
-- Extensões previstas: postgis (mapas) e vector (busca semântica); habilitar na Fase 3/6.
-- Multimunicípio: tudo ligado a municipio.codigo_ibge. Segregação por secretaria via secretaria_id.

BEGIN;

CREATE TABLE carga (
  id            bigserial PRIMARY KEY,
  fonte         text        NOT NULL,
  iniciada_em   timestamptz NOT NULL DEFAULT now(),
  finalizada_em timestamptz,
  status        text        NOT NULL CHECK (status IN ('executando','ok','erro','defasada')),
  registros     integer,
  erro          text,
  hash_arquivo  text
);

-- Colunas de proveniência repetidas nas tabelas de dados:
--   fonte, url_origem, data_referencia, data_coleta, id_carga -> carga(id), hash_arquivo

CREATE TABLE municipio (
  codigo_ibge        integer PRIMARY KEY,
  nome               text    NOT NULL,
  uf                 char(2) NOT NULL,
  regiao             text,
  regiao_imediata    text,
  regiao_metropolitana text,
  capital            boolean NOT NULL DEFAULT false,
  populacao          integer,
  piloto             boolean NOT NULL DEFAULT false,
  fonte text NOT NULL, url_origem text, data_referencia text, data_coleta timestamptz NOT NULL,
  id_carga bigint REFERENCES carga(id), hash_arquivo text
);

CREATE TABLE secretaria (
  id           serial PRIMARY KEY,
  municipio_ibge integer NOT NULL REFERENCES municipio(codigo_ibge),
  codigo       text    NOT NULL,           -- ex.: saude, educacao (de data/config/secretarias.json)
  nome         text    NOT NULL,
  UNIQUE (municipio_ibge, codigo)
);

CREATE TABLE orgao_fundo (
  cnpj           char(14) PRIMARY KEY,
  municipio_ibge integer NOT NULL REFERENCES municipio(codigo_ibge),
  razao_social   text    NOT NULL,
  tipo           text    NOT NULL CHECK (tipo IN ('prefeitura','fundo','autarquia','fundacao','orgao')),
  natureza_juridica char(4),
  secretaria_id  integer REFERENCES secretaria(id),
  status_validacao text  NOT NULL DEFAULT 'pendente_validacao' CHECK (status_validacao IN ('pendente_validacao','validado','rejeitado')),
  validado_por   text,
  validado_em    timestamptz,
  fonte text NOT NULL, url_origem text, data_referencia text, data_coleta timestamptz NOT NULL,
  id_carga bigint REFERENCES carga(id), hash_arquivo text
);

CREATE TABLE tema (
  id   text PRIMARY KEY,                   -- ex.: drenagem
  nome text NOT NULL,
  palavras_chave text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE tema_funcao (
  tema_id    text NOT NULL REFERENCES tema(id),
  funcao     text NOT NULL,                -- código da função orçamentária
  subfuncao  text NOT NULL DEFAULT '',
  orgao_concedente text,
  PRIMARY KEY (tema_id, funcao, subfuncao)
);

CREATE TABLE secretaria_tema (
  secretaria_id integer NOT NULL REFERENCES secretaria(id),
  tema_id       text    NOT NULL REFERENCES tema(id),
  PRIMARY KEY (secretaria_id, tema_id)
);

CREATE TABLE parlamentar (
  id      bigserial PRIMARY KEY,
  nome    text NOT NULL,
  partido text,
  uf      char(2),
  casa    text CHECK (casa IN ('camara','senado'))
);

CREATE TABLE programa (
  id             bigserial PRIMARY KEY,
  codigo         text NOT NULL,
  orgao_concedente text,
  objeto         text,
  publico_alvo   text,
  situacao       text,
  inicio_proposta date,
  fim_proposta    date,
  contrapartida_minima numeric(5,2),
  tema_id        text REFERENCES tema(id),
  fonte text NOT NULL, url_origem text, data_referencia text, data_coleta timestamptz NOT NULL,
  id_carga bigint REFERENCES carga(id), hash_arquivo text,
  UNIQUE (fonte, codigo)
);

CREATE TABLE oportunidade (
  id          bigserial PRIMARY KEY,
  programa_id bigint REFERENCES programa(id),
  titulo      text NOT NULL,
  texto       text,
  prazo       date,
  url_oficial text,
  fonte text NOT NULL, url_origem text, data_referencia text, data_coleta timestamptz NOT NULL,
  id_carga bigint REFERENCES carga(id), hash_arquivo text
);

CREATE TABLE instrumento (
  id             bigserial PRIMARY KEY,
  municipio_ibge integer NOT NULL REFERENCES municipio(codigo_ibge),
  cnpj_beneficiario char(14) REFERENCES orgao_fundo(cnpj),
  tipo           text NOT NULL,            -- convenio, contrato_repasse, termo_fomento, ted, transf_especial, fundo_a_fundo
  numero         text NOT NULL,
  programa_id    bigint REFERENCES programa(id),
  secretaria_id  integer REFERENCES secretaria(id),
  valor_pactuado numeric(16,2),
  valor_repasse  numeric(16,2),
  contrapartida  numeric(16,2),
  vigencia_inicio date,
  vigencia_fim    date,
  situacao       text,
  fonte text NOT NULL, url_origem text, data_referencia text, data_coleta timestamptz NOT NULL,
  id_carga bigint REFERENCES carga(id), hash_arquivo text,
  UNIQUE (fonte, numero)
);

CREATE TABLE financeiro (
  id            bigserial PRIMARY KEY,
  instrumento_id bigint NOT NULL REFERENCES instrumento(id),
  tipo          text NOT NULL CHECK (tipo IN ('empenho','desembolso','pagamento')),
  data          date,
  valor         numeric(16,2) NOT NULL,
  fonte text NOT NULL, url_origem text, data_referencia text, data_coleta timestamptz NOT NULL,
  id_carga bigint REFERENCES carga(id), hash_arquivo text
);
-- saldo a liberar = instrumento.valor_repasse - SUM(financeiro.valor WHERE tipo = 'desembolso')

CREATE TABLE emenda (
  id            bigserial PRIMARY KEY,
  numero        text NOT NULL,
  parlamentar_id bigint REFERENCES parlamentar(id),
  instrumento_id bigint REFERENCES instrumento(id),
  valor         numeric(16,2),
  fonte text NOT NULL, url_origem text, data_referencia text, data_coleta timestamptz NOT NULL,
  id_carga bigint REFERENCES carga(id), hash_arquivo text
);

CREATE TABLE indicador (
  id             bigserial PRIMARY KEY,
  municipio_ibge integer NOT NULL REFERENCES municipio(codigo_ibge),
  codigo         text NOT NULL,
  tema_id        text REFERENCES tema(id),
  valor          numeric,
  data_referencia text NOT NULL,
  fonte text NOT NULL, url_origem text, data_coleta timestamptz NOT NULL,
  id_carga bigint REFERENCES carga(id), hash_arquivo text
);

CREATE TABLE regularidade (                -- CAUC, com histórico
  id             bigserial PRIMARY KEY,
  municipio_ibge integer NOT NULL REFERENCES municipio(codigo_ibge),
  item           text NOT NULL,
  situacao       text NOT NULL,
  data_referencia text NOT NULL,
  fonte text NOT NULL, url_origem text, data_coleta timestamptz NOT NULL,
  id_carga bigint REFERENCES carga(id), hash_arquivo text
);

CREATE TABLE usuario (
  id            bigserial PRIMARY KEY,
  municipio_ibge integer NOT NULL REFERENCES municipio(codigo_ibge),
  email         text NOT NULL UNIQUE,
  perfil        text NOT NULL CHECK (perfil IN ('administrador','gestor_gabinete','captacao','secretaria_gestor','secretaria_tecnico','leitura')),
  secretaria_id integer REFERENCES secretaria(id),
  ativo         boolean NOT NULL DEFAULT true
);

CREATE TABLE alerta (
  id            bigserial PRIMARY KEY,
  municipio_ibge integer NOT NULL REFERENCES municipio(codigo_ibge),
  tipo          text NOT NULL,
  gravidade     text NOT NULL CHECK (gravidade IN ('baixa','media','alta')),
  instrumento_id bigint REFERENCES instrumento(id),
  acao_recomendada text,
  responsavel_id bigint REFERENCES usuario(id),
  status        text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_andamento','resolvido')),
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evento_agenda (
  id          bigserial PRIMARY KEY,
  alerta_id   bigint REFERENCES alerta(id),
  titulo      text NOT NULL,
  inicio      timestamptz NOT NULL,
  sincronizado_com text CHECK (sincronizado_com IN ('google','outlook','ics')),
  id_externo  text
);

CREATE TABLE projeto (
  id            bigserial PRIMARY KEY,
  municipio_ibge integer NOT NULL REFERENCES municipio(codigo_ibge),
  oportunidade_id bigint REFERENCES oportunidade(id),
  secretaria_id integer REFERENCES secretaria(id),
  titulo        text NOT NULL,
  situacao      text NOT NULL DEFAULT 'rascunho',
  criado_por    bigint REFERENCES usuario(id),
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE projeto_versao (
  id          bigserial PRIMARY KEY,
  projeto_id  bigint NOT NULL REFERENCES projeto(id),
  numero      integer NOT NULL,
  minuta      text,
  plano_trabalho text,
  parecer     jsonb,
  gerado_por_ia boolean NOT NULL DEFAULT false,
  prompt      text,                          -- registro do prompt e do modelo (Parte 5.5)
  modelo      text,
  revisado_por bigint REFERENCES usuario(id),
  aprovado_por bigint REFERENCES usuario(id),
  criado_em   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (projeto_id, numero)
);

-- Auditoria imutável: somente INSERT; revogar UPDATE/DELETE do papel da aplicação.
CREATE TABLE auditoria (
  id        bigserial PRIMARY KEY,
  quando    timestamptz NOT NULL DEFAULT now(),
  usuario_id bigint REFERENCES usuario(id),
  acao      text NOT NULL,
  entidade  text,
  entidade_id text,
  versao    text,
  detalhe   jsonb
);

COMMIT;
