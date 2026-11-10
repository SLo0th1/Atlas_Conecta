# Ficha de fonte: FNDE (PAR, PDDE, PNAE, PNATE, SIMEC) e INEP (Censo Escolar, IDEB)

## URL(s) validada(s)
FNDE:
- `https://www.fnde.gov.br/dadosabertos/` (HTTP 200, SPA Vue "Portal de Dados Abertos"; busca web indica catálogo em `/dadosabertos/dataset` com CSV/XML/JSON e FTP para CSV de repasses PNAE; esse catálogo não foi obtido por curl)
- `https://www.gov.br/fnde/pt-br/acesso-a-informacao/dados-abertos` (HTTP 200; planos de dados abertos 2023-2025 e 2026-2028; link para dados.gov.br)
- `dadosabertos.fnde.gov.br`: não existe (erro de DNS).
- `https://www.fnde.gov.br/olinda-ide/servico/...` (OData): HTTP 404 JSON; não confirmado como serviço do FNDE.

INEP:
- `https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2024.zip` HTTP 200, `application/zip`, 33.829.396 bytes, Last-Modified 2026-07-08 (somente HEAD; arquivo NÃO baixado)
- `https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2023.zip` HTTP 200, 32.094.587 bytes, Last-Modified 2024-02-19 (HEAD)
- `https://download.inep.gov.br/educacao_basica/portal_ideb/planilhas_para_download/2023/divulgacao_municipios_2023.zip` HTTP 404 (URL por padrão antigo; inválida)
- `https://www.gov.br/inep/...` (páginas de microdados e IDEB): HTTP 403 para curl (bloqueio de acesso automatizado)
- `https://dados.gov.br/api/publico/conjuntos-dados?...`: HTTP 401 (exige token)

## Método de acesso
- FNDE: portal de dados abertos (arquivos CSV/JSON/XML por conjunto); API do portal NÃO confirmada (caminhos `/dadosabertos/api/3/action/*` devolvem o HTML da SPA, não JSON). Alternativa: catálogo no dados.gov.br (API exige token).
- INEP: arquivos ZIP/CSV estáticos em download.inep.gov.br (sem API). IDEB: planilhas no gov.br/INEP (página bloqueada ao curl) e painel Power BI em ideb.inep.gov.br (sem exportação direta confirmada); nota informativa em `download.inep.gov.br/ideb/nota_informativa_ideb_2023.pdf` (citada por busca web).
- SIMEC (obras): sistema autenticado; não testado; exigiria login (não tentado).

## Autenticação
Arquivos INEP e portal FNDE: nenhuma. API do dados.gov.br: token. SIMEC: login.

## Limites de requisição
Desconhecidos; usar download único por arquivo e cache.

## Frequência de atualização
Censo Escolar: anual (microdados do ano N publicados no ano N+1). IDEB: bienal (2023 divulgado em ago/2024, segundo fonte secundária). FNDE repasses: por ano/contínuo (não verificado).

## Campos que o projeto usará
- FNDE: município/UF, programa (PAR, PDDE, PNAE, PNATE), exercício, valor repassado, entidade executora, situação de termos de compromisso/obras.
- INEP Censo Escolar: código da escola, município, dependência administrativa, matrículas, turmas, infraestrutura.
- IDEB: município, ano, rede, anos iniciais/finais, índice, meta.

## Resultado do teste
Somente HEAD nos ZIPs do INEP (acima). Nenhum arquivo foi baixado; formato interno (delimitador, codificação) NÃO verificado. Portal FNDE: apenas carregou a SPA; lista de conjuntos não obtida. Informações sobre o catálogo FNDE vêm de busca web, não de teste direto.

## Problemas / mudanças em relação ao esperado
- Portal do FNDE é hoje SPA; a API CKAN antiga não respondeu como JSON nos caminhos testados.
- URL de IDEB por município não confirmada; gov.br retornou 403 ao curl (pode funcionar via navegador).
- OData "olinda" não existe no FNDE nos caminhos testados (é padrão do Banco Central).

## Atualização 2026-11-10: coletor `coletores/inep-educacao.ts` (Censo Escolar + IDEB)
Saída: `data/core/educacao-5208707.json` (Goiânia). Execução ~45 s. Arquivos baixados em `data/raw/inep` (ignorada pelo Git) e apagados ao final.

### URLs usadas (HTTP 200, sem autenticação, sem User-Agent especial)
- Censo Escolar 2024: `https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2024.zip` (33,8 MB; Last-Modified 2026-07-08). Dentro: `microdados_censo_escolar_2024_defeso/dados/microdados_ed_basica_2024.csv` (218 MB, ';', ISO-8859-1, 1 linha por escola, ~215 mil escolas no Brasil), além de dicionário (xlsx), questionários e leia-me. A pasta se chama "defeso"; o coletor localiza o CSV pelo padrão `dados/microdados_ed_basica_AAAA.csv`.
- Censo Escolar 2023: `https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2023.zip` (mesmo layout; ~217 mil escolas).
- IDEB 2023 (URLs descobertas por teste no próprio download.inep.gov.br; a URL antiga citada acima segue 404):
  - `https://download.inep.gov.br/ideb/resultados/divulgacao_anos_iniciais_municipios_2023.zip` (23 MB; Last-Modified 2024-08-13)
  - `https://download.inep.gov.br/ideb/resultados/divulgacao_anos_finais_municipios_2023.zip` (22,7 MB; Last-Modified 2025-01-07)
  - Cada ZIP traz .xlsx, .ods e md5. Lido o .xlsx (planilha única, cabeçalho técnico na linha 10, 1 linha por município x rede: Federal, Estadual, Municipal, Pública). Existem também os de 2021 em `.../educacao_basica/portal_ideb/planilhas_para_download/2021/divulgacao_anos_{iniciais,finais}_municipios_2021.zip` (só HEAD; não usados).
- As páginas gov.br/inep seguem dando 403 a robôs; não foram usadas nem contornadas.

### Campos reais usados
- Censo: `CO_MUNICIPIO`, `TP_SITUACAO_FUNCIONAMENTO` (1 = em atividade), `TP_DEPENDENCIA` (1 federal, 2 estadual, 3 municipal, 4 privada), `TP_LOCALIZACAO`, `IN_INF`, `IN_FUND_AI`, `IN_FUND_AF`, `IN_MED`, `IN_PROF`, `IN_EJA`, `IN_ESP`, `QT_MAT_BAS`, `QT_MAT_INF_CRE`, `QT_MAT_INF_PRE`, `QT_MAT_FUND_AI`, `QT_MAT_FUND_AF`, `QT_MAT_MED`, `QT_MAT_PROF`, `QT_MAT_EJA`, `QT_MAT_ESP`, `QT_DOC_BAS`, `QT_TUR_BAS`. Nome de escola, CNPJ, endereço e telefone existem no arquivo mas NÃO são gravados.
- IDEB (linha 10): `CO_MUNICIPIO`, `REDE`, `VL_OBSERVADO_<ano>` (2005-2023), `VL_PROJECAO_<ano>` (metas 2007-2021), `VL_INDICADOR_REND_<ano>` (rendimento/aprovação), `VL_NOTA_MEDIA_<ano>` (Saeb padronizada).

### Números obtidos (Goiânia, 5208707)
- Escolas em atividade, Censo 2024: **830** (municipal 308, estadual 107, federal 3, privada 412); 2023: 817 (323 / 105 / 3 / 386). Municipais rurais: 3.
- Matrículas da educação básica 2024: 278.377 (municipal 102.505; estadual 62.277; federal 2.205; privada 111.390); creche 23.259, pré-escola 31.334, fundamental anos iniciais 89.385, anos finais 69.989, médio 44.846, profissional 11.551, EJA 11.208, especial 10.543. Docentes (`QT_DOC_BAS`) 16.007 e turmas 12.302 (soma por escola; docente em mais de uma escola conta em cada uma).
- IDEB 2023 anos iniciais: rede municipal 6,5 (2021: 5,9; meta 2021: 6,1), estadual 6,5, pública 6,5. Anos finais: municipal 5,4 (2021: 5,1; meta 2021: 4,9), estadual 5,6, pública 5,6. Federal sem valor em 2023 (nulo).

### Limitações
- Matrículas por etapa vêm de `QT_MAT_*` (matrícula inicial); EJA, profissional e especial sobrepõem-se a outras etapas (não somar). `IN_ESP`/`QT_MAT_ESP` incluem educação especial em classes comuns, não só escolas exclusivas.
- `escolas_por_etapa` conta escolas que declaram oferecer a etapa (uma escola entra em várias).
- IDEB: séries 2005-2023 e metas até 2021; sem IDEB do ensino médio nem por escola nesta coleta; "-"/ND viram null.
- População em idade escolar (SIDRA/Censo 2022) não coletada; fica para etapa futura. Censo 2025 não verificado.
- O servidor do INEP derrubou conexões (ECONNRESET) ocasionalmente; há retentativas no download e no HEAD. O XLSX é lido sem biblioteca (XML em fluxo); frágil se o INEP mudar o layout (cabeçalho técnico esperado na linha 10, município na coluna B).

**Data da última validação: 2026-11-10**
**Status: PARCIAL** (INEP Censo e IDEB municipal coletados; FNDE sem endpoint estruturado confirmado)
