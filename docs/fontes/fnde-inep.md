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

**Data da última validação: 2026-11-09**
**Status: PARCIAL** (INEP Censo OK por arquivo; FNDE e IDEB sem endpoint estruturado confirmado)
