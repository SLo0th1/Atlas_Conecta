# Novo PAC Seleções e programas do Transferegov

## URL(s) validada(s)
- https://www.gov.br/casacivil/pt-br/novopac - HTTP 200. Menu: Obras por Estado, Legislação, Fontes de financiamento, Critérios de inclusão, Mapas, Transparência PAC. Não há seção de seleções/editais nem feed/RSS/API visível.
- https://www.novopac.gov.br/ e /selecoes - falha de conexão (HTTP 000) no meu ambiente; não validado.
- https://api.transferegov.gestao.gov.br/fundoafundo/ - HTTP 200, Swagger 2.0 (PostgREST); tabela `programa`.
- https://api.transferegov.gestao.gov.br/fundoafundo/programa - HTTP 200 JSON.
- https://api.transferegov.gestao.gov.br/transferenciasespeciais/ - HTTP 200 (tabela `programa_especial`, sem campo de situação nem prazo de proposta).
- 404: `/transferegov/programa`, `/discricionarias/`, `/convenios/`. A API de transferências discricionárias/voluntárias não foi localizada.
- voluntarias.plataformamaisbrasil.gov.br (consulta pública de programas): sem conexão (HTTP 000); não validado.

## Método de acesso
- Transferegov Fundo a Fundo: API REST aberta (PostgREST: `campo=eq.valor`, `select`, `limit`, `order`, `or=(...)`), JSON.
- Novo PAC / editais de ministérios: sem API/feed identificado; exige scraping de páginas HTML de cada ministério (não validado ministério a ministério).

## Autenticação
Nenhuma na API Transferegov testada.

## Limites de requisição
Não documentados; usei poucas requisições espaçadas. Nenhum cabeçalho de rate limit observado.

## Frequência de atualização
Não informada (suposição: contínua para programas).

## Campos que o projeto usará (tabela `fundoafundo/programa`, 35 colunas)
id_programa, ano_programa, modalidade_programa, codigo_programa, nome_programa, objetivo_programa, descricao_programa, situacao_programa, valor_global_programa, sigla_orgao_superior_programa, nome_orgao_superior_programa, data_inicio/fim_recebimento_planos_acao_beneficiarios_(especificos|emendas|voluntarios), nome_fundo_programa, codigo_ibge_fundo_programa.

## Resultado do teste
- `GET /fundoafundo/programa?select=situacao_programa&limit=1000` -> 200; DISPONIBILIZADO 119, NAO_DISPONIBILIZADO 10 (129 linhas no total).
- Programas com prazo aberto: `situacao_programa=eq.DISPONIBILIZADO` e `or=(data_fim_recebimento_planos_acao_beneficiarios_voluntarios.gte.2026-11-09,data_fim_recebimento_planos_acao_beneficiarios_emendas.gte.2026-11-09,data_fim_recebimento_planos_acao_beneficiarios_especificos.gte.2026-11-09)` -> 200 com resultados (ex.: "DEPEN - Fundo a Fundo 2020/2021", fim voluntários 2026-12-31). Datas iguais em programas antigos sugerem prorrogação genérica; validar por programa.
- `programa_especial?limit=1` -> 200 (campos de valores e ciência, sem situação).

## Problemas/mudanças em relação ao esperado
- Não há "Novo PAC Seleções" estruturado nas páginas obtidas: scraping por ministério ou monitoramento do DOU.
- A tabela com situação "DISPONIBILIZADO" existe no Fundo a Fundo; não achei equivalente para convênios discricionários.
- HEAD com `Prefer: count=exact` retornou 403 (usar GET).

**Data da última validação: 2026-11-09**
**Status: PARCIAL**
