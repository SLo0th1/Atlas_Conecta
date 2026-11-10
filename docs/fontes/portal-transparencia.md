# Ficha de fonte: Portal da Transparência – API de dados (CGU)

## URL(s) validada(s)
- Base: `https://api.portaldatransparencia.gov.br/api-de-dados/`
- Swagger UI: `https://api.portaldatransparencia.gov.br/swagger-ui/index.html` (HTTP 200)
- OpenAPI JSON: `https://api.portaldatransparencia.gov.br/v3/api-docs` (HTTP 200; "API REST do Portal da Transparência do Governo Federal", v1.0)
- Cadastro da chave: `http://www.portaldatransparencia.gov.br/api-de-dados/cadastrar-email` (indicado pelo próprio OpenAPI e pelo erro da API; página não acessada)

## Método de acesso
API REST (JSON), paginada pelo parâmetro obrigatório `pagina` (começa em 1).

## Autenticação
Chave obrigatória no cabeçalho `chave-api-dados` (securityScheme `apiKey` no OpenAPI), obtida por cadastro de e-mail no portal. Se o cadastro usa login gov.br: NÃO verificado. Sem chave a API devolve HTTP 401 com "Chave de API não informada!".

## Limites de requisição
Não constam no OpenAPI. Informação de fonte NÃO oficial (README de biblioteca de terceiros, não verificado): 400 req/min das 06h às 24h e 700 req/min das 00h às 06h; APIs "restritas" a 180 req/min. Confirmar na documentação oficial após obter a chave.

## Frequência de atualização
Não documentada no OpenAPI. Não confirmada.

## Rotas relevantes (lidas do OpenAPI)
- `/api-de-dados/convenios`, filtros: dataInicial, dataFinal, dataUltimaLiberacaoInicial/Final, dataVigenciaInicial/Final, convenente, tipoConvenente, numero, numeroOriginal, codigoOrgao, uf, **codigoIBGE**, situacao, tipoInstrumento, funcao, subfuncao, valorLiberadoDe/Ate, valorTotalDe/Ate, **pagina** (obrigatório). Também `/convenios/tipo-instrumento`, `/convenios/numero`, `/convenios/numero-processo`, `/convenios/numero-original`, `/convenios/id`.
- `/api-de-dados/emendas`, filtros: codigoEmenda, numeroEmenda, nomeAutor, tipoEmenda, ano, codigoFuncao, codigoSubfuncao, pagina. NÃO há filtro por município ou UF. `/emendas/documentos/{codigo}` detalha documentos.
- `/api-de-dados/ceis` (e `/ceis/{id}`) e `/api-de-dados/cnep` (e `/cnep/{id}`), filtros: codigoSancionado (CNPJ/CPF), nomeSancionado, orgaoSancionador, dataInicialSancao, dataFinalSancao, pagina.
- `/api-de-dados/cepim` (e `/cepim/{id}`), filtros: cnpjSancionado, nomeSancionado, ufSancionado, orgaoEntidade, pagina.
- Transferências por município: o OpenAPI lista apenas rotas de benefícios sociais "por-municipio" (bolsa-familia, bpc, auxilio-*, peti, safra, seguro-defeso) e `/coronavirus/transferencias`. NÃO foi encontrada rota genérica de transferências constitucionais/voluntárias por município. A tentativa em `/api-de-dados/transferencias` sem chave retornou 401 (inconclusivo, pois a rota não está no OpenAPI).

## Campos que o projeto usará
Convênios (filtro codigoIBGE=5208707: situação, valores liberado/total, vigência, órgão, convenente), emendas (código, autor, ano, valores) e CEIS/CNEP/CEPIM (checagem de sancionados por CNPJ). Nomes exatos dos campos de resposta NÃO verificados (sem chave).

## Resultado do teste
- Swagger UI e v3/api-docs: HTTP 200.
- `GET /api-de-dados/convenios?codigoIBGE=5208707&pagina=1` sem chave: HTTP 401, `{"Erro na API":"Chave de API não informada! ..."}`.
- `GET /api-de-dados/transferencias?pagina=1` sem chave: HTTP 401.
- `HEAD /api-de-dados/ceis?pagina=1`: HTTP 403 (CloudFront; HEAD bloqueado ou não suportado).
- NÃO testado: nenhuma consulta autenticada, formato das respostas, paginação real, limite real.

## Problemas / mudanças em relação ao esperado
- Todo uso exige chave pessoal; não tentamos contornar. Pendente do dono: gerar a chave e guardá-la em variável de ambiente, nunca no repositório.
- Para convênios em carga completa, os arquivos abertos (ficha `transferegov-arquivos`) são preferíveis; esta API serve a consultas pontuais, emendas e CEIS/CNEP/CEPIM.
- Emendas sem filtro por município: será preciso cruzar com os dados do Transferegov (emenda por proposta/convênio).

**Data da última validação: 2026-11-09**

**Status: OK** (chave válida testada em 2026-11-09 via GitHub Actions; ver atualização no fim)

## Atualização 2026-11-09 — chave testada e estrutura real (GitHub Actions)
Teste executado no GitHub Actions (workflows `testar-portal-transparencia` e `explorar-portal-transparencia`; execuções 42723587297 e 42726029862), com o segredo `PORTAL_TRANSPARENCIA_CHAVE`. A chave nunca é impressa nem gravada.

- `GET /api-de-dados/convenios?codigoIBGE=5208707&pagina=1` → **HTTP 200**, **15 itens por página** (paginar com `pagina`).
- `GET /api-de-dados/ceis?codigoSancionado=<CNPJ>&pagina=1` → **HTTP 200**.
- **Campos reais de cada convênio (resposta):** `id`; datas `dataReferencia`, `dataInicioVigencia`, `dataFinalVigencia`, `dataPublicacao`, `dataUltimaLiberacao`, `dataConclusao`; `dimConvenio.{codigo,objeto,numero}`; `situacao`; `convenente.{id,cnpjFormatado,nome,razaoSocialReceita,nomeFantasiaReceita,tipo,numeroInscricaoSocial}`; `municipioConvenente.{codigoIBGE,nomeIBGE,uf.sigla,...}`; `orgao.{nome,sigla,codigoSIAFI,cnpj,orgaoMaximo.*}`; `unidadeGestora.*`; `subfuncao.{codigoSubfuncao,funcao.codigoFuncao,funcao.descricaoFuncao}`; `tipoInstrumento.{id,codigo,descricao}`; valores `valor`, `valorLiberado`, `valorContrapartida`, `valorDaUltimaLiberacao` (números); `numeroProcesso`.
- Uso no projeto: **cruzar e validar** o Transferegov (valor pactuado × liberado) e identificar o órgão concedente. `convenente.numeroInscricaoSocial` traz CPF/CNPJ: **não gravar nem exibir CPF** (LGPD); guardar só CNPJ de pessoa jurídica.
- Ainda não verificado: limites de requisição por minuto (valores da ficha vieram de fonte de terceiros) e a rota de emendas por município (não existe filtro de município em `/emendas`).
