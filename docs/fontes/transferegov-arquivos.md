# Ficha de fonte: Transferegov – arquivos abertos (ex-SICONV, módulo Discricionárias e Legais)

## URL(s) validada(s)
- **Atual (válida):** `https://api-publica.transferegov.gestao.gov.br/downloads/dadosgov/<arquivo>.zip`
- **Listagem dos arquivos (XML estilo Azure Blob):** `https://api-publica.transferegov.gestao.gov.br/downloads/dadosgov/?restype=container&comp=list` (HTTP 200, 65 arquivos)
- Página de download (HTML, carrega a listagem acima por JavaScript): `https://api-publica.transferegov.gestao.gov.br/downloads`
- **Obsoletas (HTTP 404 em 2026-11-09):** `https://repositorio.dados.gov.br/seges/detru/` e `.../siconv_convenio.csv.zip`, `.../siconv.zip`, `.../siconv_convenio.zip`, `.../siconv_emenda.csv.zip`. A raiz `repositorio.dados.gov.br/` responde 200 vazio (Last-Modified 2017). `portal.convenios.gov.br` não resolve DNS.
- `dados.gov.br/dados/conjuntos-dados/siconv` responde 200, mas é página em JavaScript; `dados.gov.br/api/publico/...` retorna 401 (exige token). Não usar como fonte.
- Páginas oficiais sobre a migração: `https://www.gov.br/transferegov/pt-br/ferramentas-gestao/dados-abertos` e `.../api-de-dados-abertos-transferegov.br` (esta menciona "novo repositório de dados para os arquivos .csv" de Discricionárias e Legais).

## Método de acesso
Arquivo (download HTTP direto de `.zip`, cada um com 1 CSV dentro). Suporta `Range` (Accept-Ranges: bytes).

## Autenticação
Nenhuma.

## Limites de requisição
Nenhum documentado. Sem bloqueio observado em ~10 requisições espaçadas. Recomendação: 1 arquivo por vez, usando Last-Modified/ETag para evitar baixar de novo.

## Frequência de atualização
Aparentemente diária: os 65 arquivos tinham Last-Modified de 2026-11-09 entre 11:12 e 11:13 GMT (dia da validação). Frequência oficial não confirmada em documento.

## Controle de versão / integridade
A listagem XML traz por arquivo `Content-Length`, `Last-Modified` e, para os arquivos menores, `Content-MD5` (base64). Os arquivos grandes (acima de ~70 MB) vêm SEM MD5 na listagem (ex.: siconv_pagamento, siconv_proposta, siconv_plano_aplicacao_detalhado). O download devolve também `ETag`. Verificado: o MD5 do `siconv_convenio.zip` baixado coincide com o cabeçalho (`VJWBdc8sh9+kuSA0tR4m6Q==`).

## Arquivos relevantes ao projeto (tamanho do zip em 2026-11-09)
| Tema | Arquivo | Tamanho |
|---|---|---|
| Convênio | siconv_convenio.zip | 18,5 MB (CSV 71 MB) |
| Proposta | siconv_proposta.zip | 206 MB |
| Programa | siconv_programa.zip | 11,1 MB (CSV 353 MB) |
| Programa x proposta / proponentes | siconv_programa_proposta.zip / siconv_programa_proponentes.zip | 6,5 MB / 2,5 MB |
| Empenho | siconv_empenho.zip | 23,6 MB |
| Empenho x desembolso | siconv_empenho_desembolso.zip | 4,0 MB |
| Desembolso | siconv_desembolso.zip | 16,9 MB |
| Pagamento | siconv_pagamento.zip | 374,7 MB |
| Emenda | siconv_emenda.zip | 8,3 MB (CSV 31,5 MB) |
| Plano de aplicação detalhado | siconv_plano_aplicacao_detalhado.zip | 293,5 MB |
| Termo aditivo | siconv_termo_aditivo.zip | 61,5 MB |
| Proponentes | siconv_proponentes.zip | 6,4 MB |
| Outros úteis | siconv_historico_situacao (104 MB), siconv_cronograma_desembolso (19,7 MB), siconv_proposta_cancelada (10,7 MB), apoiadores_emendas_programas (6,8 MB) | |

Total: 65 arquivos (inclui módulo empresas, PAC, obras, licitação, contratos). `data_carga_siconv.zip` e `data_carga_mobile.zip` têm só 178 bytes (provável marcador de data de carga; conteúdo não inspecionado).

## Formato
CSV separado por `;`, com BOM no início, cabeçalho na 1ª linha. Codificação interna não confirmada (o BOM sugere UTF-8; tratar com cuidado). Formato das colunas de data não verificado.

## Campos que o projeto usará (cabeçalhos lidos de fato)
- **convenio:** NR_CONVENIO, ID_PROPOSTA, SIT_CONVENIO, SUBSITUACAO_CONV, DIA_ASSIN_CONV, DIA_PUBL_CONV, DIA_INIC_VIGENC_CONV, DIA_FIM_VIGENC_CONV, DIA_LIMITE_PREST_CONTAS, VL_GLOBAL_CONV, VL_REPASSE_CONV, VL_CONTRAPARTIDA_CONV, VL_EMPENHADO_CONV, VL_DESEMBOLSADO_CONV, VL_SALDO_CONTA, QTD_TA, QTD_PRORROGA (há mais colunas: NR_PROCESSO, UG_EMITENTE, INSTRUMENTO_ATIVO...).
- **proposta:** ID_PROPOSTA, UF_PROPONENTE, MUNIC_PROPONENTE, **COD_MUNIC_IBGE**, IDENTIF_PROPONENTE (CNPJ), NM_PROPONENTE, COD_ORGAO_SUP, DESC_ORGAO_SUP, COD_ORGAO, DESC_ORGAO, MODALIDADE, SIT_PROPOSTA, OBJETO_PROPOSTA, VL_GLOBAL_PROP, VL_REPASSE_PROP, VL_CONTRAPARTIDA_PROP, DIA_INIC_VIGENCIA_PROPOSTA, DIA_FIM_VIGENCIA_PROPOSTA.
- **programa:** ID_PROGRAMA, COD_PROGRAMA, NOME_PROGRAMA, SIT_PROGRAMA, COD_ORGAO_SUP_PROGRAMA, DATA_DISPONIBILIZACAO, ANO_DISPONIBILIZACAO, DT_PROG_INI_RECEB_PROP, DT_PROG_FIM_RECEB_PROP, DT_PROG_INI_EMENDA_PAR, DT_PROG_FIM_EMENDA_PAR, DT_PROG_INI_BENEF_ESP, DT_PROG_FIM_BENEF_ESP, MODALIDADE_PROGRAMA, NATUREZA_JURIDICA_PROGRAMA, UF_PROGRAMA, ACAO_ORCAMENTARIA.
- **empenho:** ID_EMPENHO, NR_CONVENIO, NR_EMPENHO, DATA_EMISSAO, DESC_SITUACAO_EMPENHO, UG_EMITENTE, FONTE_RECURSO, NATUREZA_DESPESA, PTRES, VALOR_EMPENHO.
- **desembolso:** ID_DESEMBOLSO, NR_CONVENIO, DATA_DESEMBOLSO, ANO_DESEMBOLSO, MES_DESEMBOLSO, VL_DESEMBOLSADO.
- **pagamento:** NR_MOV_FIN, NR_CONVENIO, IDENTIF_FORNECEDOR, NOME_FORNECEDOR, TP_MOV_FINANCEIRA, DATA_PAG, VL_PAGO.
- **emenda:** ID_PROPOSTA, COD_PROGRAMA_EMENDA, NR_EMENDA, NOME_PARLAMENTAR, BENEFICIARIO_EMENDA, IND_IMPOSITIVO, TIPO_PARLAMENTAR, VALOR_REPASSE_PROPOSTA_EMENDA, VALOR_REPASSE_EMENDA.
- **plano_aplicacao_detalhado:** ID_PROPOSTA, MUNICIPIO, NATUREZA_AQUISICAO, DESCRICAO_ITEM, TIPO_DESPESA_ITEM, NATUREZA_DESPESA, QTD_ITEM, VALOR_UNITARIO_ITEM, VALOR_TOTAL_ITEM.
- **termo_aditivo:** NR_CONVENIO, ID_SOLICITACAO, NUMERO_TA, TIPO_TA, VL_GLOBAL_TA, VL_REPASSE_TA, VL_CONTRAPARTIDA_TA, DT_ASSINATURA_TA, DT_INICIO_TA, DT_FIM_TA.

Chaves de ligação: ID_PROPOSTA (proposta, emenda, plano de aplicação) e NR_CONVENIO (convênio, empenho, desembolso, pagamento, aditivo). Filtro por município: COD_MUNIC_IBGE em `proposta` (arquivo nacional único; filtrar no coletor).

## Resultado do teste
- GET na listagem XML: HTTP 200, 65 blobs.
- Download completo de siconv_convenio.zip (HTTP 200, 18.501.744 bytes), siconv_emenda.zip e siconv_programa.zip; cabeçalho dos CSVs lido.
- Para proposta, pagamento, plano_aplicacao_detalhado, empenho, desembolso e termo_aditivo: baixados só os primeiros 60 KB (Range) e descompactado o início, o que bastou para ler o cabeçalho. O arquivo completo NÃO foi baixado.
- Nenhuma amostra de dados gravada; nenhum arquivo salvo no projeto (downloads ficaram na pasta temporária da sessão).

## Problemas / mudanças em relação ao esperado
- O endereço `repositorio.dados.gov.br/seges/detru/` está MORTO (404). Os nomes continuam no padrão `siconv_*.zip`, mas o caminho mudou e não há mais `.csv.zip`.
- Arquivos grandes sem MD5 na listagem: usar ETag/Last-Modified/Content-Length para detectar mudança.
- Volume: vários arquivos de centenas de MB. A coleta deve ser seletiva e incremental.
- Este é o módulo "Discricionárias e Legais". A página oficial informa que a API desse módulo está em construção em entregas (Atos Preparatórios entregue em out/2026; Instrumentos previsto 01/11/2026 a 28/02/2027; Execução Financeira 03/2027 a 06/2027). Os CSVs seguem como fonte principal de convênios por ora, mas podem ser substituídos; data de desligamento não confirmada.
- O caminho `/downloads/dadosgov` foi descoberto pelo JavaScript da página `/downloads`, não por documentação estática; pode mudar sem aviso.

**Data da última validação: 2026-11-09**

**Status: OK**
