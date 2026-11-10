# Fonte: DOU, Base de Dados (Dados Abertos da Imprensa Nacional)

Data da última validação: 2026-11-09
Status: INACESSÍVEL (página oficial não pôde ser lida; só há confirmações indiretas)

## URLs validadas

| URL | Resultado em 2026-11-09 |
|---|---|
| https://www.in.gov.br/acesso-a-informacao/dados-abertos/base-de-dados | NÃO confirmada. WebFetch retornou "socket hang up" (3 tentativas, incluindo a variante /web/guest/). Causa não identificada (bloqueio de robôs ou de origem, ou instabilidade). Não foi contornado. |
| https://github.com/Imprensa-Nacional | OK. Lista um único repositório público, `inlabs` (Python). |
| https://github.com/Imprensa-Nacional/inlabs | OK (README). |
| https://inlabs.in.gov.br | Citado no README; não acessado (em manutenção em 2026-11-09, segundo o dono). |

Padrão Ano > Mês > arquivo ZIP/XML, URL real dos arquivos, tamanho mensal/diário e existência de listagem navegável: NÃO CONFIRMADOS. Nenhum endpoint de arquivo foi inventado.

## Método

- INLABS (confirmado pelo README oficial): serviço gratuito desde 01/01/2020 com as edições completas do DOU em PDF e XML. Guarda cerca de 4 meses de dados; edições mais antigas ficam nas coleções de Dados Abertos (a página "Base de Dados"). O README cita a página de Dados Abertos mas não dá a URL dos arquivos.
- Automação: o repositório oficial traz scripts de exemplo em Bash e Python 3. Não consegui ler os scripts (caminhos testados deram 404), então login, URL de download e nome dos arquivos continuam não confirmados. Próximo passo: o dono ou outra sessão listar o repositório `Imprensa-Nacional/inlabs` pelo `gh` ou `git clone`.

## Autenticação

- INLABS: exige cadastro (login) pelo que o README indica para uso no navegador; detalhes do login automatizado não confirmados.
- Página Base de Dados: não confirmado se é pública.

## Tamanho

Não confirmado.

## Estrutura do XML

Não confirmada. O README diz apenas que o XML traz as matérias publicadas. Campos esperados (tipo de ato, órgão, data, título, texto, URL) e se o texto completo vem no XML: NÃO VERIFICADOS. Validar baixando um arquivo de amostra.

## API / busca pública oficial

- Não confirmada. Uma pesquisa web apontou apenas que a busca do DOU fica em pesquisa.in.gov.br / in.gov.br/consulta (fonte secundária, Dryad). Não consta permissão oficial de uso automatizado; não testado.

## Como filtrar SNAS/FNAS (plano, a validar)

1. Baixar o XML da Seção 1 dos dias/meses desejados.
2. Filtrar por órgão contendo "Ministério do Desenvolvimento e Assistência Social" e unidade "Secretaria Nacional de Assistência Social".
3. Filtrar o texto por "Fundo Nacional de Assistência Social" e "transferência", e procurar "Goiânia" (normalizar acentos).
4. Alvo de teste: Portaria SNAS nº 92, de 10/06/2026.
Formato da lista de municípios e valores (tabela no texto ou anexo/PDF): NÃO CONFIRMADO.

## Limitações

- Página oficial inacessível por WebFetch nesta data; curl do Git Bash também não conecta a in.gov.br.
- Nada foi baixado; nenhuma amostra de XML foi examinada.
- INLABS em manutenção em 2026-11-09 e com janela de apenas ~4 meses; a portaria de 10/06/2026 já pode estar fora da janela, devendo vir da base de Dados Abertos.

## Fontes consultadas

- https://github.com/Imprensa-Nacional
- https://github.com/Imprensa-Nacional/inlabs
- https://datadryad.org/dataset/doi:10.15146/R3D96N (secundária)
