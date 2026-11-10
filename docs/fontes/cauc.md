# Ficha de fonte: CAUC – Cadastro Único de Exigências para Transferências Voluntárias (Tesouro Nacional)

## URL(s) validada(s)
- **Fonte aberta (preferida):** conjunto "CAUC" no Tesouro Transparente (CKAN), localizado por `https://www.tesourotransparente.gov.br/ckan/api/3/action/package_search?q=CAUC` (HTTP 200, 1 conjunto, dataset id `72b5f371-0c35-4613-8076-c99c821a6410`).
  - CSV dos municípios: `https://www.tesourotransparente.gov.br/ckan/dataset/72b5f371-0c35-4613-8076-c99c821a6410/resource/07af297a-5e59-494a-a88a-55ddfd2f4b01/download/relatorio-situacao-de-varios-entes---municipios---uf-todas---abrangencia-1.csv` (HTTP 200, text/csv, ~1,9 MB)
  - CSV dos estados e DF: `.../resource/83d2fbd7-4369-4935-85c2-366925cc5841/download/relatorio-situacao-de-varios-entes---estados-e-df---uf-todas---abrangencia-1.csv` (13 KB; baixado apenas o de municípios)
  - Metadados (PDF): resources `6014c4c6-...` (municípios) e `17e7fae2-...` (estados), dicionário das colunas/itens (não lidos).
- Consulta pública oficial (página): `https://cauc.tesouro.gov.br/` (redireciona para `/ng/`, aplicação Angular no navegador; HTTP 200).
- `https://sti-cauc.tesouro.gov.br/` retornou 404 ("Container App stopped or does not exist"). `https://www.tesourotransparente.gov.br/temas/estados-e-municipios/cauc` retornou 503 (página de manutenção) no momento do teste.

## Método de acesso
Arquivo (CSV aberto no CKAN, também acessível pela API CKAN `package_search`/`package_show`). Robô NÃO é necessário: a página `cauc.tesouro.gov.br` é uma aplicação em JavaScript (Angular) e só precisaria de navegador automatizado se o CSV deixasse de existir. Preferir o CSV.

## Autenticação
Nenhuma para o CSV.

## Limites de requisição
Não documentados. Uma única requisição por coleta é suficiente (1 arquivo nacional).

## Frequência de atualização
Diária, segundo o metadado do dataset ("Frequência de atualização: Diária"). Observado: o recurso de municípios com `last_modified` de 2026-11-09T11:10 e cabeçalho do CSV "Data da Pesquisa: 09/11/2026".

## Formato
CSV com `;` e todos os campos entre aspas, codificação ISO-8859-1/Latin-1 (acentos quebram se lido como UTF-8). Três linhas de preâmbulo ("Data da Pesquisa", "Tipo de Ente", "Abrangência: CNPJ principal dos Entes Federados"), depois o cabeçalho na linha 4. 5.613 linhas no arquivo de municípios.

## Campos que o projeto usará
Colunas: UF, Nome do Ente Federado, Código IBGE, Código SIAFI, Região, População, Fonte, e uma coluna por item de exigência: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1.1, 2.1.2, 3.1.1, 3.1.2, 3.2.1, 3.2.2, 3.2.3, 3.2.4, 3.3, 3.4.1, 3.4.2, 3.5, 3.6, 3.7, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7. Cada célula traz uma data (provável vencimento/validade da comprovação), "!" ou "Desabilitado". O significado exato de "!" e de cada data NÃO foi confirmado (está nos PDFs de metadados, não lidos). O município é identificado por Código IBGE (Goiânia 5208707 presente: 1 linha).

## Resultado do teste
- `package_search?q=CAUC`: HTTP 200, 1 resultado.
- Download do CSV de municípios: HTTP 200, text/csv; leitura do cabeçalho e localização da linha de 5208707 OK. Conteúdo da linha não reproduzido nesta ficha.
- `cauc.tesouro.gov.br`: HTTP 200 (HTML do Angular). Estrutura interna (chamadas XHR) NÃO investigada.

## Problemas / mudanças em relação ao esperado
- Existe fonte aberta e diária; portanto não usar robô na página de consulta.
- Interpretação das células ("!" vs. data vs. "Desabilitado") precisa ser confirmada nos PDFs de metadados antes de transformar em "regular/irregular".
- Codificação Latin-1 e preâmbulo de 3 linhas exigem tratamento no coletor.
- O CSV é a situação do dia; histórico precisa ser guardado pelo projeto.
- Hospedagem do Tesouro Transparente instável (503 numa página de tema no teste): prever retentativas.

**Data da última validação: 2026-11-09**

**Status: OK**
