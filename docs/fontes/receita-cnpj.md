# Dados abertos do CNPJ - Receita Federal

## URL(s) validada(s)
- Repositório atual (Nextcloud público da Receita): https://arquivos.receitafederal.gov.br/index.php/s/YggdBLfdninEJX9 (token de compartilhamento público; encontrado por conhecimento prévio e confirmado via WebDAV: HTTP 207 com pastas `2023-05` ... `2026-10` e `cnpj.tar.gz`). Acesso programático: `PROPFIND`/`GET` em `https://arquivos.receitafederal.gov.br/public.php/webdav/<AAAA-MM>/<arquivo>.zip` com usuário = token e senha vazia.
- https://arquivos.receitafederal.gov.br/ redireciona (302) para outro compartilhamento (`gn672Ad4CF8N6TK`, repositório geral com pastas Dados, Documentos, Programas).
- https://dadosabertos.rfb.gov.br/CNPJ/dados_abertos_cnpj/ - timeout de conexão (HTTP 000); endereço antigo, não funcional daqui. `https://arquivos.receitafederal.gov.br/dados/cnpj/dados_abertos_cnpj/` - 404.
- Página oficial gov.br/receitafederal/.../dados-publicos-cnpj - 403/exige autenticação para o robô; não consegui lê-la.

## Método de acesso
Arquivo (download de ZIP com CSV). Sem API. A coleta mensal exige baixar vários GB; recomenda-se filtrar em streaming.

## Autenticação
Nenhuma (link público). Evitar o endereço de usuário/senha pessoal; usar só o token público.

## Limites de requisição
Não documentados. Fiz 5 requisições espaçadas, sem bloqueio.

## Frequência de atualização
Mensal: pasta nova por mês (2026-10 é a mais recente em 2026-11-09; 2026-09, 2026-08 existem).

## Tamanho (pasta 2026-10, bytes de cada ZIP)
- Estabelecimentos0..9: 2,28 GB + 9 arquivos de ~0,34-0,37 GB (total ~5,5 GB)
- Empresas0..9: 0,57 GB + 9 de ~0,08-0,10 GB (total ~1,4 GB)
- Socios0..9 (~0,6 GB), Simples (0,31 GB)
- Tabelas pequenas: Naturezas 1.585 B, Municipios 43.443 B, Cnaes 22.078 B, Motivos 1.180 B, Paises 2.745 B, Qualificacoes 980 B
- Total aproximado da pasta: cerca de 8-9 GB compactados. Não baixei arquivos grandes.

## Layout (conferido em amostra)
CSV sem cabeçalho, separador `;`, aspas, codificação ISO-8859-1 (Latin-1), uma linha por registro.
- Estabelecimentos: 30 colunas (conferido). Ordem conforme dicionário da Receita (conhecimento prévio, a confirmar com o PDF): 1 cnpj_basico, 2 cnpj_ordem, 3 cnpj_dv, 4 matriz/filial, 5 nome_fantasia, 6 situacao_cadastral, 7 data_situacao, 8 motivo, ..., 12 cnae_principal, 14-19 endereço (tipo_logradouro, logradouro, numero, complemento, bairro, cep), 20 uf, 21 municipio (código RFB/TOM, não IBGE), 22-27 telefones, 28 email.
- Empresas: cnpj_basico, razao_social, natureza_juridica, qualificacao_responsavel, capital_social, porte, ente_federativo_responsavel.
- A natureza jurídica NÃO está em Estabelecimentos: precisa cruzar por cnpj_basico com Empresas.

## Como filtrar
- Município: o código no arquivo é o da Receita (tabela Municipios.zip), não o IBGE. Testado: GOIANIA = 9373 (APARECIDA DE GOIANIA 9227, ARAGOIANIA 9235). Goiânia IBGE 5208707 -> RFB 9373 (mapear pelo nome+UF; a tabela não traz IBGE).
- Natureza jurídica (Naturezas.zip, conferida): 1015 = Órgão Público do Poder Executivo Federal (NÃO é fundo). Fundos públicos: 1287 Fundo Público da Administração Indireta Federal; 1295 idem Estadual/DF; 1309 idem Municipal; 1317 Administração Direta Federal; 1325 idem Estadual/DF; 1333 Fundo Público da Administração Direta Municipal. Para fundos municipais (FMS, FME, FMAS etc.): 1333 e 1309. Também úteis: 1244 Município, 1155 Fundação Pública de Direito Público Municipal, 1120 Autarquia Municipal, 1031 Órgão Público Executivo Municipal.
- Fluxo: filtrar Empresas por natureza_juridica in (1333,1309) -> cnpj_basico; filtrar Estabelecimentos por municipio=9373 (UF=GO) e cnpj_basico.

## Campos que o projeto usará
CNPJ (basico+ordem+dv), razao_social, natureza_juridica, situacao_cadastral, municipio, uf, cnae_principal, email (dado de contato público do cadastro).

## Resultado do teste
- PROPFIND raiz -> 207; PROPFIND 2026-10 e 2026-09 -> 207 com listagem e tamanhos.
- GET de Naturezas.zip (1,5 KB) e Municipios.zip (43 KB) -> 200; conferidos códigos acima. Download parcial de 3 MB de Estabelecimentos1.zip por Range: 30 colunas. Nada gravado no repositório; arquivos temporários fora do projeto.

## Problemas/mudanças em relação ao esperado
- Endereço antigo (dadosabertos.rfb.gov.br) não responde; atual é o Nextcloud acima.
- 1015 não é fundo público (é órgão do Executivo Federal): usar 1333/1309.
- O token do compartilhamento pode mudar; checar a página oficial (que exige navegador) se falhar.

**Data da última validação: 2026-11-09**
**Status: OK**
