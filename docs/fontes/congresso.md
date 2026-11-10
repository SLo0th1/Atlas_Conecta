# Dados abertos do Congresso - Câmara e Senado

## URL(s) validada(s)
- Senado: https://legis.senado.leg.br/dadosabertos/senador/lista/atual?uf=GO - HTTP 200 (JSON com `Accept: application/json`; sem esse cabeçalho o padrão é XML).
- Câmara: https://dadosabertos.camara.leg.br/api/v2/deputados?siglaUf=GO&itens=2 - HTTP 504 "upstream request timeout" em 6 tentativas espaçadas (curl e WebFetch, em momentos diferentes), inclusive `/partidos` e `/referencias/...`. Não consegui testar. O endpoint é o documentado publicamente (`/api/v2/deputados`, parâmetros `siglaUf`, `siglaPartido`, `itens`, `pagina`, `ordenarPor`), mas não está confirmado por teste hoje.

## Método de acesso
API REST (JSON/XML). Câmara: `/api/v2/deputados` (campos usuais: id, nome, siglaPartido, siglaUf, idLegislatura, uriPartido, email). Senado: `/dadosabertos/senador/lista/atual` (+ filtro `uf`).

## Autenticação
Nenhuma (nenhuma chave exigida no Senado; Câmara não testada).

## Limites de requisição
Não documentados; nenhum cabeçalho de rate limit visto no Senado (resposta com `cache-control: max-age=900`, ou seja, cache de 15 min). Câmara: paginação por `itens` (máx. 100 pela documentação, a confirmar).

## Frequência de atualização
Tempo real/diária conforme mudanças de mandato; cache do Senado de 15 min.

## Campos que o projeto usará
Senado: CodigoParlamentar, NomeParlamentar, SiglaPartidoParlamentar, UfParlamentar, Bloco, Mandato (legislatura, suplentes). Câmara: id, nome, siglaPartido, siglaUf, casa = Câmara.

## Resultado do teste
- Senado, uf=GO -> 200, JSON `ListaParlamentarEmExercicio.Parlamentares.Parlamentar[]`. Amostra (dados públicos de cargo): NomeParlamentar "Jorge Kajuru", SiglaPartidoParlamentar "PSB", UfParlamentar "GO", legislatura 57 (2023-02-01 a 2027-01-31). Registro traz também e-mail institucional e telefones de gabinete (dados públicos; não gravados).
- Câmara -> 504 em todas as tentativas.

## Problemas/mudanças em relação ao esperado
- Câmara instável/indisponível nesta data; repetir a validação e implementar retry com backoff no coletor.
- Senado: use sempre `Accept: application/json`.
- Atenção: legislatura 57 termina em 2027-01-31; mudança de parlamentares após a eleição de 2026.

**Data da última validação: 2026-11-09**
**Status: PARCIAL**
