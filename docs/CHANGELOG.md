# Changelog

## GovNexa — Fluxo do sistema
- 2026-11-15: guia Projetos › Fluxo do sistema: diagrama no estilo BPMN (6 raias, 28 etapas, início ao fim), clique em cada etapa mostra o que é feito, o que é validado, quem, a situação no sistema e os botões para abrir as telas; lista das etapas por raia para leitura e impressão. Conteúdo em src/lib/govnexa/fluxo.ts.

## GovNexa — Log do ciclo de vida do projeto
- 2026-11-15: tela "Histórico de alterações" (Projetos): o que foi feito, por quem, data e hora, origem, antes/depois e motivo; filtros por período, projeto, pessoa, ação, origem e texto; exportação CSV protegida contra fórmulas; seção "Histórico" na ficha do projeto.
- 2026-11-15: o importador da carteira registra cada carga e as diferenças em relação à anterior (incluídos, retirados, campos e etapas alterados) em historico.json (`--autor`).
- 2026-11-15: banco preparado: `db/migracoes/002_govnexa_log.sql` (evento_sistema e visão log_alteracoes, RLS, sem UPDATE/DELETE); validado em postgres:16.

## GovNexa — Fase 2 (cronograma e equipe) e etapa 1.5 (movimentação)
- 2026-11-15: importador dos cronogramas do GEPP (`npm run importar:cronogramas`): fases, etapas, status calculado, ciclos de retrabalho, pendências de dado, casamento com a carteira, anonimização.
- 2026-11-15: telas Cronogramas, página de cada cronograma (linha do tempo, quadro de tarefas, pendências), Onde está parado (por unidade e responsável).
- 2026-11-15: motor de movimentação do projeto (avançar com portões, voltar com motivo, forçar com motivo, aprovar/reprovar pendência, novo passo, edição de campos com histórico); Kanban com arrastar e botão Mover e página Pendências de etapa em MODO SIMULAÇÃO (nada é gravado sem banco).
- 2026-11-15: preparo do banco (sem ligar): repositório único JSON/PostgreSQL, `db/migracoes/001_govnexa_carteira.sql` com RLS por prefeitura, `scripts/gerar-sql-carga.ts`; validado em postgres:16.

## GovNexa — Fase 1: Carteira de Projetos
- 2026-11-15: carteira importada da planilha (aba PIPELINE + BASE_OPERACIONAL), telas Carteira, Kanban por macroetapa, Gantt geral e Visão por órgão (PR #20).
- 2026-11-15: regra de interface: tabelas da plataforma cabem na largura, sem rolagem horizontal (quebra de linha, colunas secundárias na ficha); teste automático em 1280px.
- 2026-11-15: "Projetos · Início" passa a mostrar o resumo real da carteira por macroetapa (quantidade, valor, verde/amarelo/vermelho); o roteiro de desenvolvimento sai da aplicação. Botão "Novo registro" (protótipo) oculto em Projetos e Gestão até o cadastro real (etapa 1.5).

## GovNexa — Fase 0: base e identidade (em andamento)
- 2026-11-15: a plataforma passa a se chamar **GovNexa — Inteligência para a gestão pública** (marca centralizada em `src/lib/marca.ts`; site público e login seguem com a marca anterior até decisão, chave `USAR_NO_SITE_PUBLICO`).
- 2026-11-15: menu lateral agrupado por módulo (Projetos, Captação, Licitações, Gestão, Conta) via `src/lib/govnexa/catalogo.ts`, sem alterar `src/data/modules.json`; removido o texto "Área do comprador".
- 2026-11-15: páginas iniciais dos módulos **Projetos** (roteiro das fases) e **Gestão** (módulos ativos).
- 2026-11-15: município ativo lido de `data/config/municipio.json` (`src/lib/municipio-ativo.ts`): nome de exibição e logo deixam de ser fixos no código.
- 2026-11-15: documentos `docs/govnexa/visao-geral.md` e `docs/govnexa/modelo-dados.md` (modelo para PostgreSQL com isolamento por prefeitura e formato JSON do MVP).
- 2026-11-15: testes `tests/govnexa/catalogo.test.ts` e teste de interface "govnexa: marca e módulos na plataforma".
- Observado (anterior a esta fase): o rodapé da plataforma fica atrás da barra lateral em páginas curtas; tabelas com texto longo cortam a última coluna.

# Changelog — bloco Captação

## Fase 0 — Fundação e descoberta (em andamento)
- 2026-11-09: criado o bloco **Captação** (guia **Principal**) no menu da plataforma, com dados de exemplo.
- 2026-11-09: `docs/plano-execucao.md` aprovado pelo dono (coletores em Node/TypeScript, GitHub Actions como agendador, PostgreSQL como banco futuro).
- 2026-11-09: T1 estrutura de pastas e configuração do município piloto (Goiânia, IBGE 5208707).
- 2026-11-09: T4 coletor `coletores/ibge-municipios.ts` e tabela `data/core/ibge-municipios.json` (5.571 municípios, 27 capitais, população 2026).
- 2026-11-09: T2 concluída: 15 fichas em `docs/fontes/` (OK: Transferegov arquivos, CAUC, SICONFI, IBGE, Receita CNPJ; PARCIAL: Transferegov API, DATASUS, FNS, FNDE/INEP, SINISA, DOU, Novo PAC/editais, Congresso; EXIGE CHAVE: Portal da Transparência; INACESSÍVEL: MDS/FNAS). INLABS em manutenção; alternativa: base de dados abertos do DOU (in.gov.br).
- 2026-11-09: T3 (parcial): segredo `PORTAL_TRANSPARENCIA_CHAVE` cadastrado no GitHub (Actions) pelo dono. INLABS segue em manutenção; cadastro adiado.
- 2026-11-09: FNS validado (rotas `consulta-consolidada/repasse-bloco` e `entidades`); coletor da Receita (`coletores/receita-cnpj-fundos.ts`) testado e carga completa iniciada (T5).
- 2026-11-09: T6 `data/config/temas.json` (14 temas, 16 funções orçamentárias, códigos conferidos na Portaria 42/1999 consolidada) e `secretarias.json` (15 secretarias genéricas), ambos rascunho pendente de validação.
- 2026-11-09: T7 guias do bloco Captação: Principal, Oportunidades, Acompanhamento, Alertas e Projetos (dados de exemplo); revisadas visualmente pelo dono.
- 2026-11-09: camada de dados `src/lib/dados/index.ts` (JSON hoje, PostgreSQL depois) e `docs/esquema-postgres.sql` (21 tabelas; aplicado com sucesso em PostgreSQL 16 descartável).
- 2026-11-09: workflow `testar-portal-transparencia.yml` para validar a chave do Portal sem expô-la.
- 2026-11-09: PR #1 mesclado na main; site publicado confirmado pelo dono. Chave do Portal da Transparência testada (HTTP 200) e estrutura real de convênios registrada na ficha.
- 2026-11-09: Fase 1: coletores CAUC, SICONFI e Transferegov (arquivos) implementados e testados para Goiânia; ver docs/fontes. O arquivo data/core/transferegov-5208707.json (5,6 MB) NÃO foi commitado: decidir com o dono onde guardar dados volumosos (Git x banco).
- 2026-11-09: PRs #1 e #2 mesclados na main. Fase 1: coletores CAUC, SICONFI, Transferegov, FNS, Portal da Transparência (Actions) e programas abertos (59 elegíveis a Goiânia). T5: 89 CNPJs candidatos; planilha em docs/validacao-cnpjs-prefeitura.md. Conferência manual do aceite: 5 de 10 convênios batem com o site oficial.
- 2026-11-10: Telas do bloco Captação ligadas aos dados reais pela camada de dados (`src/lib/dados/captacao.ts`): Principal (indicadores com fonte e data), Oportunidades (59 programas abertos), Acompanhamento (19 convênios municipais em execução, saldo a liberar) e Alertas (49, gerados pelas regras de docs/regras-alertas.md). Resumo enxuto `data/core/acompanhamento-5208707.json` (105 KB) gerado por `coletores/derivar-acompanhamento.ts`; o arquivo completo do Transferegov segue fora do Git. A guia Projetos continua com dados de exemplo. Limites das regras (vigência, dias sem desembolso, prazo de programa) são provisórios.
- 2026-11-10: Oportunidades: 'Ver detalhes' passou a explicar cada programa (do que se trata, em linguagem simples, prazos, tipo de transferência, quem pode propor, temas e secretarias, quem já propôs, CAUC, roteiro e documentos). Coletor de programas agora liga programa × proposta (23.596 propostas) e a camada de dados ganhou formato.ts e detalhes.ts.
- 2026-11-10: Oportunidades: detalhe com principal objetivo, critérios, observações, trechos de valor mínimo/contrapartida do texto oficial, valores observados e links (edital/documentos citados e portal Transferegov Discricionárias). Temas dos programas sem classificação: 15 -> 1. Educação (INEP): data/core/educacao-5208707.json (830 escolas, 278.377 matrículas, IDEB 2023).
- 2026-11-10: Testes de contrato dos dados (npm run test:dados, 7 testes: proveniência, sem dados bancários/CPF, IBGE, CAUC, acompanhamento, programas, SICONFI/FNS). DOU: CPFs de terceiros mascarados (LGPD).
- 2026-11-10: Detalhes completos na guia Principal (lista dos 19 convênios, de onde vêm os saldos por concedente e convênio, CAUC item a item, SICONFI, FNS, programas, DOU, alertas) e detalhe de cada alerta (por que, regra, números, o que fazer). Tabelas com dados reais deixam de exibir o rótulo 'dados de exemplo'. Decisão do dono: perfis por secretaria na etapa do banco (um único usuário por enquanto).
- 2026-11-10: Guia Principal ganha o indicador de Educação (INEP): escolas, matrículas por rede e etapa, comparação 2023/2024 e série do IDEB.
- 2026-11-10: Documentação: manual do usuário do bloco Captação (docs/manual-usuario.md) e especificação da guia Projetos com IA e revisão humana (docs/projetos-ia.md: fluxo, dados, RAG, 21 regras de parecer determinísticas, segurança e entrega em 8 etapas).
- 2026-11-10: Nova guia Comparativo (repasses de saúde do FNS às 27 capitais por habitante; grupos que outras capitais recebem e Goiânia não; detalhe por capital) e agenda iCalendar dos prazos (/plataforma/agenda.ics, 114 eventos com lembretes de 30 e 7 dias, protegida pelo login).
- 2026-11-10: Motor de parecer determinístico da guia Projetos (src/lib/projetos): 21 regras R01-R21 (CAUC, prazo, elegibilidade, metas e indicadores, cronograma, valores, contrapartida, despesa de pessoal, frescor das fontes, citações, hash de aprovação), 27 testes (node --test tests/projetos/parecer.test.ts). Sem IA e sem gravar projetos.
- 2026-11-10: Guia Projetos mostra o parecer automático em 2 exemplos fictícios (100% pronto; 19% com 10 bloqueantes), com cada regra no detalhe. Sem IA e sem gravar projetos reais.
- 2026-11-10: Qualidade dos dados: nova guia (frescor, falhas e motivo por fonte), alertas de fonte defasada com motivo e ação, executor de coletores com registro de falhas (coletores/rodar.ts + status-coletas.json) usado pela atualização diária. SINISA (saneamento) coletado: água, esgoto, resíduos e drenagem de Goiânia (2024).
- 2026-11-10: CNES (5.207 estabelecimentos, 7.638 leitos; lista nominal sem consultórios isolados nem pessoa física) e SINISA ligados à guia Principal com detalhe completo e ressalvas; testes de contrato (LGPD no CNES; ressalvas do SINISA).
- 2026-11-10: Busca por necessidade nas Oportunidades: a busca da tabela passa a aceitar várias palavras (todas devem aparecer) e olha também os temas, sinônimos e o texto oficial do programa (ex.: drenagem, creche, quadra, ônibus). 28 testes de interface continuam passando.
- 2026-11-10: Testes de interface (Playwright, Chromium) executados pela primeira vez: 28 de 28 passaram, incluindo todas as guias do bloco Captação em 1280 e 375 px. playwright.config.ts passa a carregar só *.spec.ts (os testes de dados usam node:test).
- 2026-11-10: Atualização mensal automática (INEP, SINISA e CNES) no GitHub Actions (dia 5 de cada mês, branch dados-mensais-atualizados); status das coletas mensais em data/core/status-coletas-mensais.json, lido pela guia Qualidade dos dados.
- 2026-11-10: Manual do usuário atualizado (Comparativo, Qualidade dos dados, Principal com educação, saúde e saneamento, agenda iCalendar, Projetos com parecer, rotinas diária e mensal).
- 2026-11-10: Revisão de segurança (9 vetores, docs/seguranca.md): limitador de tentativas de login (lib/rate-limit.ts), escape do JSON-LD (XSS), cabeçalhos de segurança e CSP no vercel.json, testes (npm run test:dados: 13 testes).
