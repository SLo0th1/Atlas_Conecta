# Ficha de fonte: SICONFI – API de dados abertos do Tesouro (RREO, RGF, DCA)

## URL(s) validada(s)
- Base: `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/` (a raiz retorna 404; só os endpoints respondem)
- Endpoints testados: `/rreo`, `/rgf`, `/dca`, `/entes`, `/extrato_entregas`
- Documentação: `https://apidatalake.tesouro.gov.br/docs/siconfi/` (HTTP 200; conteúdo não lido em detalhe)
- Observação: o endpoint `/extrato_entrega` (singular) retorna 404; o correto é `/extrato_entregas`.

## Método de acesso
API REST (Oracle ORDS), JSON. Sem robô.

## Autenticação
Nenhuma.

## Limites de requisição
Não documentados. Paginação ORDS: resposta traz `hasMore`, `limit` (5000 observado nesses endpoints; `/entes` devolveu 2000 com `hasMore: true`), `offset`, `count`. Para continuar, usar `offset`. Testadas poucas requisições espaçadas, sem bloqueio.

## Frequência de atualização
Depende das entregas dos municípios (RREO bimestral, RGF quadrimestral/semestral, DCA anual). Não há data de atualização global documentada; `/extrato_entregas` informa `data_status` por entrega.

## Parâmetros que funcionaram (município 5208707)
- RREO: `an_exercicio`, `in_periodicidade` (B), `nr_periodo`, `co_tipo_demonstrativo` (RREO), `no_anexo` (ex.: `RREO-Anexo 01`), `co_esfera` (M), `id_ente`.
- RGF: `an_exercicio`, `in_periodicidade` (Q), `nr_periodo`, `co_tipo_demonstrativo` (RGF), `no_anexo` (`RGF-Anexo 01`), `co_esfera`, `co_poder` (E), `id_ente`.
- DCA: `an_exercicio`, `no_anexo` (ex.: `DCA-Anexo I-C`), `id_ente`.
- Extrato: `id_ente`, `an_referencia`.

## Campos que o projeto usará (lidos nas respostas)
- RREO: exercicio, periodo, periodicidade, instituicao, cod_ibge, uf, populacao, anexo, esfera, rotulo, coluna, cod_conta, conta, valor.
- RGF: os mesmos, mais co_poder.
- DCA: exercicio, instituicao, cod_ibge, uf, anexo, rotulo, coluna, cod_conta, conta, valor, populacao.
- extrato_entregas: exercicio, cod_ibge, instituicao, entregavel, periodo, periodicidade, status_relatorio, data_status, forma_envio, tipo_relatorio.
- entes: cod_ibge, ente, capital, regiao, uf, esfera, exercicio, populacao, cnpj.
Formato "longo": uma linha por conta e coluna; o coletor precisa agregar/pivotar.

## Resultado do teste
- RREO 2024, bimestre 6, Anexo 01, id_ente=5208707: HTTP 200, `count` 526 itens, `hasMore` false. Amostra: instituição "Prefeitura Municipal de Goiânia - GO", cod_ibge 5208707, população 1.414.483 (valor de população varia por exercício: 1.555.626 no DCA 2023).
- RGF 2024, quadrimestre 3, Anexo 01, poder E: HTTP 200 (itens retornados; contagem não registrada).
- DCA 2023, Anexo I-C: HTTP 200 (itens retornados; contagem não registrada).
- `extrato_entregas?id_ente=5208707&an_referencia=2024`: HTTP 200 (entregas incluindo a Câmara de Vereadores de Goiânia; o filtro por ente funcionou).
- `entes?id_ente=5208707`: HTTP 200, mas o filtro id_ente foi IGNORADO (devolveu entes de SP); nas primeiras 2000 linhas de `/entes` não apareceu 5208707 (paginar com offset ou filtrar no cliente). O parâmetro correto de filtro em `/entes` não foi descoberto.
- Valores monetários não reproduzidos nesta ficha.

## Problemas / mudanças em relação ao esperado
- Os links `self`/`next` das respostas apontam para um host interno (`host-5hrds-scan.prosubnet.vcndados.oraclevcn.com/ords/cdwhprd/...`): NÃO seguir esses links; montar as URLs com o `offset` na base pública.
- A raiz `/ords/siconfi/tt/` dá 404 (esperado para ORDS).
- Nomes de anexos exigem grafia exata (espaços; `%20`). Lista completa de anexos disponíveis não levantada.
- Ressalva de qualidade: dados são autodeclarados pelos entes e podem ser retificados; guardar `data_status`/versão.

**Data da última validação: 2026-11-09**

**Status: OK**

## Atualização 2026-11-09 — coletor `coletores/siconfi.ts`
Detecta o último RREO (bimestre) e RGF (quadrimestre) **homologados** (`status_relatorio = HO`) da Prefeitura em `/extrato_entregas` e lê o Anexo 01 de cada um (RREO: `ReceitasExcetoIntraOrcamentarias`, `ReceitasCorrentes`; RGF: `ReceitaCorrenteLiquidaLimiteLegal`, `ReceitaCorrenteLiquidaAjustada`, `DespesaComPessoalTotal`, limites máximo, prudencial e de alerta). Teste em 2026-11-09 (Goiânia): RREO 2026/B4 e RGF 2026/Q2; despesa com pessoal **45,58% da RCL ajustada** (limite máximo 54%, alerta 48,6%) — "abaixo do limite de alerta"; receita realizada até o bimestre R$ 7,07 bi (68,45% da previsão). Os links `next` das respostas são ignorados; a paginação usa `offset`. A regra de **capacidade de contrapartida** ainda será definida com o dono; hoje o arquivo só guarda os indicadores de apoio.
