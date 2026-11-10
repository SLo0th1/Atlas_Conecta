# Ficha de fonte: FNS - Fundo Nacional de Saúde (consultafns.saude.gov.br)

## URL(s) validada(s)
- `https://consultafns.saude.gov.br/` (HTTP 200, HTML; aplicação AngularJS + RequireJS, versão 1.50.9 nos parâmetros `?t=`)
- Arquivos da aplicação acessíveis: `/app/main.js`, `/app/app.js`, `/app/controllers/portalController.js` (HTTP 200)
- Painel relacionado (só carregamento da página, HTTP 200): `https://investsuspaineis.saude.gov.br/extensions/CGIN_Painel_Gerencial/CGIN_Painel_Gerencial.html` (painel Qlik)

## Método de acesso
Portal web SPA (consulta interativa). Não foi encontrada API pública documentada nem arquivos abertos de repasses neste domínio. A única exportação citada em fontes secundárias é o download em Excel nos painéis. Para o projeto: robô (captura da API interna) ou exportação manual; ambos NÃO validados.

## Autenticação
O shell da aplicação carrega sem login. `app.js` referencia `/api/autenticacao/usuario` e `/api/autenticacao/logout`, ou seja, há sessão/login em parte do sistema. Não se tentou autenticar.

## Limites de requisição
Desconhecidos.

## Frequência de atualização
Não verificada; repasses são publicados continuamente (competência/ordem bancária), sem confirmação.

## Campos que o projeto usará (desejados)
Entidade (município/CNPJ do fundo), bloco/grupo de financiamento, programa/ação, competência (mês/ano), valor bruto/líquido, descontos, data/ordem bancária, situação. Módulos da SPA relacionados (de `portalController.js`): consolidada, detalhada, entidade, convenios, comparativo, repasse-dia, saldo-mac, saldo-pab, conta-bancaria, piso-enfermagem, proposta, pendencia.

## Resultado do teste
- `GET /` HTTP 200. Roteamento dos módulos é no front-end. Os serviços usam Restangular com recurso `recursos` e nomes como `detalhada` e `consulta-detalhada` (de `detalhadaService.js`).
- Tentativas diretas em `/recursos/`, `/recursos/detalhada`, `/recursos/consulta-detalhada`, `/recursos/consolidada`, `/recursos/entidade`, `/recursos/repasse`, `/api/`, `/api/repasse`: todas HTTP 404 (JBoss, JBWEB000065). O prefixo real do backend NÃO foi descoberto (a configuração do Restangular está em `api.min.js`, não decodificada).
- Busca web: nenhuma documentação oficial de API; apenas menção de terceiro (CivisBR) sem confirmação.

## Problemas / mudanças em relação ao esperado
- Sem API pública estável confirmada. Endpoints internos não são contrato público e mudam com a versão (1.50.9).
- Não inventar endpoint. Próximo passo sugerido: capturar a URL real na aba Rede do navegador numa consulta (ex.: "Consulta Detalhada" por município) ou usar os painéis InvestSUS (Excel).

**Data da última validação: 2026-11-09**
**Status: OK** (API aberta confirmada em 2026-11-09; sem documentação oficial, tratar como contrato a testar a cada carga)

## Atualização 2026-11-09 — endpoints descobertos pela aba Rede do navegador (captura do dono)

Prefixo real do backend: `https://consultafns.saude.gov.br/recursos/` (as rotas testadas antes sem esse caminho deram 404).

| Rota | Teste | Resultado |
|---|---|---|
| `recursos/repasse-dia/consultar?ano=2026&dia=&mes=11` | curl, sem chave | 200, `application/json` |
| `recursos/anos` | curl, sem chave | 200, `application/json` |
| `recursos/meses` | curl, sem chave | 200, `application/json` |
| `recursos/acessos?dsFuncionalidade=repasse-dia` | só visto no navegador | 500 (contador de acessos; causa do aviso "Ocorreu um erro no servidor", sem efeito sobre os dados) |

- A consulta "Repasses do Dia" devolve o **total nacional** por bloco, programa e competência (campos: `codigo`, `nome`, `vlTotal`, `vlDesconto`, `vlLiquido`, `repasses[]`, `noTipoCompetencia`, `dsCompetencia`, `noTipoTransferencia`, `qtdProcesso`, `dsNivel`). **Não há filtro de município nessa rota.**
- Ainda falta localizar a rota de **repasse por município** (tela de consulta fundo a fundo por município/entidade), necessária para Goiânia e para o comparativo com as capitais.
- Status geral da fonte continua **PARCIAL**: API aberta e estável de aparência, mas sem documentação oficial; tratar como contrato a testar a cada carga.

### Sondagem de rotas por nome (2026-11-09)
Menu "Tipos de consulta" do FNS: Consolidada Fundo a Fundo, Contas Bancárias, Convênios/TED/Termo de Cooperação, Desconto Mac, Detalhada, Equipamentos e Materiais Permanentes, Fundos de Saúde - Pendências Natureza Jurídica/CNPJ, Gráfico Comparativo por Ano, Repasses do Dia, Proposta.
Rotas testadas por tentativa (curl, só `ano` e `mes`): `recursos/proposta/consultar` → 200; `recursos/contas-bancarias` → 400 (existe; exige outros parâmetros). Demais nomes testados → 404. **Não confirmado** qual rota atende "Consolidada Fundo a Fundo" e "Detalhada" (consulta por município); depende de captura da aba Rede.

### Consolidada Fundo a Fundo (tela `#/consolidada`) — captura do dono, 2026-11-09
A tela filtra por Ano, Estado, Município e Tipo de Repasse e mostra, por bloco e grupo: Valor Total Bruto, Valor Desconto e Valor Líquido (exemplo: Goiânia, 2026, população exibida 1.503.256 habitantes, Ano Censo 2025 — difere da estimativa IBGE 2026 de 1.511.709; cada número deve guardar sua própria fonte e data).
Rotas auxiliares confirmadas por curl: `recursos/ufs` (200, lista de UFs com `coUfIbge`, `sigla`, `nome`), `recursos/tipos-repasse` (200, E=Estadual, M=Municipal). A rota de dados da consolidada **não foi encontrada** por tentativa (`recursos/consolidada` e `recursos/consolidada/consultar` → 404 com vários parâmetros). Necessária a Request URL real da aba Rede.

### Captura 2 (aba Rede, tela Consolidada, Goiânia 2026) — 2026-11-09
Chamadas vistas no navegador (todas status 200): `ufs`, `anos`, `meses`, `faf`, `censo`, `recuperar-data-ultimo-pagamento`, `entidades?ano=2026&coMunicipioIbge=520870&count=...`, `repasse-bloco?ano=2026&coMunicipioIbge=520870&co...` (URL cortada na captura). O parâmetro de município é o **código IBGE de 6 dígitos** (520870, sem o dígito verificador).
Confirmado por curl: `recursos/municipios/520870` → 200 (JSON com `coMunicipioIbge`, `noMunicipio`, `sgUf`). `recursos/repasse-bloco`, `recursos/entidades`, `recursos/faf`, `recursos/censo` e variações aninhadas → 404 pelo caminho direto: o prefixo real dessas rotas ainda precisa ser lido na Request URL completa.

### Rotas de repasse por município — CONFIRMADAS (2026-11-09)
Prefixo: `https://consultafns.saude.gov.br/recursos/consulta-consolidada/` (sem chave, JSON; testadas por curl).
- `repasse-bloco?ano=2026&coMunicipioIbge=520870&count=10&page=1&sgUf=GO` → 200. Devolve blocos/grupos com `vlTotal`, `vlDesconto`, `vlLiquido`. Conferido com a tela: Goiânia 2026, Média e Alta Complexidade R$ 1.249.282.921,38 bruto; Atenção Primária R$ 109.150.323,69.
- `entidades?ano=2026&coMunicipioIbge=520870&count=10&page=1&sgUf=GO` → 200. Lista as entidades (fundos) que recebem, com `cpfCnpj`, `razaoSocial`, `esferaAdministrativa` (ESTADUAL/MUNICIPAL) e `valorTotal`. **Útil para a T5 (CNPJs dos fundos de saúde):** FUNDO MUNICIPAL DE SAUDE de Goiânia aparece com CNPJ próprio; o FUNDO ESTADUAL DE SAUDE também aparece (esfera estadual, a não confundir com o municipal).
- Município pelo código IBGE de **6 dígitos** (520870). Paginação por `count` e `page`.
- Não enviar cookies; as chamadas funcionaram sem eles.

### Coletor `coletores/fns.ts` (2026-11-09)
- Usa `repasse-bloco` com **`coTipoRepasse=M`** (repasses ao Fundo MUNICIPAL; `E` = estadual). Sem esse filtro o total do município soma o Fundo Estadual de Saúde que atua no território e distorce a comparação entre capitais (Goiânia 2026: R$ 1,57 bi sem filtro × R$ 888 mi com `M`).
- Saída: `data/core/fns-5208707.json` (blocos, grupos e entidades por ano) e `data/core/fns-capitais-<ano>.json` (27 capitais, total e per capita). Pausa de 400 ms entre chamadas; retentativas com espera progressiva.
- Resultado (repasse municipal): Goiânia R$ 888,2 mi (2026), R$ 973,5 mi (2025), R$ 913,3 mi (2024); posição por habitante entre as 27 capitais: 13º (2026) e 14º (2025). O per capita usa a população estimada do IBGE (SIDRA 6579), que difere da população exibida na tela do FNS (Censo 2025); cada número guarda a própria fonte.
