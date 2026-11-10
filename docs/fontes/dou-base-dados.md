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

## Atualização 2026-11-09 — captura do dono (navegador, página oficial "Base de Dados")
O WebFetch e o curl não conectam a `in.gov.br` (socket hang up), mas a página abre no navegador do dono. O que ela informa (lido em capturas de tela):
- **Formato:** XML compactado em **ZIP**, organizado como **Ano > Mês > arquivo.zip**.
- **Nome dos arquivos (padrão mensal):** `S01`/`S02`/`S03` (Seção 1, 2 ou 3) + **mês (2 dígitos) + ano (4 dígitos)**. Ex.: `S01102026.zip` = Seção 1 de outubro/2026. Seção 1 = atos normativos de interesse geral (leis, decretos, resoluções, **portarias**); Seção 2 = atos de pessoal; Seção 3 = extratos de contratos, convênios, editais, licitações e comunicados.
- **Exceção de outubro/2026:** arquivos **atualizados diariamente**, com o nome seguido de `HoraMinutoSegundo` (HHmmss). Estrutura de pastas: `Dados Abertos/2026/10/20261021/D01, D01E, D02, D02E, D03`.
- O conteúdo em XML **não substitui** a versão certificada (PDF). O **dicionário de dados será divulgado em data a definir** (campos do XML ainda não documentados).
- Também há publicação em `dados.gov.br` (organização `imprensa-nacional-in`), atualizada conforme o Plano de Dados Abertos do órgão.
- A página tem seletores de **ano** e **mês**; para outubro/2026 aparecem `S01102026.zip`, `S03102026.zip` e `S02102026.zip`.
- **Ainda não confirmado:** o endereço (URL) real de download de cada ZIP, o tamanho e se exige algum cadastro. Falta o dono copiar o endereço de um link (clique direito → "Copiar endereço do link").
- Uso para o FNAS: portarias da SNAS ficam na **Seção 1**; filtrar por órgão "Ministério do Desenvolvimento e Assistência Social" e por "Fundo Nacional de Assistência Social"/"Goiânia".
**Status: PARCIAL** (estrutura conhecida; URL e campos do XML a confirmar).
