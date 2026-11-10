# SINISA (sucessor do SNIS) - Ministério das Cidades

## URL(s) validada(s)
- https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa - HTTP 200 (página institucional).
- https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa/resultados-sinisa e `.../resultados-sinisa/resultados-sinisa-2025` - HTTP 200; trazem os links de download de planilhas (abaixo).
- **Planilhas por município (GET direto, sem login, sem captcha), HTTP 200:**
  - Água, ano ref. 2024: `.../sinisa/resultados-sinisa/SINISA_Resultados_Ref2024.zip` (19 MB; pasta "Água - Base Municipal", arquivo `SINISA_AGUA_Indicadores_Base Municipal_2024_Retificação.xlsx`).
  - Esgoto 2024: `.../resultados-sinisa/SINISA_ESGOTO_Planilhas_2024.zip` (8,6 MB; `Esgoto - Base Municipal/SINISA_ESGOTO_Indicadores_Base Municipal_2024.xlsx`).
  - Resíduos 2024: `.../resultados-sinisa/SINISA_RESIDUOS_planilhas_2024.zip` (18 MB; `SINISA_RESIDUOS_Indicadores_2024.xlsx`).
  - Drenagem/águas pluviais 2024: `.../resultados-sinisa/SINISA_AGUASPLUVIAIS_Informacoes_Indicadores_2025.zip` (9,6 MB; ZIP interno `SINISA_AGUASPLUVIAIS_Indicadores_2024.zip` com `SINISA_AGUASPLUVIAIS_Indicadores_AP2024.xlsx`).
  - Ano ref. 2023 (só água): `.../sinisa/arquivos/SINISA_Resultados_Ref2023.zip` (19 MB). Gestão municipal 2023: `.../resultados-sinisa/SINISA_GESTAOMUNICIPAL_Informacoes_2023.xlsx` (não usado).
  - Relatórios PDF 2025 (ex.: `008_RELATORIO_SINISA_ABASTECIMENTO_AGUA_2025_defeso.pdf`, 10 MB, HTTP 200) e glossários PDF na mesma página (não usados; úteis para conferir fórmulas).
- https://app4.cidades.gov.br/serieHistorica/ - HTTP 200; aplicativo de consulta do SNIS (Yii) que exporta para Excel por formulário/sessão (limite de 1.000.000 de células); não é arquivo estático, não usado.
- https://indicadores-sinisa-2025.cidades.gov.br/ - HTTP 200, painel Laravel/Inertia; não usado.
- https://sinisa.cidades.gov.br/ - redireciona para login (prestadores informam dados); não usado.
- https://dados.gov.br/api/3/action/package_search - HTTP 401 (exige token); não usado.
- Falhou/ressalva: pedido HEAD (`curl -I`) aos ZIPs de gov.br/cidades retorna 403; o GET normal funciona (HTTP 200). O coletor usa só GET. Nada foi contornado.

## Método de acesso
Download de ZIPs de XLSX (uma linha por município, ~5.500 municípios). O coletor `coletores/sinisa.ts` baixa cada ZIP em `data/raw/sinisa` (ignorada pelo Git), descompacta com o tar do sistema, lê o XLSX com um leitor mínimo de XML (sem dependência nova), localiza a coluna pelo CÓDIGO do indicador (ex.: IAG0001) e confere o título da coluna; se o layout mudar, falha em vez de gravar número errado. Apaga os brutos ao final. Pausa de 3 s entre downloads.

## Autenticação
Nenhuma para os ZIPs acima.

## Limites de requisição
Não documentados; 4 downloads com pausa de 3 s funcionaram.

## Frequência de atualização
Anual. Água/esgoto/resíduos/drenagem 2024 publicados em dez/2025 ("Data de publicação: 18/12/2025" nas planilhas de esgoto e resíduos). A água 2024 é versão "Retificação". Reexecutar quando sair o próximo ano de referência (ajustar `ANO` e nomes dos ZIPs no coletor).

## Campos que o projeto usa (Goiânia, IBGE 5208707, ano de referência 2024)
Saída: `data/core/saneamento-5208707.json`, com proveniência por componente.
- Água (prestador SANEAGO, regional): atendimento da população total com rede 99,85% (IAG0001); urbana 100% (IAG0002); domicílios totais 99,16% (IAG0004); perdas de faturamento 28,21% (IAG2012); perdas totais na distribuição 11,45% (IAG2013); consumo total médio per capita 176,01 l/hab/dia (IAG2006).
- Esgoto (SANEAGO): atendimento da população total com rede coletora 99,85% (IES0001); domicílios totais com rede coletora 80,16% (IES0004); domicílios totais com coleta E tratamento 75,86% (IES0007); esgoto tratado / esgoto coletado 86,97% (IES2004).
- Resíduos (Companhia de Urbanização de Goiânia): cobertura da população total com coleta domiciliar 99,85% (IRS0001); urbana 100% (IRS0002); cobertura com coleta seletiva 99,85% (IRS0005); disposição final inadequada 100% (IRS3002).
- Drenagem (Secretaria municipal; município "Participante"): parcela de área urbanizada 41,35% (IGE0001); vias pavimentadas na área urbana 97,5% (IAP0001); vias com rede pluvial subterrânea 13,49% (IAP0002); domicílios sujeitos a risco de inundação 0,15% (IGR0001).

## Resultado do teste
Validação por amostragem: os valores do JSON foram comparados com a leitura independente das planilhas via Python/openpyxl (linha de Goiânia, uma só por arquivo): coincidem nos 18 indicadores. Água 2023 (outro arquivo) mostra 99,62% de atendimento total, coerente com a série.

## Problemas/limitações
- IRS3002 (disposição final inadequada = 100%) e IRS0005 (coleta seletiva 99,85%, igual à coleta total) parecem inconsistentes com a realidade (Goiânia tem aterro sanitário); gravados com campo `ressalva` e NÃO devem ser exibidos como fato sem conferir com a prefeitura.
- IAG2013 (perdas totais, 11,45%) é menor que as perdas de faturamento (28,21%): definições diferentes; conferir no glossário SINISA antes de exibir ou somar.
- Os valores são declarados pelos prestadores/municípios e publicados sem auditoria; células "Não calculado" viram `valor: null` com `motivo_sem_valor`.
- Água/esgoto da base municipal vêm do prestador regional (SANEAGO) e valem para o município inteiro, urbano e rural.
- Cobertura de resíduos de 99,85% e demais percentuais são cobertura de serviço, não qualidade.
- Dados de população da planilha de resíduos/drenagem: 1.494.599 habitantes (referência da SINISA, não do Censo).
- Séries anteriores (SNIS 1995-2022) só pelo aplicativo de série histórica (formulário); não coletadas.

**Data da última validação: 2026-11-10**
**Status: OK (coletor funcional; ressalvas acima)**
