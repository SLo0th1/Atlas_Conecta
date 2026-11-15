# GovNexa — Modelo de dados (Fase 0)

Desenho lógico para os módulos Projetos, Contratação e Gestão. O banco de produção será PostgreSQL (Fase 3); até lá o MVP lê e grava arquivos JSON com a **mesma forma** destas entidades, para que a migração seja só uma carga. As tabelas da Captação já existem em `docs/esquema-postgres.sql` e se ligam a estas por `projeto_id`.

## 1. Regras gerais

- **Isolamento por prefeitura.** Toda tabela de negócio tem `prefeitura_id`. No PostgreSQL, o isolamento é imposto pelo banco (segurança por linha, *row level security*) com a prefeitura da sessão; a tela nunca é a única barreira.
- **Identificadores** `uuid`; códigos legíveis (ex.: número do item na planilha) ficam em colunas próprias.
- **Ausente é `null`**, nunca zero. Valores em `numeric(16,2)`; datas em `date`; momentos em `timestamptz`.
- **Origem preservada.** Registro importado guarda `origem` (planilha, PDF do SEI, página pública do SEI, manual) e o valor bruto em `importacao_linha`.
- **Histórico.** Mudança de campo vai para `historico` (autor, antes, depois, motivo); valor, prioridade e macroetapa exigem motivo.
- **Sem dados pessoais desnecessários.** Pessoa tem nome, unidade e contato de trabalho; nada de CPF. Texto lido de documento público tem dados pessoais mascarados.

## 2. Entidades

### Catálogos
| Entidade | Campos principais |
| --- | --- |
| `prefeitura` | id, codigo_ibge, nome, uf, nome_exibicao, subdominio, logo, ativa |
| `modulo_contratado` | prefeitura_id, modulo (projetos, captacao, licitacoes, gestao), ativo |
| `orgao` | id, prefeitura_id, sigla, nome, tipo (interno, externo) |
| `pessoa` | id, prefeitura_id, nome, orgao_id, email_trabalho, ativa |
| `regiao` | id, prefeitura_id, nome |
| `tipo_projeto` | id, prefeitura_id, nome, modelo_cronograma_id |
| `fonte_recurso` | id, prefeitura_id, nome, categoria (tesouro, financiamento, repasse, convenio, contrapartida, outro) |
| `feriado` | data, descricao, abrangencia (nacional, estadual, municipal), prefeitura_id (só municipal) |
| `parametro` | prefeitura_id, chave, valor, referencia_legal (prazos de alerta, pesos do score, metas internas) |

### Projetos
| Entidade | Campos principais |
| --- | --- |
| `projeto` | id, prefeitura_id, codigo_legado, titulo, local, tipo_projeto_id, orgao_demandante_id, orgao_executor_id, orgao_onde_esta_id, responsavel_id, gerente_id, compromisso (decidido, condicionado, ideia), macroetapa (1 a 9), estado_lateral, prioridade_executiva (P0 a P3), obra_do_prefeito, maturidade (1 a 5), complexidade (1 a 4), valor_estimado, origem_valor, data_base_valor, entrega_prevista_base, entrega_projetada, criado_em, atualizado_em |
| `projeto_fonte` | projeto_id, fonte_recurso_id, valor, garantido (sim, em estudo, não), convenio_id |
| `projeto_regiao` | projeto_id, regiao_id, percentual (soma 100) |
| `projeto_previsao_anual` | projeto_id, ano, tipo (fisico, financeiro), valor, percentual |
| `projeto_link` | projeto_id, relacionado_id, tipo (depende_de, parte_de, sobreposto, substitui) |
| `processo_sei` | id, prefeitura_id, numero, tipo, link_publico, ultima_leitura, unidade_atual, desde |
| `projeto_processo` | projeto_id, processo_sei_id (N para N) |
| `demanda` | id, prefeitura_id, titulo, origem, situacao, projeto_id |

### Cronograma
| Entidade | Campos principais |
| --- | --- |
| `modelo_cronograma` / `modelo_etapa` / `modelo_dependencia` | fases, etapas padrão (duração, dias úteis ou corridos, marco, opcional, permite ciclos, órgão padrão) e predecessoras (FS, SS, FF, SF, folga) |
| `etapa` | id, projeto_id, fase, codigo, nome, responsavel_id, orgao_id, eh_marco, inicio_previsto, fim_previsto, inicio_real, fim_real, percentual_manual, status_manual, justificativa |
| `dependencia` | etapa_id, predecessora_id, tipo, folga_dias |
| `ciclo` | etapa_id, numero, tipo (entrega, validacao, diligencia, protocolo, exigencia), orgao_id, enviado_em, retornou_em, resultado |
| `bloqueio` | etapa_id, motivo, depende_de_orgao_id, depende_de_pessoa_id, aberto_em, resolvido_em |
| `linha_base` / `linha_base_etapa` | versão, motivo, datas previstas congeladas |

### Contratação (Lei 14.133)
| Entidade | Campos principais |
| --- | --- |
| `contratacao` | id, prefeitura_id, forma (licitacao, adesao_ata, dispensa, inexigibilidade, credenciamento, contrapartida, chamamento), modalidade, criterio, objeto, processo_sei_id, valor_estimado, publicacao_prevista, publicacao_real, abertura, homologacao |
| `lote` | id, contratacao_id, numero, projeto_id, valor_estimado |
| `licitante` | id, lote_id, cnpj, razao_social, valor_proposta, colocacao, situacao (classificado, inabilitado, desclassificado, vencedor) |
| `recurso_licitacao` | lote_id, licitante_id, intencao_em, razoes_ate, contrarrazoes_ate, decisao_em, resultado |
| `contrato` | id, lote_id, numero, empresa_cnpj, valor_inicial, assinatura, publicacao_pncp, ordem_servico, prazo_dias, garantia |
| `aditivo` | contrato_id, tipo (prazo, valor, ambos), valor, dias, data |
| `medicao` | contrato_id, numero, data, percentual_fisico, valor_medido, valor_pago, pago_em |

### Captação (ligação)
`convenio` (já existente na Captação) ganha `projeto_id` e a entidade `clausula_suspensiva` (convenio_id, exigencia, prazo, cumprida_em, etapa_id ligada).

### Governança e auditoria
`reuniao`, `reuniao_item`, `acao` (responsável, prazo, situação), `pendencia_externa`, `historico`, `evento` (alimenta relatórios e notificações), `importacao`, `importacao_linha`, `snapshot_carteira` (foto semanal para o "o que mudou").

## 3. MVP em JSON (Fases 1 e 2)

- Uma pasta por prefeitura, **fora do repositório**, indicada pela variável de ambiente `GOVNEXA_DADOS` (ex.: `GOVNEXA_DADOS/5208707/`), com um arquivo por entidade (`projetos.json`, `etapas.json`, `processos-sei.json`…). Cada arquivo traz `prefeitura_id`, `gerado_em` e a lista de registros com os campos acima.
- O repositório só contém `data/exemplo/`, com uma prefeitura fictícia, usada nos testes e nas demonstrações.
- Sem `GOVNEXA_DADOS`, o sistema usa os dados de exemplo e mostra o aviso "dados de exemplo".
- A camada de acesso (mesmo padrão de `src/lib/dados/`) é a única que lê os arquivos; na Fase 3 ela passa a ler o PostgreSQL sem mudar as telas.
