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

## Coletor CNES (coletores/cnes.ts) - validado em 2026-11-10
Rodar: `node coletores/cnes.ts` (leva ~20 min por causa da paginação e da pausa de 350 ms). Saída: `data/core/cnes-5208707.json` (proveniência, resumo, leitos, lista de unidades públicas e hospitais).

### Endpoints usados e testados (sem chave)
- `/cnes/tipounidades?limit=200`: códigos e descrições dos tipos de unidade (HTTP 200).
- `/cnes/estabelecimentos?codigo_municipio=520870&limit=20&offset=N`: HTTP 200. O limite REAL é 20 por página (limit maior é ignorado); paginação por offset termina em página vazia (261 páginas).
- `/assistencia-a-saude/cnes-leitos?co_ibge=520870&nu_comp=AAAAMM&limit=20&offset=N`: HTTP 200. Com nu_comp devolve só 1 registro por página (901 páginas para 202607); sem nu_comp mistura competências de 2008 em diante. Coletor testa os últimos 8 meses e usa o mais recente com dados (202607).
- NÃO usados: `/assistencia-a-saude/hospitais-e-leitos` (só aceita filtro `uf`, que dá HTTP 500; sem filtro devolve mais de 1 milhão de linhas históricas de todo o país); `/assistencia-a-saude/cnes-equipamentos` (com co_ibge devolveu um registro vazio, sem equipamentos; não confiável). Equipamentos: sem dado útil, pendente.
- Instabilidade: ocorreu HTTP 503 intermitente em uma carga; o coletor tenta 6 vezes com espera progressiva.

### Campos reais (estabelecimento)
codigo_cnes, nome_razao_social, nome_fantasia, tipo_gestao (M/E/D), descricao_esfera_administrativa, codigo_tipo_unidade, bairro_estabelecimento, latitude/longitude, descricao_natureza_juridica_estabelecimento (código IBGE da natureza jurídica, ex.: 4000), estabelecimento_faz_atendimento_ambulatorial_sus (SIM/NAO), estabelecimento_possui_atendimento_hospitalar/centro_cirurgico/centro_obstetrico/centro_neonatal (0/1), codigo_motivo_desabilitacao_estabelecimento, data_atualizacao. Leitos: nu_comp, co_ibge, co_cnes, tp_unidade, no_grupo_nat_jur, tp_leito, ds_leito, qt_existente, qt_sus.

### Contagens obtidas (Goiânia, carga 2026-11-10, dados até 2026-11-06)
- 5.207 estabelecimentos, 4.494 ativos (713 desabilitados). Resumo calculado sobre os ativos.
- Por tipo: 2.446 consultórios isolados, 997 clínicas/centros de especialidade, 395 SADT isolado, 182 farmácias, 129 policlínicas, 88 centros de saúde/UBS, 68 hospitais especializados, 44 hospitais gerais, 13 hospital-dia, 12 CAPS, 8 pronto atendimento (UPA), 37 unidades móveis/urgência.
- Hospitais (tipos HOSPITAL*): 125. Com internação: 123.
- Natureza jurídica: 2.265 empresarial, 1.901 pessoa física, 213 administração pública, 115 sem fins lucrativos.
- Leitos (competência 202607): 131 estabelecimentos, 7.638 leitos existentes, 3.928 SUS, 1.197 UTI (565 SUS). Por grupo: privado 3.933, público 2.337, sem fins lucrativos 1.368.

### Limitações
- Esfera administrativa e gestão no CNES indicam quem GERE (4.453 aparecem como municipais, incluindo privados contratados); a propriedade pública é pela natureza jurídica (213). Não usar esfera como "público".
- Contagens por tipo usam a descrição do tipo; UBS = "CENTRO DE SAUDE/UNIDADE BASICA", UPA = "PRONTO ATENDIMENTO" (aproximação, conferir com a prefeitura).
- LGPD: a lista nominal exclui consultórios isolados e pessoa física (apenas contagens); sem telefone, e-mail, CNPJ ou profissionais.
- Sem equipamentos; leitos dependem de endpoint lento (1 registro por página).
- O arquivo atual foi ajustado por filtro sobre a carga de 2026-11-10 (lista sem consultórios; hospitais e remoção das contagens "publicas_*" enganosas). Uma nova execução completa do coletor gera o mesmo conteúdo já com essas regras.

**Data da última validação: 2026-11-10**
**Status: VALIDADO (CNES estabelecimentos e leitos); equipamentos pendentes**
