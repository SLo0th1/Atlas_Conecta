# Ficha de fonte: IBGE (servicodados.ibge.gov.br)

## URL(s) validada(s)
Base: `https://servicodados.ibge.gov.br` (todas retornaram HTTP 200 em 2026-11-09):
- `/api/v1/localidades/municipios/5208707` (Goiânia; JSON com microrregião, mesorregião, UF, região imediata/intermediária)
- `/api/v1/localidades/municipios?orderBy=nome` (todos os municípios, ~2,4 MB)
- `/api/v1/localidades/estados` (27 UFs) e `/api/v1/localidades/estados/52/municipios?view=nivelado` (municípios de GO, formato plano)
- `/api/v1/localidades/regioes-metropolitanas` (lista com UF e municípios membros, ~90 KB)
- `/api/v3/agregados/6579/periodos` (períodos disponíveis da tabela 6579; cada período traz data de `modificacao`)
- `/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N6[5208707]` (população residente estimada; `-1` = período mais recente)
- `/api/v3/agregados/5938/periodos/-1/variaveis/37?localidades=N6[5208707]` (PIB a preços correntes, mil reais)
- `/api/v3/malhas/municipios/5208707?formato=application/vnd.geo+json` (GeoJSON do município, ~11 KB)
- `/api/v3/malhas/municipios/5208707/metadados` (centroide, área)
- `/api/v3/agregados?pesquisa=6579` respondeu 200, mas ignora o filtro e devolve o catálogo inteiro (~1,9 MB); não usar para busca.
- `/api/v3/agregados/6579` (sem sufixo) responde 404: usar sempre `/metadados`, `/periodos` ou `/variaveis`.

## Método de acesso
API REST pública (JSON; malhas também em GeoJSON/SVG/TopoJSON via parâmetro `formato`).

## Autenticação
Nenhuma.

## Limites de requisição
Não documentados no que foi testado; nenhuma resposta 429 em ~15 requisições espaçadas. Recomenda-se cache local (localidades mudam raramente) e uma requisição por vez.

## Frequência de atualização
Localidades: raramente (mudanças de divisão territorial). População estimada: anual (a série retornou o período 2026; a data de referência oficial do IBGE é 1º de julho do ano). PIB municipal: anual, com defasagem de ~2 anos (último retornado: 2023).

## Campos que o projeto usará
- Município: `id` (código IBGE de 7 dígitos), `nome`, `microrregiao`, `regiao-imediata`, UF (`sigla`, `id`), região.
- Região metropolitana: `id`, `nome`, `municipios[]`.
- População estimada: valor, ano do período, id/nome da localidade.
- PIB: valor (mil reais), ano.
- Malha: geometria (opcional), centroide e área.

## Resultado do teste
Executado com curl, um pedido por vez, pausa de 1 s.
- Município 5208707: HTTP 200, `{"id":5208707,"nome":"Goiânia", ... "UF":{"id":52,"sigla":"GO"} ...}`.
- População estimada: HTTP 200, `"variavel":"População residente estimada","unidade":"Pessoas"`, `"serie":{"2026":"1511709"}`. A API devolve o ANO do período (2026), não a data exata de referência; o coletor deve registrar 1º/jul como convenção do IBGE.
- PIB: HTTP 200, `"serie":{"2023":"75780846"}` (mil reais).
- Malha: HTTP 200, `FeatureCollection` com polígono; metadados: centroide (-49.2738, -16.6436), área 729,296 km2.

## Problemas / mudanças em relação ao esperado
- Não existe endpoint de "capitais" em /localidades. A lista das 27 capitais NÃO foi obtida pela API; precisa de tabela fixa mantida pelo projeto (códigos IBGE das capitais). O teste "lista das capitais" não foi atendido diretamente.
- Em Bash/curl, colchetes em `localidades=N6[...]` exigem `curl -g`; sem isso a requisição é mal interpretada.
- A tabela 6579 só devolve a estimativa quando o período existe; use `-1` para o mais recente.

**Data da última validação: 2026-11-09**
**Status: OK**
