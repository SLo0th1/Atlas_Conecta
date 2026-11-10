# Ficha de fonte: DATASUS (OpenDataSUS, apidadosabertos.saude.gov.br/CNES, TabNet)

## URL(s) validada(s)
- `https://apidadosabertos.saude.gov.br/` (redireciona via JS para `/v1`, documentação Swagger; spec em `/static/swagger.json`, versão 1.8.32, ~228 KB, HTTP 200)
- `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_municipio=520870&limit=2` (HTTP 200, `application/json`)
- `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos/9644113` (HTTP 200)
- `https://opendatasus.saude.gov.br/` (HTTP 200, portal Next.js; links para `/dataset?...`)
- `http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sih/cnv/niuf.def` (HTTP 200, HTML ISO-8859-1)
- `https://datasus.saude.gov.br/informacoes-de-saude-tabnet/` (HTTP 200)
- `https://ftp.datasus.gov.br/dissemin/publicos/`: curl retornou código 000 (sem resposta), NÃO validado.

## Método de acesso
- CNES e demais conjuntos do swagger: API REST JSON, paginada com `limit`/`offset` (presentes nos 112 endpoints do swagger).
- OpenDataSUS: catálogo de arquivos via páginas `/dataset`; a API CKAN não respondeu (ver abaixo).
- TabNet: formulários CGI (`deftohtm.exe`) que exigem envio de formulário; só por robô (scraping de formulário, saída HTML/CSV). Não há API.

## Autenticação
Nenhuma nos testes.

## Limites de requisição
Não documentados. Cabeçalho da API: `Cache-Control: public, max-age=300`. Sem 429 em poucas requisições.

## Frequência de atualização
CNES: campo `data_atualizacao` por registro (amostra: 2025-09-03); a base do CNES é mensal. TabNet: mensal/anual conforme o sistema. Não verificado endpoint por endpoint.

## Campos que o projeto usará
CNES (estabelecimentos): `codigo_cnes`, `nome_fantasia`, `codigo_tipo_unidade`, `descricao_esfera_administrativa`, `tipo_gestao`, `codigo_municipio` (6 dígitos), `codigo_uf`, `latitude_estabelecimento_decimo_grau`, `longitude_estabelecimento_decimo_grau`, `estabelecimento_faz_atendimento_ambulatorial_sus`, `estabelecimento_possui_atendimento_hospitalar`, `data_atualizacao`. Existem também no swagger `/assistencia-a-saude/hospitais-e-leitos` e `/macrorregiao-e-regiao-de-saude/municipio` (não consultados).

## Resultado do teste
- CNES por município 520870 (Goiânia, IBGE de 6 dígitos): HTTP 200, JSON `{"estabelecimentos":[{"codigo_cnes":9644113,"codigo_municipio":520870,"codigo_uf":52,"descricao_esfera_administrativa":"MUNICIPAL",...}]}` (amostra de estabelecimento, sem dado pessoal sensível).
- `limit=1/2` não limitou de forma evidente a resposta; conferir paginação no coletor.
- CKAN `package_search`: testadas `https://opendatasus.saude.gov.br/api/3/action/package_search?q=cnes&rows=2`, `/api/3/action/package_list`, `/api/3/action/status_show` e `/api/action/package_search`: todas HTTP 200 mas com HTML do portal (SPA), NÃO JSON. `https://dadosabertos.saude.gov.br/api/3/...` retorna 404 HTML. Conclusão: a API CKAN não está disponível nesses caminhos.
- O swagger NÃO tem endpoints de repasses do FNS; tem CNES, SISAGUA, SISVAN, vacinação, arboviroses, atenção primária (PMMB), saúde indígena, etc.

## Problemas / mudanças em relação ao esperado
- OpenDataSUS parece ter migrado de CKAN para portal próprio (Next.js); a consulta CKAN prevista não funciona. Alternativa: apidadosabertos (JSON) e download de arquivos pelas páginas `/dataset`. A API interna do novo portal não foi investigada.
- `/v1/cnes/estabelecimentos` retorna 404; o caminho correto é `/cnes/estabelecimentos`.
- Município usa 6 dígitos (sem dígito verificador): 520870 em vez de 5208707.
- FTP do DATASUS não respondeu; TabNet é o único meio testado para séries SIH/SIA.

**Data da última validação: 2026-11-09**
**Status: PARCIAL**
