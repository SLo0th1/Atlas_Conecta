# Transferegov - detalhe de programas (Discricionarias e Legais)

Data da última validação: 2026-11-10
Status: PARCIAL

## Resumo
Existe API aberta, sem autenticação, que traz o texto descritivo dos programas (descricao, observacao, criterios_de_selecao). NÃO existe nela valor mínimo/máximo por proposta nem percentual mínimo de contrapartida. Os 4 campos pedidos não podem ser preenchidos automaticamente; apenas objetivo/texto e critérios de seleção (texto livre).

## 1. Página raiz (https://api-publica.transferegov.gestao.gov.br/)
HTTP 200, HTML estático. Módulos listados (links):
- /discricionarias (307 redireciona para /discricionarias/ ; documentação em /discricionarias/docs)
- /especiais, /fundoafundo, /parcerias, /ted, /downloads
- Modelos de dados (zip) em gov.br/transferegov/.../paineis-gerenciais/arquivos/ (modelo_dados_api-discricionarias.zip, modelo-dados-csvs-discricionarias-e-legais.zip etc.)
- Licença citada: ODbL 1.0 (opendatacommons.org).

## 2. API Discricionárias e Legais (no ar)
- Base: https://api-publica.transferegov.gestao.gov.br/discricionarias
- Swagger UI: /discricionarias/docs ; OpenAPI 3.1: /discricionarias/openapi.json (HTTP 200, validado)
- Método: GET, JSON paginado {data,total_pages,total_items,page_number,page_size}; parâmetros `pagina` e `tamanho_da_pagina` (padrão 50 por página). Filtro por igualdade simples: `?cod_programa=3000020260003` (a sintaxe PostgREST `eq.` NÃO funciona e devolve vazio).
- Autenticação: nenhuma. Sem captcha. Usei curl comum.
- Endpoints (13): /todos-programas, /perguntas-respostas-selecao-pac, /apoiadores-emendas-programas, /data-atualizacao, /propostas, /proponentes, /consorcios, /propostas-canceladas, /plano-aplicado-detalhado, /meta-crono-fisico, /justificativas-proposta, /propostas-selecao-pac, /proposta-formalizacao-pac.
- /data-atualizacao retornou {"data_ultima_atualizacao":"2026-11-09T11:25:21"}.
- Observação: o aviso gov.br (Entrega 1 Atos Preparatórios 01/07/2026-31/10/2026) não foi confirmado textualmente na página consultada; porém a API de programas já está no ar e atualizada (2026-11-09).

### Campos de /todos-programas
id_programa, cod_orgao_sup_programa, desc_orgao_sup_programa, orgao_executor, cod_programa, ano_programa, nome_programa, acao_orcamentaria, sit_programa, data_disponibilizacao, ano_disponibilizacao, dt_prog_ini/fim_receb_prop, expiracao_prog_prop_voluntaria, dt_prog_ini/fim_emenda_par, expiracao_prog_emenda_par, dt_prog_ini/fim_benef_esp, expiracao_prog_benef_esp, **descricao, observacao, criterios_de_selecao**, data_publicacao, **chamamento_projeto** (SIM/NÃO), emenda, modalidade_programa, natureza_juridica_programa, uf_programa, **qualificacao_proposta**, id_subtipo_programa, modalidade_subtipo_programa, nome_subtipo_programa, descricao_subtipo_programa, ind_projeto_estruturante_calamidade_temp, modalidade_programa_agrupada, programas_propostas.

### Atendimento dos 4 campos
| Campo | Atende? | Onde |
|---|---|---|
| Objetivo / descrição | SIM (texto livre) | descricao (e observacao) |
| Texto do edital / chamamento | PARCIAL | criterios_de_selecao + chamamento_projeto (flag). Não há texto de edital nem PDF/link, salvo quando o órgão escreve link no texto (ex.: pasta do Google Drive no programa SENASP) |
| Critérios de elegibilidade | PARCIAL | criterios_de_selecao, qualificacao_proposta, natureza_juridica_programa (texto livre/órgão, não estruturado) |
| Valor mínimo/máximo por proposta | NÃO | nenhum campo no OpenAPI |
| % mínimo de contrapartida | NÃO | nenhum campo no programa (vl_contrapartida_* existem só em /propostas, por proposta, não como regra do programa) |

Busca no schema por contrapart/minimo/maximo/edital/objeto/elegib: só aparecem objeto_proposta e vl_contrapartida_* em proposta (valores reais de propostas, não limites do programa).

## 3. Testes concretos
- 3000020260003 (SENASP - Emendas Individuais RP6, ação 21BM): total_items=162 (uma linha por UF x natureza jurídica x modalidade; cod_programa se repete, id_programa distinto por linha - deduplicar por cod_programa). sit=DISPONIBILIZADO; prazo emenda 2026-02-18 a 2026-11-11; descricao = "O programa visa atender as emendas individuais. INSTRUCOES E MODELOS: https://drive.google.com/..." (descricao, observacao e criterios_de_selecao são o mesmo texto curto). Sem valores nem contrapartida.
- 5100020260027 (Ministério do Esporte, SNEAELIS Emenda de Comissão RP8): total_items=243; sit=DISPONIBILIZADO; prazo emenda 2026-05-07 a 2026-11-22; descricao rica ("Implementacao de infraestrutura esportiva, para o desenvolvimento do esporte amador, educacional, recreativo e de lazer, ..."), observacao ("Condicao para modificacao, modernizacao, implantacao, construcao, reforma de equipamentos esportivos, ..."), criterios_de_selecao ("A modalidade de Convenio, parceria firmada com entes publicos ... visa a implantacao de infraestrutura esportiva ..."). Sem valores nem contrapartida.
Qualidade varia por órgão: textos podem ser genéricos ou repetidos.

Exemplo de chamada: GET https://api-publica.transferegov.gestao.gov.br/discricionarias/todos-programas?cod_programa=5100020260027&tamanho_da_pagina=1
Atenção: respostas vêm em UTF-8; ao ler com curl no Windows forçar UTF-8 (nome_programa etc. têm acentos, algumas colunas vêm sem acento).

## 4. API aberta antiga (https://api.transferegov.gestao.gov.br/)
Raiz = 404. /fundoafundo, /transferenciasespeciais, /ted respondem 200 (Swagger 2.0; transferenciasespeciais é de Transferências Especiais). São módulos distintos; não há tabela de programas discricionários neles (não varri todos os endpoints; o módulo discricionário migrou para api-publica/discricionarias).

## 5. Portal "Consultar Programas" (Plataforma +Brasil)
NÃO testado/automatizado de propósito. voluntarias.plataformamaisbrasil.gov.br não resolve DNS a partir desta máquina (endereço antigo). O portal atual é https://discricionarias.transferegov.sistema.gov.br/ (HTTP 200 na raiz); a consulta de programas é interface web interativa (Angular/JS, possível captcha), não foi raspada. Pelas regras da tarefa, não se automatiza. Os campos de valor mínimo/máximo e contrapartida, se existirem, aparecem apenas na tela do programa/edital (ou em PDF anexo) e não na API - verificação manual do dono recomendada em 1 programa.

## Limitações
- Valor mín/máx e % contrapartida: sem fonte aberta estruturada encontrada. Alternativa: extrair de texto livre (descricao/observacao) por regex/IA com baixa confiabilidade, ou preenchimento manual/curadoria.
- Linhas duplicadas por UF/natureza/modalidade; paginação de 50.
- Texto de edital/anexos só por link que o órgão digitar no texto.

## Uso no projeto (2026-11-10)
O coletor `coletores/programas-abertos.ts` consulta `GET /discricionarias/todos-programas?cod_programa=<código>&tamanho_da_pagina=50` (uma chamada por programa elegível, pausa de 300 ms, 3 tentativas) e grava no JSON: descrição, observação, critérios de seleção, `chamamento_projeto`, links https citados no texto e frases que citam "contrapartida" ou "valor mínimo/máximo". Resultado: texto oficial obtido para 58 de 59 programas (1 falha temporária HTTP 502); 3 programas citam links no texto (pasta do Google Drive da SENASP; InvestSUS); 9 citam valor mínimo/contrapartida no texto. O detalhe da tela mostra o resumo do objetivo (frases extraídas, sem reescrita), os critérios, esses trechos e, como referência, os valores e a contrapartida observados nas propostas de prefeituras já apresentadas (não são regra oficial).
