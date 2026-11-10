# Diário Oficial da União - INLABS e Base de Dados de Publicações do DOU

## URL(s) validada(s)
- https://inlabs.in.gov.br/ - HTTP 200, mas exibe "Estamos em manutenção" (Manutenção Programada, Imprensa Nacional - INLABS) em 2026-11-09. Texto: "Os dados abertos disponibilizados no INLabs estão temporariamente disponíveis no link a seguir", apontando para a URL abaixo. `/index.php` retorna 404.
- https://www.in.gov.br/acesso-a-informacao/dados-abertos/base-de-dados - HTTP 200 (página "Base de Dados de Publicações do DOU", 158 KB). Texto: publicações em XML, compactadas em ZIP, acesso na sequência Ano > Mês > arquivo.zip; o dicionário de dados "será disponibilizado em data a ser definida".
- https://github.com/Imprensa-Nacional - HTTP 200 (contém o repositório `inlabs`; não li o conteúdo).

## Método de acesso
- INLABS (normal): download de XML/PDF das edições completas via login no site (a Imprensa Nacional publica script de exemplo no GitHub). Em manutenção hoje; fluxo de login e formato NÃO testados.
- Alternativa vigente: página Base de Dados do DOU (ZIP com XML). Os links reais dos ZIP não aparecem no HTML estático (carregados dinamicamente); não determinei a URL direta nem o tamanho dos arquivos. Não baixei nada.

## Autenticação
INLABS: cadastro gratuito (e-mail/senha), conforme descrição do projeto; não testei nem me cadastrei. Base de Dados: a página abre sem login; não confirmei se o download dos ZIP exige cadastro.

## Limites de requisição
Não documentados.

## Frequência de atualização
Nomes de arquivo (da página): 3 primeiros caracteres = seção (S01, S02, S03); 4º e 5º = mês; 6º ao 9º = ano. Aviso: "excepcionalmente para outubro de 2026 os arquivos serão atualizados diariamente" e o nome inclui HHmmss a partir do 10º dígito. O padrão normal parece ser um arquivo mensal por seção (não serve a monitoramento diário); conferir se a cadência diária continua em novembro.

## Campos que o projeto usará
Seção, data de publicação, órgão, tipo do ato, título/ementa, texto, URL do ato; filtros por termos (convênio, portaria de habilitação, Novo PAC, Goiânia).

## Resultado do teste
curl em inlabs.in.gov.br (200, página de manutenção com link único para a base) e na página in.gov.br (200). Sem download de XML; sem amostra.

## Problemas/mudanças em relação ao esperado
- INLABS indisponível (manutenção) em 2026-11-09; migração temporária para a página da Base de Dados.
- Dicionário de dados ainda não publicado; formato dos nomes de arquivo muda em outubro/2026.
- Alternativa não testada: pesquisa do site in.gov.br (HTML) como robô.

**Data da última validação: 2026-11-09**
**Status: PARCIAL**
