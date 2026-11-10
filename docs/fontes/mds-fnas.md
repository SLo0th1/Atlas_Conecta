# Ficha de fonte: MDS / FNAS (repasses fundo a fundo do SUAS)

## URL(s) validada(s)
Nenhuma URL do MDS foi validada diretamente: todos os testes com curl em `aplicacoes.mds.gov.br`, `aplicacoes.cidadania.gov.br` e `www.mds.gov.br/webarquivos/...` terminaram em redirecionamento 302 seguido de HTTP 403 (bloqueio de acesso automatizado). Páginas testadas: `/sagi/vis/data3/data-explorer.php`, `/sagirmps/ferramentas/docs/Servicos_Web_SAGI.pdf`, `/sagi/servicos/misocial`, `/vis/data3/v.php`.

Referências obtidas apenas por busca web (NÃO testadas):
- Relatório "Parcelas Pagas" no SUASWeb: `https://aplicacoes.mds.gov.br/suaswebcons/restrito/execute.jsf?...` (o caminho contém "restrito")
- Repasses no gov.br/mds: `https://www.gov.br/mds/pt-br/acoes-e-programas/suas/gestao-do-suas/financiamento-1/repasses`
- Conjunto SUASWeb no dados.gov.br: `https://dados.gov.br/dados/conjuntos-dados/suasweb--sistema-de-gestao-do-suas`
- Sistemas e relatórios do FNAS: `http://blog.mds.gov.br/fnas/sistemas_e_relatorios/` (cita "Extração Repasses 2014-2022", Parcelas Pagas, Saldo detalhado por conta; fonte antiga)

## Método de acesso
Provável: relatório web (Parcelas Pagas, filtros por ano/UF/esfera/município) e extração em arquivo; VIS DATA/SAGI têm serviços web, mas a documentação não pôde ser lida (403). Hipótese de trabalho: robô sobre o relatório ou arquivo de dados abertos; NÃO confirmada.

## Autenticação
Segundo busca web, o SUASWeb tem acesso restrito a gestores, conselhos, ministério e órgãos de controle (login). Não se tentou acessar. Possível EXIGE CHAVE/login para o relatório completo.

## Limites de requisição
Desconhecidos.

## Frequência de atualização
Não verificada. Fonte secundária: o processamento bancário pode levar até 72 h após o repasse.

## Campos que o projeto usará (desejados)
Município/fundo, bloco/piso de financiamento (PSB, PSE etc.), ano e mês de competência, parcela, valor pago, data do pagamento, saldo em conta.

## Resultado do teste
Todas as tentativas diretas: 302 e depois 403 (curl com User-Agent de navegador). Nada foi baixado. Não foi possível confirmar endpoint, formato nem existência de API/arquivo aberto.

## Problemas / mudanças em relação ao esperado
- O domínio aplicacoes.mds.gov.br bloqueia clientes automatizados nesta rede; testar de outro IP ou via navegador.
- API pública do dados.gov.br exige token (HTTP 401 em teste análogo na ficha FNDE).
- Possível migração de domínio `cidadania.gov.br` para `mds.gov.br`.

**Data da última validação: 2026-11-09**
**Status: INACESSÍVEL** (a partir de curl; acesso real depende de teste manual/navegador e possivelmente de login)

## Atualização 2026-11-09 — captura do dono (navegador)
A página institucional https://www.gov.br/mds/pt-br/servicos/sistemas abre normalmente no navegador (atualizada em 12/11/2024) e lista os sistemas do MDS (Bolsa Família: SIGPBF, Sibec, CadÚnico V7, Sicon; Cadastro Único e outros). É página de serviços, **não** fonte de dados de repasses. `aplicacoes.mds.gov.br` segue sem teste de dados (curl recebeu 403). Status mantido: **INACESSÍVEL para coleta automática**; próximos passos: localizar no SUASWeb/Painel de Repasses (VIS DATA) uma consulta pública de repasses fundo a fundo e capturar a URL pela aba Rede, como feito no FNS.
