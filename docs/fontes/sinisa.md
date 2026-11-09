# SINISA (sucessor do SNIS) - Ministério das Cidades

## URL(s) validada(s)
- https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa - HTTP 200 (página institucional; a URL antiga `/assuntos/saneamento/snis` redireciona para ela).
- https://indicadores-sinisa-2025.cidades.gov.br/ - HTTP 200 (aplicação web Laravel/Inertia, painel "Indicadores SINISA 2025"; rotas vistas no HTML: `/indicador`, `/situacao-municipio`, `/indicadores-localidade`; também `/login` e `/admin`, de uso interno).
- https://app4.cidades.gov.br/serieHistorica/ - HTTP 200 (aplicativo de série histórica SNIS).
- https://sinisa.cidades.gov.br/ - HTTP 200, redireciona para `/entrar/` (login para prestadores/municípios informarem dados).
- https://dados.gov.br/dados/organizacoes/visualizar/ministerio-das-cidades - HTTP 200 (conteúdo carregado por JS; não listei conjuntos).
- Não validado: painel Power BI e hosts "hmg" (homologação) citados na página.

## Método de acesso
Painéis web interativos (robô/scraping só se não houver outra via). A página oficial não menciona download de planilhas nem API. Não confirmei CSV/API de dados abertos específicos do SINISA. Os endpoints internos do painel (`/indicadores-localidade` etc.) não foram investigados (não documentados, podem mudar).

## Autenticação
Painéis de consulta: sem login (HTTP 200 anônimo). `sinisa.cidades.gov.br` e `/admin` exigem login (não testado). A API pública de catálogo do dados.gov.br (`/dados/api/publico/...`) respondeu HTTP 401 (exige token).

## Limites de requisição
Não documentados.

## Frequência de atualização
A página não informa periodicidade. Diz que o SNIS encerrou em 2023 e o SINISA entra em atividade a partir de 2024; os produtos SNIS listados têm ano de referência 2022 ("SNIS 2023"); há "Resultados/Indicadores SINISA 2025" sem ano de referência declarado. Tratar como anual (suposição).

## Campos que o projeto usará
- Município (código IBGE), ano de referência
- Indicadores de água, esgoto, drenagem e manejo de resíduos sólidos
- Situação do município (faixas de indicadores)

## Resultado do teste
Executei curl em cada URL acima (códigos HTTP citados) e leitura da página institucional via WebFetch. Não obtive arquivo de dados nem testei consulta por município. Sem amostra.

## Problemas/mudanças em relação ao esperado
- SNIS (appsnis) foi substituído pelo SINISA; hosts antigos aparecem como "hmg"/legado.
- Sem API ou download oficial identificado: o coletor exigirá investigar os endpoints do painel ou procurar conjuntos no dados.gov.br (API de catálogo exige token).

**Data da última validação: 2026-11-09**
**Status: PARCIAL**
