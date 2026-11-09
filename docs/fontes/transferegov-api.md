# Ficha de fonte: Transferegov – API de dados abertos (Transferências Especiais, Fundo a Fundo, TED)

## URL(s) validada(s)
- **Ambiente antigo (ainda ativo em 2026-11-09):** `https://api.transferegov.gestao.gov.br/<modulo>/`, com modulo = `transferenciasespeciais`, `fundoafundo` ou `ted`. A raiz `/` retorna 404/403. `GET /<modulo>/` devolve o Swagger 2.0 (JSON) do módulo.
- **Novo portal (anunciado oficialmente):** `https://api-publica.transferegov.gestao.gov.br/` (página HTML HTTP 200 com links para `/discricionarias`, `/especiais`, `/fundoafundo`, `/parcerias`, `/ted`, `/downloads`; essas subpáginas respondem 307, destino não seguido). Os caminhos do ambiente antigo (`/transferenciasespeciais/`, `/fundoafundo/programa`, `/ted/programa`) retornam 404 no ambiente novo. O formato das URLs dos endpoints novos NÃO foi determinado.
- Documentação: `https://www.gov.br/transferegov/pt-br/ferramentas-gestao/api-de-dados-abertos-transferegov.br` (diz que Transferências Especiais e Gestão de Parcerias já estão no novo ambiente) e `.../dados-abertos` (TED aparece como "ativa neste ambiente (em fase de migração)").

## Método de acesso
API REST (PostgREST). Sem robô.

## Autenticação
Nenhuma (GET anônimo funcionou).

## Limites de requisição
Não documentados nos Swaggers lidos. Há Cloudflare na frente (`Server: cloudflare`). Volume não testado. Paginação PostgREST: `limit` e `offset` (ou cabeçalho `Range`). Teste com `Range: 0-0` e `Prefer: count=exact` devolveu `content-range: 0-0/16` (total exato funciona).

## Frequência de atualização
Não documentada (não confirmada).

## Tabelas (endpoints lidos do Swagger)
- **transferenciasespeciais:** programa_especial, plano_acao_especial, empenho_especial, documento_habil_especial, ordem_pagamento_ordem_bancaria_especial, historico_pagamento_especial, relatorio_gestao_especial, relatorio_gestao_novo_especial, meta_especial, executor_especial, plano_trabalho_especial, finalidade_especial, plano_trabalho_analise_especial, orgao_analise_pendente_especial.
- **fundoafundo:** programa, programa_beneficiario, programa_gestao_agil, plano_acao, plano_acao_dado_bancario, plano_acao_meta, plano_acao_meta_acao, plano_acao_destinacao_recursos, plano_acao_analise, plano_acao_analise_responsavel, plano_acao_historico, termo_adesao, termo_adesao_historico, gestao_financeira_lancamentos, gestao_financeira_subtransacoes, gestao_financeira_categorias_despesa, empenho, relatorio_gestao (e _acoes, _analise, _analise_responsavel).
- **ted:** programa, programa_beneficiario, programa_acao_orcamentaria, plano_acao, plano_acao_meta, plano_acao_etapa, plano_acao_analise, plano_acao_parecer, termo_execucao, nota_credito, evento, programacao_financeira, trf.

## Filtros
Operadores PostgREST: `?coluna=eq.valor`, `select=`, `order=`, `limit=`, `offset=`.
- Especiais: filtrar por `cnpj_beneficiario_plano_acao` (plano_acao_especial) e `cnpj_beneficiario_empenho` (empenho_especial). Não há código IBGE nessas tabelas; usar o CNPJ do município (Goiânia: 01612092000123).
- Fundo a Fundo: `plano_acao` tem `codigo_ibge_municipio_ente_recebedor_plano_acao`, `cnpj_ente_recebedor_plano_acao`, `codigo_ibge_fundo_recebedor_plano_acao`, `cnpj_fundo_recebedor_plano_acao`; `empenho` tem `cnpj_favorecido_empenho`.
- TED: partes são órgãos federais (unidade_descentralizada etc.), sem filtro por município; TED é entre órgãos da União e tem pouca relevância para o município.

## Campos que o projeto usará (nomes reais do Swagger)
- plano_acao_especial: id_plano_acao, codigo_plano_acao, ano_plano_acao, situacao_plano_acao, cnpj_beneficiario_plano_acao, nome_beneficiario_plano_acao, uf_beneficiario_plano_acao, nome_parlamentar_emenda_plano_acao, codigo_emenda_parlamentar_formatado_plano_acao, descricao_programacao_orcamentaria_plano_acao, valor_custeio_plano_acao, valor_investimento_plano_acao, id_programa. A tabela contém também dados bancários (banco, agência, conta): NÃO coletar.
- empenho_especial: id_empenho, numero_empenho, situacao_empenho, data_emissao_empenho, valor_empenho, cnpj_beneficiario_empenho, id_plano_acao.
- programa_especial: id_programa, ano_programa, codigo_programa, sigla_orgao_superior_programa, nome_orgao_superior_programa, data_inicio_ciencia_programa, data_fim_ciencia_programa, valor_total_disponibilizado_programa, valor_a_disponibilizar_programa.
- fundoafundo.plano_acao: codigo_plano_acao, situacao_plano_acao, data_inicio_vigencia_plano_acao, data_fim_vigencia_plano_acao, valor_total_repasse_plano_acao, valor_repasse_emenda_plano_acao, valor_repasse_especifico_plano_acao, valor_repasse_voluntario_plano_acao, nome_orgao_repassador_plano_acao, codigo_ibge_municipio_ente_recebedor_plano_acao, id_programa.
- fundoafundo.programa: id_programa, codigo_programa, nome_programa, situacao_programa, valor_global_programa, datas de recebimento de planos de ação.
- ted.programa, ted.plano_acao, ted.termo_execucao: ver Swagger (prefixos tx_, aa_, vl_, dt_).

## Resultado do teste (ambiente antigo)
- `GET .../transferenciasespeciais/`, `/fundoafundo/`, `/ted/`: HTTP 200 (Swagger JSON).
- `GET .../transferenciasespeciais/plano_acao_especial?limit=1`: HTTP 200, array JSON com 1 registro.
- `GET .../plano_acao_especial?cnpj_beneficiario_plano_acao=eq.01612092000123&limit=1&select=codigo_plano_acao,ano_plano_acao,situacao_plano_acao,nome_beneficiario_plano_acao`: HTTP 200, `[{"codigo_plano_acao":"0903-003477","ano_plano_acao":2020,"situacao_plano_acao":"CIENTE","nome_beneficiario_plano_acao":"MUNICIPIO DE GOIANIA"}]`. Total de planos de Goiânia nesse módulo: 16.
- `GET .../fundoafundo/plano_acao?limit=1`: HTTP 200 (textos longos, não gravados).
- NÃO testados: filtro por CNPJ em empenho_especial e em fundoafundo, paginação além da primeira página, limite de taxa, endpoints do ambiente novo.

## Problemas / mudanças em relação ao esperado
- Migração em andamento: o ambiente antigo funciona hoje, mas o oficial passa a ser `api-publica.transferegov.gestao.gov.br`, cujo formato de URL não foi mapeado. Antes de construir o coletor, mapear o Swagger novo e deixar a URL base configurável.
- Não confirmado se Fundo a Fundo já está no ambiente novo (a página oficial cita só Especiais e Parcerias como migrados).
- A API do módulo Discricionárias e Legais (convênios) ainda não cobre execução; usar a ficha `transferegov-arquivos`.
- Há dados bancários públicos em plano_acao_especial: não persistir.

**Data da última validação: 2026-11-09**

**Status: PARCIAL**
