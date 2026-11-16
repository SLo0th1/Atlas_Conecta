# GovNexa — Histórico completo do desenvolvimento

Registro de **tudo o que foi feito e de como o sistema evoluiu**, para quem vai dar continuidade. Complementa o [README](../../README.md) (onde estamos e o que falta) e o [plano completo](plano.md) (como o sistema deve ser).

- **Seção 1:** linha do tempo das etapas do produto.
- **Seção 2:** evolução do andamento por fase (% ao longo das entregas).
- **Seção 3:** regras e preferências dadas pelo dono ao longo do caminho (com data).
- **Seção 4:** testes do SEI.
- **Seção 5:** o que vem a seguir: decisões pendentes, pendências do dono, próximas entregas e a mudança para o repositório novo e o Cloudflare.
- **Seção 6:** lições técnicas, para não repetir erros.
- **Seção 7:** todos os PRs, do #1 ao último, com a descrição completa de cada um.

Regra: toda entrega acrescenta o seu PR na seção 7 (e atualiza a seção 2 quando mudar algum %). Ver `CLAUDE.md`, regra 4.

## 1. Linha do tempo

| Período | Etapa | PRs | O que aconteceu |
| --- | --- | --- | --- |
| 09–10/11/2026 | Atlas · bloco Captação, Fase 0 e 1 | #1 a #3, #5 a #17 | Fundação (fontes, IBGE, temas, telas, camada de dados), coletores (CAUC, SICONFI, Transferegov, FNS, Portal da Transparência, INEP, CNES, SINISA, DOU), telas com dados reais, detalhes, comparativo entre capitais, agenda iCalendar, qualidade dos dados, parecer determinístico (R01–R21), testes de interface, atualização diária e mensal |
| 13/11/2026 | Segurança | #4 | Limite de tentativas de login, escape de JSON-LD, cabeçalhos e CSP, revisão dos 9 vetores |
| 15/11/2026 | **Virada para o GovNexa** | #18 a #22 | Áudios do dono e reunião com a equipe mudam o foco para a gestão da carteira: nome GovNexa, começar pelo módulo Projetos, módulos independentes e integrados. Fase 0 (marca, menu por módulos, município por configuração), rotina de publicação, Fase 1 (Carteira, Kanban, Gantt, Visão por órgão), telas sem rolagem, README |
| 15/11/2026 | Fases 1.5 e 2 | #23 a #37 | Cronogramas do GEPP, onde está parado, pendências de etapa e motor de movimentação (simulação), banco preparado, histórico de alterações, Fluxo do sistema (BPMN) e PDF, carga real temporária, sala de guerra, novo projeto, fluxos detalhados, mapa de impacto, regras do repositório (CLAUDE.md), painel do prefeito, reunião semanal, prazos da Lei 14.133, menu com blocos |
| 16/11/2026 | Fases 4 e 5 | #38 a #42 | Painel religado, mapa das obras, correção do mapa em branco na Vercel, WhatsApp (simulação), dependências entre etapas, Central de alertas, modelos do WhatsApp para a Meta, obras sem localização |
| 16/11/2026 | SEI e licitações | #43 a #45 | Reteste do link público do SEI (válido, sem captcha), Processos no SEI, Fluxo legível com zoom, menu com blocos fechados, Licitação em detalhe |
| 16/11/2026 | Documentação para continuidade | #46 a #48 e seguintes | README completo, regra de README sempre atualizado, plano completo no repositório e este histórico |

## 2. Evolução do andamento por fase (%)

Fotos do quadro "Andamento" do plano ao longo das entregas.

| Fase | 15/11 (após #30–#32) | 15/11 (após #34–#37) | 16/11 (após #38–#41) | 16/11 (após #42) | 16/11 (após #43) | 16/11 (após #45) |
| --- | --- | --- | --- | --- | --- | --- |
| Planejamento | 97% | 97% | 97% | 97% | 97% | 97% |
| 0 · Base e identidade | 100% | 100% | 100% | 100% | 100% | 100% |
| 1 · Carteira de Projetos | 100% | 100% | 100% | 100% | 100% | 100% |
| 1.5 · Cadastro, movimentação, log, sala de guerra | 92% | 95% | 95% | 95% | 95% | 95% |
| 2 · Cronograma e equipe | 65% | 78% | 78% | 85% | 90% | 90% |
| 3 · Produção com banco | 30% | 30% | 30% | 30% | 30% | 30% |
| 4 · Contratação, convênios e Gestão | 0% | 30% | 50% | 65% | 65% | 75% |
| 5 · Integrações e inteligência | 0% | 0% | 10% | 10% | 10% | 10% |

A Fase 3 está parada em 30% porque depende do banco de dados (decisão e conta do dono). As tabelas, a carga e o isolamento por prefeitura já foram preparados e testados em PostgreSQL 16.

## 3. Regras e preferências do dono (em ordem)

| Data | Regra |
| --- | --- |
| 09/11/2026 | Manter a arquitetura atual (Astro + TypeScript, JSON); coletores em Node/TypeScript; GitHub Actions como agendador; banco futuro PostgreSQL; multimunicípio (Goiânia só como configuração); portável para outro servidor. |
| 09/11/2026 | Trabalhar sempre em branch própria, com PR; o merge na `main` é sempre do dono. Commit e push de branches de trabalho autorizados. |
| 10/11/2026 | Login: manter exatamente como está; não alterar `api/`, `lib/session.ts`, `middleware.ts`, `src/pages/entrar.astro` nem `vercel.json` sem autorização. |
| 10/11/2026 | Perfis por secretaria só na etapa do banco; por enquanto um único usuário. Limite de "sem desembolso" (indício de cláusula suspensiva) em 180 dias. Telas de detalhe realmente detalhadas (o que compõe cada número e de onde vem). |
| 15/11/2026 | Virada para o GovNexa: começar pelo módulo Projetos (Carteira substitui a planilha); módulos independentes e integrados; sem IA no MVP; MVP em JSON e PostgreSQL planejado; Goiânia é piloto de um produto para várias prefeituras. |
| 15/11/2026 | As transcrições dos áudios e da reunião e as planilhas são o requisito MÍNIMO; nomes de macroetapas, campos e etapas seguem as planilhas; manter a rastreabilidade dos pedidos (plano, seção 14). |
| 15/11/2026 | Privacidade: nomes das pessoas da reunião nunca entram no projeto (usar papéis). Os dados da planilha podem ser usados por completo e foram publicados temporariamente, com aviso de retirada. |
| 15/11/2026 | Projeto nasce no cadastro e anda ou volta por qualquer caminho (Kanban, ficha, pendências, SEI), sempre pela mesma regra e com histórico. |
| 15/11/2026 | Telas sem barra de rolagem (principalmente a horizontal), simples, responsivas em navegadores, resoluções e celular. |
| 15/11/2026 | Toda mudança que afete o fluxo atualiza a guia Fluxo do sistema na mesma entrega (`fluxo.ts`, `subfluxos.ts`, `impacto.ts`). |
| 15/11/2026 | Autonomia: avançar sozinho no que não depende do banco nem de etapas anteriores, sem esperar ordem a cada passo. |
| 15/11/2026 | Ao abrir a sessão, atualizar a pasta (`git fetch`, `git pull --ff-only`); PRs pequenos e frequentes para o outro desenvolvedor ter sempre a versão atual (regra no `CLAUDE.md`). |
| 15/11/2026 | Prazos: a lei é o limite; a prefeitura define metas internas menores; passar do teto legal é alerta grave; prazos-piso não podem ser encurtados. |
| 15/11/2026 | SEI: documento público é lido automaticamente; documento restrito entra por PDF; nunca contornar captcha; não pedir agora à TI o serviço web do SEI. |
| 15/11/2026 | Estudar antes de decidir (lei, fontes, código) e recomendar com justificativa; relatar o andamento com o % de cada fase e as pendências em passos numerados. |
| 16/11/2026 | Dependências entre etapas: opção A (deduzidas pela ordem e pelas datas); revisar quando o fluxo for validado com o cliente. |
| 16/11/2026 | Fluxo mais legível (caixas dentro da raia, zoom) e menu com blocos fechados por padrão. |
| 16/11/2026 | Ao terminar cada processo: listar o que foi feito com %, as pendências e os próximos passos. |
| 16/11/2026 | O README deve sempre dizer o que o sistema é, o que foi feito, o que está sendo feito e o que falta; toda entrega o atualiza. O `CLAUDE.md` é versionado. |
| 16/11/2026 | O plano completo é de conhecimento de todos os envolvidos: fica no repositório (`docs/govnexa/plano.md`) e é atualizado a cada entrega, junto com este histórico. |

## 4. Testes do SEI (registro)

| Data | Teste | Resultado |
| --- | --- | --- |
| 15/11/2026 | Abrir o link público de um processo de licitação da SEINFRA (documentos restritos), já obtido | Abriu sem captcha: tipo e data do processo, 258 documentos e 443 andamentos; conteúdo restrito não aparece; "Gerar PDF" pede captcha |
| 15/11/2026 | Abrir o link público de um processo de licitação da SECAP (documentos públicos) e um documento | Abriu sem captcha: 324 documentos e 50 andamentos; o link do documento devolveu o PDF direto, com texto legível |
| 16/11/2026, 09h07 | Reteste dos dois links um dia depois | Os dois continuam válidos, sem captcha (SEINFRA: último andamento em 21/01/2026; SECAP: em 12/11/2026); documento público voltou como PDF |
| 16/11/2026 | Leitor do GovNexa (`npm run sei:ler`) nos dois processos reais | Números idênticos aos da página (258/443 e 324/50); documentos-chave reconhecidos; etapa indicada: 03 (SECAP) e 05 com conferência (SEINFRA); alerta de paralisação aberto na SEINFRA |

Por que ainda não é automático: o navegador não deixa uma página do GovNexa ler outro site (CORS). A leitura diária precisa de um programa no servidor e do banco para guardar links e leituras. Detalhes no README, seção 6.

## 5. O que vem a seguir

### 5.1 Decisões pendentes do dono

| Decisão | Opções | Impacto |
| --- | --- | --- |
| Leitura do SEI antes do banco | (a) robô diário no GitHub, gravando o resultado no repositório (provisório, dados ficam públicos); (b) esperar o banco | Com (a), Processos no SEI e Licitação em detalhe passam a se atualizar sozinhos já |
| Banco de dados | Neon pela Vercel (plano original); Neon direto ou Cloudflare D1 se o projeto migrar para o Cloudflare | Libera a Fase 3: gravar de verdade, SEI automático, fotos, perfis |
| Manter a cópia do plano no Claude Docs | Manter as duas (padrão atual) ou só a do repositório | Só organização |
| Validação do Fluxo com as áreas e o cliente | Reunião com o cliente | Pode mudar dependências, subprocessos e a regra de dependência (hoje opção A) |

### 5.2 Pendências do dono (fora do código)

1. Criar o banco de dados e cadastrar a chave nos segredos.
2. Cadastrar o segredo `VERCEL_DEPLOY_HOOK` no GitHub (rotina "Garantir publicação").
3. Decreto de feriados de Goiânia (contagem exata de dias úteis).
4. Conta oficial do WhatsApp Business na Meta e aprovação dos 3 modelos de mensagem.
5. Validar o Fluxo do sistema com as áreas e o cliente.

### 5.3 Próximas entregas possíveis sem banco

1. Leitura de PDF no navegador para documentos restritos do SEI (biblioteca `pdfjs-dist`, da Mozilla).
2. SEI automático provisório pelo GitHub (se o dono autorizar).
3. Projeto × oportunidade: sugestão de programas abertos para cada projeto.
4. Medições e avanço físico e financeiro, quando houver fonte (planilha, SISMOB, SIMEC).

### 5.4 Mudança planejada: repositório novo e Cloudflare

O dono informou (16/11/2026) que o projeto será copiado para **outro repositório** e publicado em **outro endereço**, pelo **Cloudflare**. A pasta local pode continuar a mesma. Roteiro combinado:

1. **Congelar o repositório atual** (sem novos merges) no momento da cópia.
2. **Copiar**, de preferência com o histórico (Import repository, fork ou `git clone --mirror` + push). Depois, arquivar o atual (Settings › Archive).
3. **Ligar esta pasta ao repositório novo:**
   ```sh
   git remote rename origin antigo
   git remote add origin <endereço do repositório novo>
   git fetch origin
   git branch -u origin/main main
   ```
   - Cópia **com** histórico: conferir que o último commit é o mesmo e seguir.
   - Cópia **sem** histórico (só arquivos): conferir que não há nada sem enviar, comparar os arquivos e então `git reset --hard origin/main`. O histórico antigo continua acessível pelo remote `antigo`.
   - O outro desenvolvedor faz o mesmo na pasta dele, ou clona o repositório novo.
4. **Cloudflare Pages:** conectar ao repositório (Workers & Pages › Create › Pages › conectar ao Git):
   - build: `npm run build`;
   - saída: `dist`;
   - variável `NODE_VERSION`;
   - domínio novo em Custom domains.
5. **Adaptar o código (um PR):**
   - **Login:** `api/login.ts`, `api/logout.ts` e `middleware.ts` são da Vercel e viram funções do Cloudflare. Precisa de autorização do dono, por ser a área do login.
   - **Cabeçalhos e CSP:** saem do `vercel.json` e vão para o arquivo `_headers`. Também precisa de autorização.
   - **Endereço do site:** `site:` no `astro.config.mjs`, além do README e deste histórico.
   - **Rotinas:** trocar ou desligar a rotina "Garantir publicação", que usa o gancho da Vercel.
   - **Segredos:** recadastrar os segredos e as variáveis (login, dados, Portal da Transparência).
   - **Banco:** decidir o banco junto com a migração.
6. **Visibilidade:** se o repositório novo for privado, a carga real da planilha deixa de ficar exposta.

## 6. Lições técnicas (para não repetir erros)

| Situação | O que aprendemos |
| --- | --- |
| Mapa em branco no site, com teste local verde (#40) | A Vercel não servia um arquivo de build com nome terminado em `_`. O build passou a usar nomes só hexadecimais (`hashCharacters: 'hex'`), e há um teste para isso. Depois de um merge que traz módulo novo para o navegador, abrir a página publicada e conferir que todo `/_astro/*` responde 200. Uma hipótese de correção só vale se o teste novo falhar sem a correção. |
| SEI no navegador | Uma página do GovNexa não pode ler o SEI direto (CORS). Leitura automática só no servidor; no navegador, só com a página salva pela pessoa. |
| Data de "hoje" | O site é estático: datas e faróis precisam ser recalculados no navegador, no fuso de Brasília (`hojeEmBrasilia()`). |
| Dado do navegador | Tudo que vem de `sessionStorage`, arquivo ou link é validado ao ler (forma, tamanho, data de calendário real) e mostrado só como texto (`textContent`). |
| Página do SEI | Vem em ISO-8859-1; o `<td>` do documento restrito não é fechado; "Interessados" pode ter nome de pessoa (não é lido); andamentos podem citar servidores (mascarados). "Contrato Social" não é contrato; "Edital" pode ser minuta (pede conferência). |
| Testes em paralelo | O Playwright aceita `PLAYWRIGHT_PORT` para rodar duas suítes ao mesmo tempo. O teste "Novo projeto" pode falhar uma vez sob carga e passar quando repetido. |
| Arquivos com CRLF | Vários arquivos usam CRLF. Scripts de edição precisam aceitar `\r\n`. |
| Pastas de trabalho | Uma pasta por entrega, cada uma com o seu `npm ci`. Servidores de prévia esquecidos travam o `npm ci` (EPERM). |
| Verificação no site | O site exige login; a conferência visual depois da publicação é feita pelo dono. |

## 7. Todos os PRs (descrição completa)

| PR | Data | Situação | Título |
| --- | --- | --- | --- |
| [#1](#pr-1) | 10/11/2026 | mesclado | Bloco Captação: Fase 0 (fundação, fontes, IBGE, temas, telas e camada de dados) |
| [#2](#pr-2) | 10/11/2026 | mesclado | Fase 1: coletores CAUC, SICONFI e Transferegov; fichas do Portal da Transparência e MDS |
| [#3](#pr-3) | 10/11/2026 | mesclado | Telas do bloco Captação com dados reais, detalhe das oportunidades, coletores e atualização diária |
| [#4](#pr-4) | 13/11/2026 | mesclado | Segurança: limite de tentativas de login, escape de JSON-LD, cabeçalhos/CSP e revisão dos 9 vetores |
| [#5](#pr-5) | 10/11/2026 | mesclado | Principal e Alertas com detalhes completos; rótulo de dados reais |
| [#6](#pr-6) | 10/11/2026 | mesclado | Guia Comparativo (capitais) e agenda iCalendar dos prazos |
| [#7](#pr-7) | 10/11/2026 | mesclado | Documentação: manual do usuário e especificação da guia Projetos |
| [#8](#pr-8) | 10/11/2026 | mesclado | Qualidade dos dados: guia, alertas de fonte com motivo e executor de coletores; coletor SINISA |
| [#9](#pr-9) | 10/11/2026 | mesclado | CNES e SINISA na guia Principal (depende do PR #8) |
| [#10](#pr-10) | 10/11/2026 | mesclado | Motor de parecer determinístico da guia Projetos (sem IA, sem gravar projetos) |
| [#11](#pr-11) | 10/11/2026 | mesclado | CNES e SINISA na guia Principal (traz para a main o conteúdo do PR #9) |
| [#12](#pr-12) | 10/11/2026 | mesclado | Guia Projetos: demonstração do parecer automático (exemplos fictícios, sem IA, sem gravar) |
| [#13](#pr-13) | 10/11/2026 | mesclado | Manual do usuário atualizado |
| [#14](#pr-14) | 10/11/2026 | mesclado | Testes de interface: Playwright carrega só *.spec.ts (28 testes passam no Chromium) |
| [#15](#pr-15) | 10/11/2026 | mesclado | Atualização mensal automática (INEP, SINISA e CNES) com status próprio das coletas |
| [#16](#pr-16) | 10/11/2026 | mesclado | Dados mensais atualizados (INEP, SINISA e CNES) - primeira execução automática |
| [#17](#pr-17) | 10/11/2026 | mesclado | Oportunidades: busca por necessidade |
| [#18](#pr-18) | 15/11/2026 | mesclado | GovNexa Fase 0: marca na plataforma, menu por módulos e município por configuração |
| [#19](#pr-19) | 15/11/2026 | mesclado | Rede de segurança: garantir a publicação da main na Vercel |
| [#20](#pr-20) | 15/11/2026 | mesclado | GovNexa Fase 1: Carteira de Projetos (importador, Carteira, Kanban, Gantt e Visão por órgão) |
| [#21](#pr-21) | 15/11/2026 | mesclado | Telas sem rolagem horizontal e Início de Projetos com resumo real |
| [#22](#pr-22) | 15/11/2026 | mesclado | README atualizado: GovNexa, Captação, rotinas e como colaborar |
| [#23](#pr-23) | 15/11/2026 | mesclado | GovNexa Fase 2 e 1.5: cronogramas, onde está parado, pendências de etapa e movimentação (simulação), banco preparado |
| [#24](#pr-24) | 15/11/2026 | mesclado | GovNexa: log do ciclo de vida do projeto (tela Histórico de alterações) |
| [#25](#pr-25) | 15/11/2026 | mesclado | GovNexa: guia Fluxo do sistema (diagrama BPMN interativo) |
| [#26](#pr-26) | 15/11/2026 | mesclado | Fluxo do sistema: exportar em PDF |
| [#27](#pr-27) | 15/11/2026 | mesclado | Carga real da planilha (temporária), tabelas responsivas no celular e correção do tema |
| [#28](#pr-28) | 15/11/2026 | mesclado | GovNexa: Sala de guerra (PMI) — missões e crises, quadro RAID e pauta de reunião |
| [#29](#pr-29) | 15/11/2026 | fechado sem merge | GovNexa: cadastro de projeto (tela Novo projeto) |
| [#30](#pr-30) | 15/11/2026 | mesclado | GovNexa: Novo projeto, fluxos detalhados com exceções, mapa de impacto, paginação compacta e Sala de guerra (incluir/retirar) |
| [#31](#pr-31) | 15/11/2026 | mesclado | Novo projeto fora do menu lateral |
| [#32](#pr-32) | 15/11/2026 | mesclado | Regras de trabalho no repositório (CLAUDE.md) |
| [#33](#pr-33) | 15/11/2026 | mesclado | GovNexa: Painel do prefeito (guia Gestão) |
| [#34](#pr-34) | 15/11/2026 | mesclado | GovNexa: Reunião semanal (pauta automática, decisões, ações e ata em PDF) |
| [#35](#pr-35) | 15/11/2026 | mesclado | GovNexa: Prazos da Lei 14.133 com dias úteis e metas internas |
| [#36](#pr-36) | 15/11/2026 | mesclado | Menu lateral: blocos que abrem e fecham |
| [#37](#pr-37) | 15/11/2026 | mesclado | Testes do menu lateral (celular com menu recolhido) |
| [#38](#pr-38) | 16/11/2026 | mesclado | Correção: religa o Painel do prefeito (guia Gestão) |
| [#39](#pr-39) | 16/11/2026 | mesclado | GovNexa: Mapa das obras no painel do prefeito, localização (ponto ou trechos) e fotos preparadas |
| [#40](#pr-40) | 16/11/2026 | mesclado | Mapa em branco no site: nomes de arquivo do build só hexadecimais |
| [#41](#pr-41) | 16/11/2026 | mesclado | Gestão › WhatsApp (simulação): números, permissões, relatório e perguntas |
| [#42](#pr-42) | 16/11/2026 | mesclado | Dependências entre etapas, Central de alertas, modelos do WhatsApp e obras sem localização |
| [#43](#pr-43) | 16/11/2026 | mesclado | Processos no SEI (simulação), Fluxo legível e menu com blocos fechados |
| [#44](#pr-44) | 16/11/2026 | mesclado | Fluxo: zoom e legenda recolhida |
| [#45](#pr-45) | 16/11/2026 | mesclado | Licitação em detalhe (simulação): fases da Lei 14.133 com as datas do SEI |
| [#46](#pr-46) | 16/11/2026 | mesclado | README: situação atual, funcionalidades, decisões e próximos passos |
| [#47](#pr-47) | 16/11/2026 | mesclado | README com história, princípios e roteiro; regra de README sempre atualizado |
| [#48](#pr-48) | 16/11/2026 | mesclado | Plano completo do GovNexa no repositório, para todos os envolvidos |

<a id="pr-1"></a>
### #1 — Bloco Captação: Fase 0 (fundação, fontes, IBGE, temas, telas e camada de dados)

mesclado em 10/11/2026 · branch `captacao-fase0`

#### O que muda
- **Menu:** novo bloco **Captação** com as guias Principal, Oportunidades, Acompanhamento, Alertas e Projetos (dados de exemplo, marcados como fictícios).
- **Documentação:** plano de execução, arquitetura, regras de alerta, CHANGELOG, esquema PostgreSQL (21 tabelas, validado em PostgreSQL 16 descartável) e 15 fichas de fontes oficiais com data de validação.
- **Coletores (Node/TypeScript):** tabela mestre do IBGE (5.571 municípios, 27 capitais) e CNPJs candidatos da Receita (carga completa ainda não incluída).
- **Configuração:** `data/config` com município piloto (Goiânia, IBGE 5208707), temas (14) e secretarias (15), ambos rascunho pendente de validação pela prefeitura.
- **Camada de dados:** `src/lib/dados` (lê JSON hoje; troca por PostgreSQL sem mudar as telas).
- **Workflow** `testar-portal-transparencia.yml`: valida o segredo `PORTAL_TRANSPARENCIA_CHAVE` mostrando só o código HTTP.

#### Decisões do dono
Arquitetura atual mantida (Astro + TypeScript + JSON); coletores em Node/TypeScript; GitHub Actions como agendador gratuito; banco futuro PostgreSQL; multimunicípio desde o início.

#### Verificação
- `npm run build`: 64 páginas, sem erros. `astro check`: 0 erros, 0 avisos, 0 sugestões.
- Telas do bloco revisadas visualmente pelo dono.
- Playwright (`npm test`) **não foi executado** nesta entrega.

#### Atenção na revisão
- Nenhuma chave ou credencial no código (`.env.example` sem valores; `data/raw/` fora do Git).
- Os dados de Captação nas telas são exemplos; nada vem ainda de fonte real.
- Alterações em arquivos existentes: `modules.json` (só acréscimos), `Platform.astro` e `[...module].astro` (ícones e textos das novas guias), `.gitignore`.

<a id="pr-2"></a>
### #2 — Fase 1: coletores CAUC, SICONFI e Transferegov; fichas do Portal da Transparência e MDS

mesclado em 10/11/2026 · branch `captacao-fase0-fechamento`

#### O que muda
- **Coletores (Node/TypeScript), todos testados para Goiânia (IBGE 5208707):**
  - `cauc.ts`: regularidade do município (CSV aberto do Tesouro); grava situação do dia e histórico de mudanças.
  - `siconfi.ts`: último RREO e RGF homologados; indicadores fiscais (despesa com pessoal, RCL, execução da receita).
  - `transferegov-convenios.ts`: propostas, convênios, desembolsos, empenhos, aditivos e emendas do município; separa esfera (municipal/estadual/OSC) e calcula **saldo a liberar = repasse pactuado − desembolsado** só para convênios em execução. Não coleta dados bancários.
- **Fichas de fontes:** Portal da Transparência (chave validada, campos reais), MDS (consulta pública com hCaptcha, não será contornada), CAUC, SICONFI e Transferegov atualizadas.
- **Workflows:** `explorar-portal-transparencia.yml` (imprime só nomes de campos e códigos HTTP; a chave nunca aparece).
- **Config:** `data/config/cauc-itens.json` (28 itens, do metadado oficial) e `data/core` do CAUC e SICONFI.

#### Resultado de destaque (esfera municipal, em execução)
19 convênios, R$ 107,6 mi pactuados, R$ 3,15 mi desembolsados, **R$ 104,5 mi a liberar**; 17 assinados sem nenhum desembolso. Conferência interna: 0 divergências entre o desembolso do convênio e a soma dos desembolsos.

#### Verificação
- Cada coletor foi executado de verdade contra a fonte oficial em 2026-11-09.
- **Pendente (aceite da Fase 1):** conferência manual de 10 convênios no site do Transferegov.
- Não foi feito `npm test` (Playwright); nenhuma tela foi alterada neste PR.

#### Atenção na revisão
- `data/core/transferegov-5208707.json` (5,6 MB) **não** está no PR: decidir com o dono onde guardar dados volumosos (Git x banco).
- Sem chaves ou credenciais no código; o segredo `PORTAL_TRANSPARENCIA_CHAVE` só é lido pelo GitHub Actions.

<a id="pr-3"></a>
### #3 — Telas do bloco Captação com dados reais, detalhe das oportunidades, coletores e atualização diária

mesclado em 10/11/2026 · branch `captacao-fase1-oportunidades`

#### O que muda
- **Telas do bloco Captação com dados reais** (Principal, Oportunidades, Acompanhamento e Alertas), via camada de dados (`src/lib/dados/`), cada uma mostrando fonte e data da coleta. A guia Projetos continua com exemplos.
- **Oportunidades: "Ver detalhes" explicativo** (59 programas): do que se trata, em linguagem simples, prazos, tipo de transferência, quem pode propor, temas/secretarias, **quem já propôs** (23.596 propostas históricas cruzadas), situação no CAUC, roteiro e documentos típicos.
- **Coletores:** programas abertos (com histórico de propostas), DOU (citações ao município/CNPJs), derivação do resumo de acompanhamento (`data/core/acompanhamento-*.json`, 105 KB).
- **Workflow `atualizar-dados`:** roda todo dia 09:30 (Brasília), coleta CAUC, SICONFI, FNS, programas e convênios, e grava só `data/core` na branch `dados-atualizados` (nunca na main). Testado: concluiu com sucesso. O IBGE dá timeout a partir dos servidores do GitHub e foi marcado como não bloqueante.
- Componentes compartilhados alterados de forma compatível: `DataTable.astro` (detalhe opcional por linha) e `Platform.astro` (diálogo rico; texto via `textContent`, links só `https://`).

#### Verificação
- `astro check`: 0 erros, 0 avisos. Build: 64 páginas. Workflow diário executado com sucesso no GitHub.
- **Não** foi executado `npm test` (Playwright).
- Revisão visual das telas feita pelo dono.

#### Atenção
- Os limites das regras de alerta (vigência 90/60/30/15, sem desembolso > 180 dias, prazo de programa ≤ 15 dias) são **provisórios**.
- Alertas e prazos são calculados na hora da publicação do site; republicar diariamente os mantém atuais.
- O arquivo completo do Transferegov (5,6 MB) e o do Portal da Transparência ficam fora do Git (`.gitignore`).

<a id="pr-4"></a>
### #4 — Segurança: limite de tentativas de login, escape de JSON-LD, cabeçalhos/CSP e revisão dos 9 vetores

mesclado em 13/11/2026 · branch `captacao-seguranca`

#### O que muda
Revisão dos 9 vetores da linha de base de segurança (detalhes e arquivo:linha em `docs/seguranca.md`).
- **Vetor 6/9, login sem limite de tentativas (corrigido):** `lib/rate-limit.ts` + `api/login.ts`. 5 falhas em 15 min por IP ou por e-mail bloqueiam por 1 min, dobrando a cada falha, teto de 1 h; não compara a senha enquanto bloqueado; mensagem não revela se o e-mail existe. Tela de entrada ganha a mensagem "Muitas tentativas".
- **Vetor 1, XSS (corrigido):** JSON-LD de `insights/[slug].astro` passa a escapar `<` (`\u003c`).
- **Cabeçalhos de segurança e CSP** em `vercel.json` (nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, HSTS, Content-Security-Policy).
- **Testes:** `npm run test:dados` agora tem 13 testes (7 de contrato dos dados + 6 do limitador). O endpoint de login também foi exercitado manualmente (6ª tentativa bloqueada, inclusive com a senha certa).

#### Atenção na revisão
- **Conferir a CSP na prévia da Vercel** (abrir o site, o login e as telas do bloco Captação). Se algo quebrar, relaxar a diretiva em `vercel.json`.
- O limite de tentativas usa memória da função (serverless): vale por instância. A proteção completa depende da regra de **Rate Limiting do Vercel Firewall** (passos em `docs/seguranca.md`).
- Recomendações que dependem do dono, sem alteração de código: migrar o hash da senha de SHA-256 simples para PBKDF2/scrypt; ativar 2FA na Vercel e no GitHub.
- Não foi executado `npm test` (Playwright).

<a id="pr-5"></a>
### #5 — Principal e Alertas com detalhes completos; rótulo de dados reais

mesclado em 10/11/2026 · branch `captacao-detalhes-principal`

Detalhe de cada indicador da guia Principal (lista dos convênios, de onde vêm os saldos por concedente e por convênio, CAUC item a item, SICONFI, FNS, programas, DOU) e detalhe de cada alerta (por que foi gerado, regra, números e o que fazer). Tabelas com dados reais passam a exibir 'dados reais de fontes oficiais' no lugar de 'dados de exemplo'. Refatoração: alertas, principal e tipos separados em módulos da camada de dados (src/lib/dados). Verificação: astro check 0 erros; build 64 páginas; npm run test:dados. Não foi executado npm test (Playwright).

<a id="pr-6"></a>
### #6 — Guia Comparativo (capitais) e agenda iCalendar dos prazos

mesclado em 10/11/2026 · branch `captacao-comparativo-agenda`

Nova guia **Comparativo** (menu Captação): repasses de saúde do FNS às 27 capitais por habitante, com detalhe por capital e, no de Goiânia, os grupos de repasse que outras capitais recebem e Goiânia não, e onde Goiânia recebe bem menos por habitante (ex.: atenção primária R$ 71,50 por habitante contra mediana de R$ 111,79 das capitais).

**Agenda iCalendar** em /plataforma/agenda.ics (importável no Google Agenda/Outlook): 114 eventos (fim de vigência de convênios, limite de prestação de contas, vencimento de itens do CAUC e prazos de programas), com lembretes de 30 e 7 dias. Fica sob /plataforma/, protegida pelo login existente; nenhum arquivo de login foi alterado.

Verificação: astro check 0 erros; build 65 páginas; .ics conferido (114 eventos, UIDs únicos, linhas dobradas em até 75 octetos). Não foi executado npm test (Playwright).

<a id="pr-7"></a>
### #7 — Documentação: manual do usuário e especificação da guia Projetos

mesclado em 10/11/2026 · branch `captacao-docs`

Somente documentação (nenhum código alterado):
- `docs/manual-usuario.md`: manual do bloco Captação para a equipe de captação e gestores (guias, alertas, fontes, glossário, FAQ e limites).
- `docs/projetos-ia.md`: especificação da guia Projetos (Fase 4): fluxo e estados, telas, modelo de dados, pipeline RAG com regras anti-alucinação, 21 regras determinísticas de parecer, segurança (prompt injection, LGPD) e plano de entrega em 8 etapas (MVP sem IA primeiro), com perguntas em aberto para o dono.

<a id="pr-8"></a>
### #8 — Qualidade dos dados: guia, alertas de fonte com motivo e executor de coletores; coletor SINISA

mesclado em 10/11/2026 · branch `captacao-qualidade`

**Regra do dono:** sempre sinalizar dados defasados, entender o motivo e corrigir.

- **Nova guia Qualidade dos dados** (menu Captação): por fonte, última coleta, referência, idade, limite, situação (Em dia / Atenção: defasada / Vencido: muito defasada / Atenção: falha na coleta / Sem carga) e **o motivo** (ex.: falha da última coleta com a mensagem de erro, carga manual pendente, PR de dados ainda não mesclado), com a ação recomendada e link da ficha técnica.
- **Alertas de fonte** agora usam esses limites (por fonte, 2x = muito defasada, gravidade Alta) e dizem o motivo e o que fazer.
- **Executor de coletores** `coletores/rodar.ts`: 3 tentativas e registro do resultado e do motivo da falha em `data/core/status-coletas.json` (sem caminhos de disco). A atualização diária passa a usá-lo.
- **Coletor SINISA** (saneamento: água, esgoto, resíduos, drenagem de Goiânia, ano 2024) com ressalvas marcadas em três indicadores suspeitos (disposição final inadequada, coleta seletiva e perdas), que não devem ser exibidos como fato sem conferência.
- Testes: `npm run test:dados` (11 testes, incluindo a classificação de defasagem).

Verificação: astro check 0 erros; build 66 páginas; executor testado com coletor que funciona e com um que falha. Nenhum arquivo de login alterado. Não foi executado npm test (Playwright).

Observação: este PR e o #6 mexem nas mesmas linhas de menu/intro; se aparecer conflito ao mesclar o segundo, me avise que eu resolvo.

<a id="pr-9"></a>
### #9 — CNES e SINISA na guia Principal (depende do PR #8)

mesclado em 10/11/2026 · branch `captacao-saude-saneamento`

Liga os dados de **saúde (CNES)** e de **saneamento (SINISA)** à guia Principal, com detalhe completo:
- **Rede de saúde (CNES):** 4.494 estabelecimentos ativos, 88 UBS, 8 UPAs, 125 hospitais, 7.638 leitos (3.928 SUS) e 1.197 de UTI, por natureza jurídica e com a ressalva de interpretação (esfera/gestão indicam quem gere, não quem é dono).
- **Saneamento (SINISA 2024):** água, esgoto, resíduos e drenagem com código de cada indicador. **Três indicadores suspeitos aparecem com a ressalva** (disposição final inadequada 100%, coleta seletiva igual à coleta total, perdas totais menores que as de faturamento) e não devem ser tratados como fato sem conferir com a prefeitura.
- **LGPD:** a lista nominal do CNES tem 2.047 unidades, sem consultórios isolados nem pessoa física (só contagens); teste de contrato impede regressão.
- Testes: 13 passam. astro check 0 erros; build 66 páginas. Nenhum arquivo de login alterado.

**Base deste PR é a branch do PR #8** (usa as funções de dados que ele cria). Mescle o #8 primeiro; este passa a apontar para a main automaticamente.

<a id="pr-10"></a>
### #10 — Motor de parecer determinístico da guia Projetos (sem IA, sem gravar projetos)

mesclado em 10/11/2026 · branch `captacao-parecer`

Implementa o motor de **parecer automático** (Fase 4, etapa sem IA) como funções puras em `src/lib/projetos`: 21 regras R01 a R21 (regularidade no CAUC por item, prazo da proposta, elegibilidade do município, meta sem indicador, indicador sem linha de base, cronograma coerente, valor global = repasse + contrapartida, contrapartida mínima, faixa de valor do programa, despesa de pessoal x limites da LRF, seções obrigatórias, bloco de IA não revisado, citação de fonte, frescor das fontes (alerta > 30 dias; bloqueante > 60 dias), hash do conteúdo aprovado). Dado ausente nunca conta como ok. `prontoParaEnvio` exige parecer completo e aprovação registrada.

**Não grava nada** (decisão do dono: manter projetos reais fora do repositório até novo direcionamento) e não tem interface ainda; há 2 projetos de **exemplo fictício** para teste.

Verificação: 27 testes passam (`node --test tests/projetos/parecer.test.ts`); astro check 0 erros. Nenhum arquivo de login alterado.

**Decisão em aberto para o dono:** quando o requisito do programa (valor mínimo, contrapartida, documentos) não foi confirmado pela prefeitura, as regras R08 a R11 viram *alerta* (podem ser justificadas), como propõe a especificação. Se preferir mais rigor, é só trocar para *bloqueante*.

<a id="pr-11"></a>
### #11 — CNES e SINISA na guia Principal (traz para a main o conteúdo do PR #9)

mesclado em 10/11/2026 · branch `captacao-qualidade`

O PR #9 foi mesclado na branch `captacao-qualidade` (base dele) depois que o #8 já tinha ido para a main; por isso o conteúdo do #9 **ainda não está na main**. Este PR leva para a main só essa diferença:

- **CNES** (rede de saúde: 4.494 estabelecimentos ativos, 7.638 leitos) e **SINISA** (saneamento 2024, com as ressalvas dos 3 indicadores suspeitos) na guia Principal, com detalhe completo.
- Coletor do CNES, dados, ficha técnica e testes de contrato (inclui o de LGPD: sem consultório isolado nem pessoa física na lista nominal).

Verificação: 13 testes passam; astro check 0 erros; build 66 páginas. Nenhum arquivo de login alterado.

<a id="pr-12"></a>
### #12 — Guia Projetos: demonstração do parecer automático (exemplos fictícios, sem IA, sem gravar)

mesclado em 10/11/2026 · branch `captacao-projetos-ui`

A guia **Projetos** deixa de ser só exemplo estático e passa a mostrar o **parecer automático** (motor do PR #10) sobre 2 projetos **fictícios**: um com 100% das regras e pronto para envio, outro com 19% e 10 pendências bloqueantes. No "Ver detalhes": resultado, bloqueantes, alertas, regras atendidas e como corrigir cada falha.

Decisões do dono respeitadas: **sem IA** e **nenhum projeto real é gravado**.

Este PR **inclui o motor de parecer (merge do #10)**: se o #10 for mesclado antes, o diff fica só com a guia. Verificação: astro check 0 erros; build 66 páginas; 27 testes do motor passam. Nenhum arquivo de login alterado.

<a id="pr-13"></a>
### #13 — Manual do usuário atualizado

mesclado em 10/11/2026 · branch `captacao-manual`

Somente documentação. O manual do bloco Captação passa a cobrir as 7 guias (inclui Comparativo, Qualidade dos dados e Projetos), os novos indicadores da Principal (educação, rede de saúde e saneamento, com as ressalvas), a agenda iCalendar e as rotinas diária e mensal de atualização.

Atenção: a seção de **Projetos** descreve o parecer automático que entra com o PR #12; se o #12 ainda não estiver mesclado, a tela pode ainda mostrar só exemplos estáticos.

<a id="pr-14"></a>
### #14 — Testes de interface: Playwright carrega só *.spec.ts (28 testes passam no Chromium)

mesclado em 10/11/2026 · branch `captacao-testes-e2e`

Corrige a configuração do Playwright: os testes de dados e de qualidade (`*.test.ts`, que usam `node:test`) estavam sendo carregados também pelo `npm test` e o quebrariam. Agora só `*.spec.ts`.

Primeira execução dos testes de interface nesta máquina (Chromium, build de produção, porta 4322): **28 de 28 passaram**, incluindo todas as guias do bloco Captação (um h1, sem rolagem horizontal) em 1280 e 375 px, acessibilidade (axe), tabelas, menu, tema e a tela de entrada. WebKit não foi executado. Nenhum arquivo de login alterado.

<a id="pr-15"></a>
### #15 — Atualização mensal automática (INEP, SINISA e CNES) com status próprio das coletas

mesclado em 10/11/2026 · branch `captacao-mensal`

Nova rotina `atualizar-dados-mensais` no GitHub Actions: roda no dia 5 de cada mês (08:00 em Brasília) e sob demanda; coleta **educação (INEP)**, **saneamento (SINISA)** e **saúde (CNES)**, grava só `data/core` na branch `dados-mensais-atualizados` e tenta abrir um PR (o merge, que republica o site, é do dono).

- O executor de coletores aceita um arquivo de status próprio (`RODAR_STATUS`), então a rotina mensal não disputa `status-coletas.json` com a diária; a camada de dados junta os dois e a guia **Qualidade dos dados** mostra falhas e motivos de ambas.
- **Testado de ponta a ponta no GitHub:** INEP em 3 min, SINISA em 1,5 min, CNES em ~20 min; o resultado gerou a branch de dados e os testes de contrato passam nela (inclui o de LGPD do CNES). Validado também com o actionlint.

Nenhum arquivo de login alterado.

<a id="pr-16"></a>
### #16 — Dados mensais atualizados (INEP, SINISA e CNES) - primeira execução automática

mesclado em 10/11/2026 · branch `dados-mensais-atualizados`

Dados gerados pela primeira execução real da rotina mensal no GitHub Actions: CNES (lista nominal sem consultórios isolados e sem pessoa física), SINISA e o status das coletas mensais. Somente dados em `data/core`; nenhum código alterado. Os testes de contrato passam nesta branch (9 testes). Ao mesclar, o site é republicado com esses dados.

<a id="pr-17"></a>
### #17 — Oportunidades: busca por necessidade

mesclado em 10/11/2026 · branch `captacao-busca`

A busca da tabela de **Oportunidades** passa a funcionar por necessidade: aceita **várias palavras** (todas precisam aparecer, ignorando acentos e palavras de 1 a 2 letras) e olha também um texto oculto por linha com **temas, sinônimos e o texto oficial do programa**. Exemplos: `drenagem` (2 programas), `creche` (6), `escola tempo integral` (6), `saneamento esgoto` (4), `ônibus` (4).

Mudança compatível: as demais tabelas continuam buscando no que aparece na linha (o texto oculto é opcional). Verificação: astro check 0 erros; build 66 páginas; 28 testes de interface passam (Chromium). Nenhum arquivo de login alterado.

<a id="pr-18"></a>
### #18 — GovNexa Fase 0: marca na plataforma, menu por módulos e município por configuração

mesclado em 15/11/2026 · branch `govnexa-fase0`

#### Resumo
Primeira fase do **GovNexa — Inteligência para a gestão pública**, o novo nome do sistema, organizado em módulos independentes e integrados (Projetos, Captação, Licitações, Gestão). Esta fase só prepara a base, **dentro da área `/plataforma`**. Visão geral para quem trabalha no código: `docs/govnexa/visao-geral.md`.

#### O que muda
- **Marca centralizada** em `src/lib/marca.ts`. A plataforma mostra GovNexa no título, no cabeçalho e no rodapé. **O site público e a tela de login não mudam** (continuam "Atlas Goiânia Conecta"); para trocar depois, basta `USAR_NO_SITE_PUBLICO = true`.
- **Menu lateral por módulo** (Projetos, Captação, Licitações, Gestão, Conta), montado por `src/lib/govnexa/catalogo.ts`. As guias atuais de licitações (Operação, Planejamento, Preços, Automação, Mercado, Cadastros) ficam agrupadas em **Licitações**, sem alterar `src/data/modules.json`. Se um grupo novo for criado em `modules.json`, basta ligá-lo a um módulo em `GRUPO_PARA_MODULO`; o teste avisa se faltar.
- Removido o texto **"Área do comprador"**.
- Páginas novas `/plataforma/projetos/` (roteiro das fases) e `/plataforma/gestao/` (módulos ativos).
- **Município por configuração:** nome de exibição e logo vêm de `data/config/municipio.json` (`src/lib/municipio-ativo.ts`), preparando o uso por outras prefeituras.
- Documentos `docs/govnexa/visao-geral.md` e `docs/govnexa/modelo-dados.md` (modelo para PostgreSQL com isolamento por prefeitura e formato JSON do MVP; nenhum banco é criado).
- `.gitignore`: a pasta local `Doc Referencia/` (insumos internos) nunca é publicada.

#### Não muda
Login (`api/`, `lib/`, `middleware.ts`, `src/pages/entrar.astro`), `vercel.json`, páginas públicas, `src/data/modules.json`, `Marketplace`, chaves de `localStorage`.

#### Testes
- `npx astro check`: 0 erros
- `npm run build`: 68 páginas
- `npm run test:dados`: 24 de 24 (inclui `tests/govnexa/catalogo.test.ts`)
- `npx playwright test --project=chromium`: 29 de 29 (inclui "govnexa: marca e módulos na plataforma")
- Revisão de segurança (9 vetores): sem rota, entrada, pacote ou credencial nova; conteúdo estático.

#### Observado (já existia antes)
O rodapé da plataforma fica atrás da barra lateral em páginas curtas, e tabelas com texto longo cortam a última coluna.

<a id="pr-19"></a>
### #19 — Rede de segurança: garantir a publicação da main na Vercel

mesclado em 15/11/2026 · branch `govnexa-publicacao`

#### Por quê
O merge do PR #18 (15/11, 14h18) não disparou a publicação na Vercel: o commit `5d028f4` da `main` ficou sem status de deploy, e o site continuou com a versão de 13/11. A prévia da branch foi gerada normalmente, então o código não é a causa: o aviso do GitHub à Vercel se perdeu.

#### O que faz
`.github/workflows/garantir-publicacao.yml`, a cada push na `main` (ou acionado à mão):
1. Espera a Vercel marcar o commit (até ~6 min) e, se estiver publicando, espera terminar.
2. Publicou com sucesso: só registra no resumo.
3. Não publicou: aciona o **Deploy Hook** guardado no segredo `VERCEL_DEPLOY_HOOK`.
4. Sem o segredo: o job falha com um resumo explicando o que fazer, e o GitHub avisa por e-mail.

#### Segurança
- Permissões só de leitura (`contents: read`, `statuses: read`).
- A URL do gancho fica só no segredo e nunca é impressa no log.
- Validado com `actionlint` (inclui shellcheck), sem erros.

#### Depende do dono da conta da Vercel
Criar o gancho: projeto **atlas-conecta** > **Settings** > **Git** > **Deploy Hooks** (branch `main`), e guardá-lo em **Settings** > **Secrets and variables** > **Actions** como `VERCEL_DEPLOY_HOOK`.

<a id="pr-20"></a>
### #20 — GovNexa Fase 1: Carteira de Projetos (importador, Carteira, Kanban, Gantt e Visão por órgão)

mesclado em 15/11/2026 · branch `govnexa-fase1`

#### Resumo
Primeira entrega do módulo **Projetos** do GovNexa: a Carteira de Projetos que substitui a planilha de obras prioritárias. **Este PR traz só código e dados fictícios**; a carteira real entra depois, por decisão do dono (ver "Dados").

#### O que entra
- **Contrato de dados** (`src/lib/carteira/tipos.ts`, `macroetapas.ts`, `carga.ts`): as 7 macroetapas oficiais da planilha (00 Em estruturação … 06 Conclusão); leitura única da carteira, que procura `GOVNEXA_DADOS_DIR`, depois `.govnexa-dados/<IBGE>/` (baixado no build) e por fim `data/exemplo/carteira/` (fictício).
- **Importador** (`npm run importar:carteira -- --planilha <arquivo.xlsx> [--saida <pasta>] [--anonimizar]`): lê a aba PIPELINE (carteira oficial) e casa a BASE_OPERACIONAL por SEI e nome; colunas por cabeçalho; datas, números e SEI normalizados; pendências de dado por projeto; relatório de conciliação (`importacao.json` e `conciliacao.md`). Roda só no computador de quem importa (usa `exceljs` como devDependency).
- **Baixa de dados no build** (`scripts/baixar-dados.mjs`): com `GOVNEXA_DADOS_REPO` e `GOVNEXA_DADOS_TOKEN`, baixa a carteira de um repositório privado; sem as variáveis, usa o exemplo; se o download falhar, o build falha e a versão anterior continua no ar. O token nunca aparece no log.
- **Telas** no módulo Projetos: **Carteira** (tabela com busca e ficha completa), **Kanban por macroetapa** (quantidade e valor no topo de cada coluna, filtro por órgão), **Gantt geral** (linha do tempo por macroetapa, filtros, linha de hoje) e **Visão por órgão** (pronta para imprimir/salvar em PDF).
- `DataTable`: valor ausente aparece como "—" (antes podia mostrar "R$ NaN").

#### Testes
- `npx astro check`: 0 erros
- `npm run test:dados`: 38 de 38 (importador com planilha sintética, visões, catálogo)
- `npx playwright test --project=chromium`: 30 de 30 (inclui axe claro/escuro no Kanban e no Gantt e ausência de rolagem horizontal em 375px e 1280px)
- Conferido também com a carteira real **anonimizada, só localmente** (334 projetos): Kanban, Gantt, Visão por órgão e ficha funcionando.

#### Segurança
Sem rota, formulário ou credencial nova no site; os dados aparecem só dentro de `/plataforma` (atrás do login); nenhum `innerHTML` com dados; nenhum dado real ou nome de pessoa no repositório. `.govnexa-dados/` está no `.gitignore`.

#### Dados (pendente de decisão do dono)
Onde a carteira real fica: repositório público com dados anonimizados e aviso de retirada, repositório público completo, ou repositório privado lido no build.

<a id="pr-21"></a>
### #21 — Telas sem rolagem horizontal e Início de Projetos com resumo real

mesclado em 15/11/2026 · branch `govnexa-carteira-sem-rolagem`

#### O que muda
- **Regra de interface do GovNexa:** tabelas da plataforma cabem na largura, sem rolagem horizontal. O texto quebra linha; a coluna de ações não. Teste automático em 1280px nas guias de Projetos, Gestão e Captação.
- **Carteira:** colunas curtas (Situação mostra só Verde/Amarelo/Vermelho; o motivo está na ficha).
- **Captação:** Oportunidades sem a coluna Modalidade e Acompanhamento sem Valor liberado na tabela (as duas informações continuam na ficha); títulos Pactuado / A liberar.
- **Projetos · Início:** resumo real da carteira por macroetapa (quantidade, valor, verde/amarelo/vermelho) no lugar do roteiro de desenvolvimento, que não faz parte da aplicação.
- Botão "Novo registro" (protótipo, não grava) oculto em Projetos e Gestão até o cadastro real.

#### Observação para as guias de Licitações
Com a quebra de linha, a rolagem caiu muito, mas ainda sobra em Gestão Pública, Banco de preços e Atas (telas do módulo de licitações, não alteradas aqui).

#### Testes
`astro check` 0 erros; `test:dados` 38/38; Playwright (Chromium) 31/31.

<a id="pr-22"></a>
### #22 — README atualizado: GovNexa, Captação, rotinas e como colaborar

mesclado em 15/11/2026 · branch `atualiza-readme`

Reescreve o README, que ainda descrevia a primeira versão (24 módulos fictícios).

- O que existe hoje: site público, login, Projetos/Carteira (Fase 1), Captação, Licitações demonstrativo
- Como rodar localmente e todos os comandos (incluindo `test:dados` e `importar:carteira`)
- Fluxo de colaboração por ramo e PR
- Rotinas do GitHub Actions, nomes das variáveis (sem valores) e índice da documentação

Só documentação; nenhum código alterado.

<a id="pr-23"></a>
### #23 — GovNexa Fase 2 e 1.5: cronogramas, onde está parado, pendências de etapa e movimentação (simulação), banco preparado

mesclado em 15/11/2026 · branch `govnexa-fase2`

#### Resumo
Entrega a parte de leitura da **Fase 2 (cronograma e equipe)** e a **etapa 1.5 (movimentação do projeto)** em modo simulação, com tudo preparado para o PostgreSQL. **Só código e dados fictícios**; nenhum dado real no repositório.

Requisitos das transcrições atendidos: "com quem está a tarefa", "em que ponto está a contratação", "onde está parado", "o projeto anda ou volta pelo Kanban ou pela área de pendências, pela mesma regra".

#### Cronogramas (Fase 2, leitura)
- `npm run importar:cronogramas -- --planilha <GEPP.xlsx> [--saida] [--carteira] [--anonimizar]`: lê uma aba por projeto (ignora cópias/modelos e a legenda), fase = linha em negrito sem responsável, etapas com unidade e responsável, status calculado, ciclos ("2ª entrega"), pendências de dado e casamento com a carteira (SEI ou nome).
- Telas: **Cronogramas** (ritmo realizado × previsto), página **/plataforma/cronograma/<id>/** (linha do tempo, quadro de tarefas, pendências de dado), **Onde está parado** (por unidade e por responsável) e seção "Cronograma detalhado" na ficha da carteira.

#### Movimentação (1.5) — MODO SIMULAÇÃO
- Motor puro (`src/lib/carteira/movimentacao.ts`): avançar uma etapa com conferência de requisitos, voltar com motivo, pular ou passar sem requisitos só forçando com motivo, aprovar/reprovar pendência, novo passo, edição de campos permitidos (valor e prioridade com motivo); histórico de cada evento.
- **Kanban** com arrastar e botão **Mover** (alternativa por teclado) e página **Pendências de etapa** (Aprovar avança, Reprovar volta com motivo). Aviso fixo: nada é gravado até o banco existir.

#### Banco preparado (não ligado)
- `src/lib/repositorio`: interface única; JSON hoje (gravação indisponível), PostgreSQL pronto sem driver (consultas parametrizadas, transação, `app.prefeitura_id`).
- `db/migracoes/001_govnexa_carteira.sql` (RLS por prefeitura, papel `govnexa_app`, histórico imutável) e `scripts/gerar-sql-carga.ts`. Validado em `postgres:16`: carga idempotente, outra prefeitura vê 0 linhas, `DELETE` no histórico negado.

#### Testes
`astro check` 0 erros · `test:dados` 76/76 · Playwright (Chromium) 32/32, com axe claro/escuro e sem rolagem horizontal nas telas novas. Conferido também com dados reais anonimizados, só localmente.

#### Segurança
Sem rota de API nova; links internos do diálogo de detalhes limitados a `/plataforma/...`; nada de `innerHTML` com dados; nenhum dado real ou nome de pessoa no repositório.

<a id="pr-24"></a>
### #24 — GovNexa: log do ciclo de vida do projeto (tela Histórico de alterações)

mesclado em 15/11/2026 · branch `govnexa-log`

#### O que entra
Pedido do dono: **log de toda alteração no ciclo de vida do projeto, do início ao fim, com tela para ver o que foi feito, por quem, quando, com filtros.**

- **Tela Projetos › Histórico de alterações:** data e hora (horário de Brasília), projeto, ação, o que mudou (antes → depois), por quem, origem (Kanban, ficha, pendências, SEI, planilha); linha com detalhes (motivo, forçado, todos os campos); filtros por período, projeto, pessoa, ação, origem e texto; **Exportar CSV** do que está filtrado (protegido contra fórmulas); 25 por página; `?projeto=P-123` já filtra.
- **Ficha do projeto:** seção Histórico com as 5 últimas alterações e o link para o log filtrado.
- **Cargas da planilha no log:** `npm run importar:carteira -- --planilha X --autor "Nome"` compara com a carga anterior e registra incluídos, retirados, campos e etapas alterados.
- **Simulações** (Kanban/Pendências) aparecem no topo com o selo "Simulação (não gravado)", só na sessão do navegador.
- **Banco preparado (não ligado):** `002_govnexa_log.sql` com `evento_sistema` e a visão `log_alteracoes` (RLS por prefeitura, sem UPDATE/DELETE: o log é imutável).

#### Limitação conhecida
Com o login atual (senha única), o "por quem" das ações na tela só será a pessoa real com os perfis individuais (Fase 3, com o banco). Hoje: autor da importação e "Simulação".

#### Testes
`astro check` 0 erros · `test:dados` 88/88 · Playwright (Chromium) 33/33 (axe claro/escuro, sem rolagem horizontal) · SQL validado em postgres:16 (idempotência, RLS, DELETE/UPDATE negados).

<a id="pr-25"></a>
### #25 — GovNexa: guia Fluxo do sistema (diagrama BPMN interativo)

mesclado em 15/11/2026 · branch `govnexa-fluxo`

#### O que entra
Pedido do dono: **diagrama de fluxo do sistema, do início ao fim, para validar com as áreas e o cliente; clicar em cada caixa mostra o que é feito e validado ali e leva à tela correspondente.**

- **Projetos › Fluxo do sistema** (2ª guia de Projetos): 6 raias (Fontes e integrações, Captação, Projetos, Contratação, Execução e entrega, Gestão e controle), 28 etapas e 31 ligações no estilo BPMN (início, etapa, decisão, fim; linha contínua = fluxo, tracejada = apoio).
- Cada etapa mostra a **situação no sistema** (disponível, simulação ou planejado) pela borda **e** por texto.
- **Clique ou Enter** numa etapa: o que é feito, o que é validado, quem (papéis), fase do roteiro, etapas anteriores e próximas (navegáveis) e botões **Abrir: <tela>**.
- **Lista das etapas** por raia abaixo do diagrama (leitura, impressão e leitor de tela); impressão em A4.
- Conteúdo em `src/lib/govnexa/fluxo.ts`, escrito a partir das transcrições, das planilhas-base e do plano.

**Inclui os commits do PR #24 (log).** Mesclar #24 antes, ou só este.

#### Testes
`astro check` 0 erros · `test:dados` 88/88 · Playwright (Chromium) 34/34 (28 etapas, diálogo, links, teclado, sem rolagem horizontal em 1280/375px, axe claro/escuro).

<a id="pr-26"></a>
### #26 — Fluxo do sistema: exportar em PDF

mesclado em 15/11/2026 · branch `govnexa-fluxo-pdf`

#### O que entra
- Botão **Exportar em PDF** na guia Projetos › Fluxo do sistema: abre a impressão do navegador (Destino: *Salvar como PDF*), com nome de arquivo sugerido `Fluxo do sistema - GovNexa - AAAA-MM-DD`.
- **Página 1:** cabeçalho (GovNexa, prefeitura, data), legenda compacta e o diagrama inteiro.
- **Páginas seguintes:** detalhe de cada uma das 28 etapas por raia: situação e fase, o que é feito, o que é validado, quem, próximas etapas e telas — material para validar com as áreas.
- Sem biblioteca nova; na tela nada muda além do botão.

#### Testes
`astro check` 0 erros · Playwright (Chromium) 35/35 (botão visível; em modo impressão o anexo aparece com 28 etapas e o botão some). PDF conferido: 9 páginas A4.

<a id="pr-27"></a>
### #27 — Carga real da planilha (temporária), tabelas responsivas no celular e correção do tema

mesclado em 15/11/2026 · branch `govnexa-carga-real`

#### O que entra
- **Carga real** (decisão do dono): `data/carga-real/5208707/` com os **334 projetos** da planilha de obras prioritárias (PIPELINE + BASE_OPERACIONAL), os **13 cronogramas do GEPP** e o histórico da carga, **completos**, publicados **temporariamente** no repositório público. Aviso fixo na plataforma: *serão retirados em breve*. `data/carga-real/LEIA-ME.md` explica.
- O sistema lê a carga real antes do exemplo; **os testes usam sempre os dados fictícios** (`scripts/build-exemplo.mjs`, `GOVNEXA_EXEMPLO=1`).
- **Celular:** cada linha das tabelas vira um **cartão** com o rótulo de cada campo (sem rolagem horizontal). Conferido em 390px nas guias de Projetos, Captação, Licitações e Gestão.
- **Correção:** ao trocar de guia, o tema claro/escuro voltava ao do sistema operacional. Agora o tema escolhido se mantém. Teste automático que falhava antes da correção e passa depois.

#### Testes
`astro check` 0 erros · `test:dados` 88/88 · Playwright (Chromium) 36/36.

<a id="pr-28"></a>
### #28 — GovNexa: Sala de guerra (PMI) — missões e crises, quadro RAID e pauta de reunião

mesclado em 15/11/2026 · branch `govnexa-sala`

#### O que entra
Pedido do dono: **Sala de guerra pela metodologia do PMI**, para projetos ou situações que pedem a equipe reunida e foco numa missão ou crise.

- **Projetos › Sala de guerra:** *Em sala agora* (missões e crises abertas: objetivo, prazo com contagem, responsável, cadência, escalonamento equipe/secretário/gabinete, farol com motivo, contagem do RAID); *Candidatos à sala*, sugeridos pelo sistema a partir dos dados (prioridade alta com prazo vencido, cronograma em ritmo vermelho, etapa parada há mais de 30 dias, contratação com saldo sem fonte, entrega próxima em risco); *Encerradas* com resultado e lições aprendidas.
- **Página de cada sala:** quadro RAID (riscos, ações com responsável/prazo e vencidas marcadas, problemas, decisões), indicadores, marcos, **modo reunião** com pauta gerada automaticamente, reuniões anteriores e exportar em PDF.
- No **Fluxo** (raia Gestão e controle) e no **Histórico de alterações**.
- Abrir sala, novos itens e reuniões em **modo simulação** até o banco.
- Com a carga real, as salas fictícias de exemplo não aparecem (citariam projetos inexistentes); com a carga real são **25 candidatos**.

**Inclui os commits do PR #27** (carga real, celular, tema). Mesclar o #27 antes, ou só este.

#### Testes
`astro check` 0 erros · `test:dados` 102/102 · Playwright (Chromium) 37/37. Conferido com dados reais em 1280px e 390px, sem rolagem horizontal.

<a id="pr-29"></a>
### #29 — GovNexa: cadastro de projeto (tela Novo projeto)

fechado sem merge em 15/11/2026 · branch `govnexa-novo-projeto`

#### O que entra
Pedido do dono: **onde se inicia / cadastra um projeto.**

- Botão **Novo projeto** em **Projetos · Início** e na **Carteira de projetos**, que leva a **Projetos › Novo projeto**.
- Formulário com os **campos da planilha**, em blocos: identificação (nome, órgão, responsável, tipo, detalhamento, região, bairro, SEI, observação), **compromisso** (decidido; condicionado: só executa se vier recurso externo; ideia), valores e origem do valor, recurso (origem, programa, unidade financiadora, termo), prioridade e contratação, datas previstas de cada macroetapa.
- O projeto nasce em **00 – Em estruturação**; obrigatórios: nome e órgão; o que faltar vira pendência de dado.
- **Modo simulação** até o banco: valida, mostra como o projeto ficaria e registra "Projeto incluído" no Histórico de alterações (simulação).
- Preparado para o banco: `criarProjeto` no motor e no repositório PostgreSQL (consultas parametrizadas) e `db/migracoes/003_govnexa_compromisso.sql`.
- **Fluxo atualizado:** a etapa "Cadastro do projeto" leva à tela Novo projeto.

#### Testes
`astro check` 0 erros · `test:dados` 108/108 · Playwright (Chromium) 38/38 (inclui "govnexa: novo projeto": botão em Início e Carteira, erros de nome/órgão, simulação em 00 – Em estruturação, registro no histórico, sem rolagem horizontal em 1280/390, axe claro/escuro).

<a id="pr-30"></a>
### #30 — GovNexa: Novo projeto, fluxos detalhados com exceções, mapa de impacto, paginação compacta e Sala de guerra (incluir/retirar)

mesclado em 15/11/2026 · branch `govnexa-cadastro`

#### O que entra (PR único, a pedido do dono)
1. **Novo projeto** (Projetos › Novo projeto; botão em Início e Carteira): campos da planilha em blocos, compromisso (decidido, condicionado a recurso externo, ideia), nasce em 00 – Em estruturação; obrigatórios nome e órgão; em simulação até o banco (motor, repositório PostgreSQL e migração 003 prontos). Campos em 3/2/1 colunas conforme a tela; foco e rolagem até o resultado.
2. **6 fluxos detalhados** (`/plataforma/fluxo/<id>/`): Cadastro do projeto, Projeto × oportunidade (nos dois sentidos), Mudança de etapa, Cláusula suspensiva, Licitação (fase externa) e Sala de guerra — cada um com diagrama, lista e PDF. No mapa geral: selo "+ detalhe", botão "Ver fluxo detalhado" e seção com os 6.
3. **Exceções aceitas e registradas**: forma própria (hexágono tracejado, texto "exceção") com "Aceita quando" e "O que fica registrado"; no Histórico, filtro **Somente exceções** (`?excecoes=1`) e selo "Exceção".
4. **Mapa geral**: decisão nova **Oportunidade tem projeto na carteira?** — sim: usar no projeto; não: sugerir novo projeto (liga ao Cadastro).
5. **Mapa de impacto**: `npm run impacto` lista as etapas do Fluxo afetadas pelas mudanças e avisa se o Fluxo não foi revisado; testes de garantia (toda tela no Fluxo, todo link do Fluxo abre, toda etapa com mapa de impacto, toda exceção com regra de registro).
6. **Paginação compacta** em todas as tabelas: `1 2 3 4 5 6 … 34`, janela que acompanha a página (3 no celular).
7. **Sala de guerra**: incluir projeto (busca por nome, ID, órgão, SEI), retirar com motivo, incluir candidato em sala aberta, linha **"Sugerido porque…"**; fluxo detalhado da sala atualizado.
8. **Correção importante**: um bloco de estilo de impressão sem fechamento fazia regras valerem só na impressão (incluindo os **cartões das tabelas no celular**, hoje quebrados no ar). Corrigido.

#### Impacto (`npm run impacto`)
Etapas afetadas: cadastro, casamento, fim, log, movimentação, portão, sala; transversal: layout, catálogo, estilos, página de módulos; **Fluxo atualizado junto: sim**.

#### Testes
`astro check` 0 erros · `test:dados` 116/116 · Playwright (Chromium) 42/42 · conferido com dados reais em 1280px e 390px.

#### Pendências cosméticas (próxima rodada)
Dois rótulos de seta no mapa geral encostam em linhas ("sim" entre os losangos de recurso e "diligência"); o campo `excecao` ainda não persiste no banco (migração 004 futura).

<a id="pr-31"></a>
### #31 — Novo projeto fora do menu lateral

mesclado em 15/11/2026 · branch `govnexa-menu-novo`

A pedido do dono: a página **Novo projeto** continua existindo, mas sai do menu lateral; é aberta pelo botão **Novo projeto** em Projetos · Início (e na Carteira). Lista `FORA_DO_MENU` no catálogo. Fluxo: sem impacto (a tela segue acessível). Testes: `test:dados` 116/116, Playwright 43/43 (novo teste: fora do menu e aberto pelo botão).

<a id="pr-32"></a>
### #32 — Regras de trabalho no repositório (CLAUDE.md)

mesclado em 15/11/2026 · branch `govnexa-regras-repo`

A pedido do dono: regras que valem **para todos que desenvolvem** no projeto, em `CLAUDE.md` na raiz (lido automaticamente por toda sessão do Claude Code no repositório e útil como guia para pessoas):
1. **Ao abrir a sessão:** `git fetch`; atualizar a `main` (`git pull --ff-only`) ou trazer a `origin/main` para a branch de trabalho; só então começar.
2. **Manter o repositório atualizado:** branch própria, push frequente, PRs pequenos; merge pelo dono; Vercel publica sozinha.
3. **Antes do PR:** checagem de tipos, testes de dados e de interface, `npm run impacto` e atualização do Fluxo quando afetado; telas responsivas.
4. **Cuidados:** login e `vercel.json` só com autorização; `Doc Referencia/` nunca no repositório; `data/carga-real/` é temporária; sem segredos no código.

Sem mudança de código nem no Fluxo.

<a id="pr-33"></a>
### #33 — GovNexa: Painel do prefeito (guia Gestão)

mesclado em 15/11/2026 · branch `govnexa-painel`

#### O que entra
Pedido dos áudios: **painel para o prefeito** — bater o olho e ver como está cada projeto, com a foto atual e o histórico a um clique.

- **Gestão · Painel** com os dados de hoje: cartões (projetos, valor total, em contratação, em execução, em atenção, entregas em 90 dias), barras **por fase** com quantidade e valor, blocos **Em contratação**, **Obras em execução** (% financeiro), **Onde está parado** (etapa mais antiga por unidade), **Atenção** (atrasados e sugestões de sala de guerra com "Sugerido porque"), **Próximas entregas** e **Recursos federais** (pactuado, liberado, saldo a liberar, sem desembolso).
- Todo número leva à tela que o compõe; **Exportar em PDF**; link para o Histórico.
- Aviso: licitações em detalhe (empresa, colocação, valor da proposta) entram com o módulo de Contratação (Fase 4).
- **Fluxo atualizado**: etapa "Painel do prefeito" passa a **disponível**.

Com dados reais hoje: 334 projetos, R$ 5,9 bi, 34 em contratação, 17 em execução, 31 em atenção, 23 entregas em 90 dias, 19 convênios em execução. Achados de dados para conferir na planilha: projetos em execução com valor total em branco ou executado maior que o total (o % aparece como "—").

#### Testes
`astro check` 0 erros · `test:dados` 123/123 · Playwright 43/43 (cartões como links que abrem, sem rolagem horizontal em 1280/390, axe claro/escuro) · `npm run impacto`: só a etapa painel; Fluxo atualizado junto.

<a id="pr-34"></a>
### #34 — GovNexa: Reunião semanal (pauta automática, decisões, ações e ata em PDF)

mesclado em 15/11/2026 · branch `govnexa-reuniao`

Nova tela **Projetos · Reunião semanal** (/plataforma/projetos-reuniao/).

- Pauta automática a partir da carteira com 4 motivos (atraso, mudou desde a última reunião, sem responsável/parado, candidato à Sala de guerra), filtros por órgão e motivo.
- Registro de discussão, decisão e ações (descrição, responsável e prazo obrigatórios) em **modo simulação** (sessionStorage), aparecendo no Histórico como "Reunião semanal registrada" e "Ação criada na reunião". Gravação real depende do banco.
- Ata em PDF pela impressão do navegador.
- Fluxo: nó "Reunião semanal" na raia Gestão e mapa de impacto atualizados.

Testes: astro check 0 erros; test:dados 126/126; Playwright 44/44 (inclui sem rolagem horizontal 1280/390 e axe claro/escuro).

<a id="pr-35"></a>
### #35 — GovNexa: Prazos da Lei 14.133 com dias úteis e metas internas

mesclado em 15/11/2026 · branch `govnexa-prazos`

Nova tela **Licitações · Prazos** (/plataforma/licitacoes-prazos/).

- Tabela dos prazos da Lei 14.133 (limite legal) e metas internas mais curtas (data/config/prazos-internos.json); prazos-piso (publicidade, razões, contrarrazões) marcados como não encurtáveis.
- Calculadora em dias úteis e corridos com feriados nacionais (inclui móveis pela Páscoa) e de Goiânia (data/config/feriados.json — **conferir com o decreto municipal**).
- Fluxo: telas de publicação, homologação e alertas ligadas aos prazos; mapa de impacto atualizado.

Testes: astro check 0 erros; test:dados 126/126; Playwright 44/44.

<a id="pr-36"></a>
### #36 — Menu lateral: blocos que abrem e fecham

mesclado em 15/11/2026 · branch `govnexa-menu`

Pedido do dono: deixar o menu lateral mais limpo até a chegada do novo layout.

- Os títulos de bloco (Projetos, Captação, Licitações, Gestão) e de sub-bloco (Operação, Planejamento, Preços, Automação…) viraram botões que abrem e fecham as guias, com seta indicando o estado.
- Cada navegador lembra o que ficou fechado (localStorage; se o navegador bloquear, tudo abre normalmente).
- O bloco da página atual sempre abre, mesmo que tenha sido fechado.
- Com o menu recolhido (só ícones), todas as guias aparecem, como antes.
- Acessível: botões com aria-expanded/aria-controls; axe claro e escuro sem violações sérias.

Testes: astro check 0 erros; test:dados 136/136; Playwright 46/46 (teste novo do menu). Impacto: só arquivos transversais (layout e estilo), sem mudança no Fluxo.

<a id="pr-37"></a>
### #37 — Testes do menu lateral (celular com menu recolhido)

mesclado em 15/11/2026 · branch `govnexa-menu-testes`

Complemento do #36, vindo da revisão independente:
- o teste do sub-bloco aponta para Operação dentro de Licitações (antes pegava o primeiro sub-bloco qualquer);
- teste novo: no celular, com o menu recolhido salvo e Licitações fechado, o título continua visível e reabre o bloco (a revisão levantou o risco; o teste prova que não ocorre).

Só testes, sem mudança de código. Playwright completo passando.

<a id="pr-38"></a>
### #38 — Correção: religa o Painel do prefeito (guia Gestão)

mesclado em 16/11/2026 · branch `govnexa-painel-volta`

**Problema:** na junção do #34 (commit 8af9dc3) a página de módulos perdeu a ligação do Painel do prefeito, que voltou ao texto antigo de "a partir da Fase 4". Na mesma junção sumiram o teste de tela do painel e o teste unitário do `test:dados`, por isso nada acusou.

**Correção:** devolve exatamente as 4 partes do commit original (23f3d07): import, `gestao` nas telas próprias, texto de apresentação e chamada do componente; devolve o teste de tela "painel do prefeito" e o `tests/gestao/painel.test.ts` no `test:dados`.

Testes: astro check 0 erros; test:dados 143/143; Playwright 48/48. O Fluxo não muda (o nó do painel já estava como disponível).

<a id="pr-39"></a>
### #39 — GovNexa: Mapa das obras no painel do prefeito, localização (ponto ou trechos) e fotos preparadas

mesclado em 16/11/2026 · branch `govnexa-mapa`

Pedido do dono: mapa da cidade no painel do prefeito, com ícone por tipo de obra, ruas e trechos destacados, zoom e toque, resumo ao tocar (com foto quando houver) e local no projeto para cadastrar a localização e as fotos.

**Painel (Gestão)**
- Mapa OpenStreetMap (Leaflet 1.9.4, versão fixa) com zoom, toque, tela cheia e "Centralizar Goiânia".
- Ícone por tipo: saúde, educação, assistência, ruas e pavimentação, pontes e viadutos, drenagem, parques e lazer, cultura, outras edificações (com legenda; não depende só de cor).
- Trechos de rua desenhados sobre o mapa; filtros por situação (padrão: em execução e mobilização) e por tipo; lista alternativa "Ver as obras em lista".
- Resumo ao tocar: foto (quando houver), nome, órgão, situação, valor, % executado, prazo da etapa, farol, aviso de local aproximado, "Abrir a ficha" e "Editar localização". Montado sem HTML injetado.

**Localização e fotos (Projetos)**
- Tela nova no menu: escolher o projeto e marcar **um ponto** (toque no mapa, marcador arrastável, endereço) ou **ruas e trechos** (rua, de/até, linha desenhada tocando no mapa). Também no Novo projeto e com link na ficha.
- Gravação em **simulação** até o banco existir (registro no Histórico como "Localização cadastrada").
- Fotos: seção pronta com o envio desabilitado e aviso; migração `004` (localização em jsonb + tabela `projeto_foto` com RLS por prefeitura, sem DELETE) preparada, **não executada**.

**Local aproximado antes do cadastro**
- Centro do bairro via OpenStreetMap Nominatim, consultado uma única vez por script (`npm run geocodificar`), 1 consulta/s, resultado salvo em `geo-bairros.json`: 129 de 137 bairros encontrados. Projetos sem bairro só entram após o cadastro.

**Segurança**
- `vercel.json`: só `img-src` passa a aceitar `https://tile.openstreetmap.org` (autorizado pelo dono). Quando houver fotos reais, o domínio do armazenamento precisará entrar no `img-src`.

Testes: astro check 0 erros; test:dados 151/151; Playwright 49/49 (mapa com toque, axe claro/escuro, sem rolagem em 1280/390). Fluxo e mapa de impacto atualizados. Contém o mesmo commit da correção do painel (#38); a ordem de merge entre os dois não importa.

<a id="pr-40"></a>
### #40 — Mapa em branco no site: nomes de arquivo do build só hexadecimais

mesclado em 16/11/2026 · branch `govnexa-mapa-carga`

#### O que mudou
- **Correção do mapa em branco no site.** A Vercel respondia 404 para `_astro/simulacao.mqF-P3E_.js`, o único arquivo do build com nome terminado em `_`. Sem ele, o script do mapa (painel e tela de localização) não carregava. O build idêntico funcionava localmente.
- `astro.config.mjs`: `vite.build.rollupOptions.output.hashCharacters = 'hex'`. Os nomes dos arquivos agora usam só 0-9 e a-f.
- `tests/acceptance.spec.ts`: um teste novo confere que todo `.js`/`.css` do build tem hash hexadecimal e que nenhum `/_astro/*` da página do painel responde com erro. O teste **falha** sem a correção e passa com ela.

#### O que não mudou
- O código do mapa, o login, o `vercel.json` e os dados.

#### Portão
- astro check: 0 erros
- test:dados: 151/151
- Playwright chromium: 50/50
- impacto: Fluxo sem mudança

<a id="pr-41"></a>
### #41 — Gestão › WhatsApp (simulação): números, permissões, relatório e perguntas

mesclado em 16/11/2026 · branch `govnexa-whatsapp`

#### O que mudou
- **Nova guia Gestão › WhatsApp (simulação, Fase 5).**
  - **Números autorizados:** cadastrados pelo cargo ou equipe, nunca pelo nome da pessoa. Na lista, o número aparece mascarado.
  - **Permissão por número:** órgãos, só os projetos de prioridade Muito Alta e Alta, valores em R$, captação e projetos liberados à parte.
  - **Relatório automático:** semanal ou diário, em dois modelos: "Projetos prioritários" e "Resumo curto".
  - **Prévia da conversa:** perguntas pelo nome, código ou SEI do projeto, e sobre atrasados, entregas, execução e convênios ou emendas.
- **Segurança.**
  - A resposta é montada só com os projetos que a permissão libera (`src/lib/whatsapp/permissoes.ts`).
  - Um projeto de outro órgão recebe a mesma resposta de projeto inexistente.
  - O responsável e as observações nunca entram na base.
  - Todo texto entra na tela por `textContent`.
- **Data e farol** são recalculados no navegador, no fuso de Brasília. A página estática não fica com a data da publicação.
- **Fluxo:** etapa nova "Relatórios e perguntas pelo WhatsApp" (raia Gestão, situação simulação). Mapa de impacto e CHANGELOG atualizados.

#### O que não mudou
- Login, `vercel.json` e dados. Nenhum envio real e nenhuma dependência nova.
- Tudo fica em `sessionStorage`. O envio real depende do banco de dados e da conta oficial do WhatsApp Business.

#### Revisão e testes
- **Revisão independente (Sonnet):** nenhum vazamento de permissão, dado pessoal ou XSS. Os 2 pontos médios e 6 menores foram corrigidos. O `%` executado continua visível sem a permissão de valores; foi intencional e está registrado no código.
- **Prova de mutação:** com o filtro de permissão desligado, 3 testes falham.
- **astro check:** 0 erros.
- **test:dados:** 169 de 169.
- **Playwright chromium:** 51 de 51, incluindo a tela nova com axe nos temas claro e escuro e sem rolagem horizontal em 1280 e 390 px.
- **impacto:** Fluxo atualizado, nenhum arquivo sem mapa.

<a id="pr-42"></a>
### #42 — Dependências entre etapas, Central de alertas, modelos do WhatsApp e obras sem localização

mesclado em 16/11/2026 · branch `govnexa-evolucao`

#### O que mudou
Três entregas que não dependem do banco, num PR só.

- **Dependências entre etapas (Fase 2).**
  - Na página de cada cronograma: resumo "Atraso em cascata" e aba "Dependências" (de qual etapa cada uma depende; "Aguardando" ou "Travada"; fim projetado; etapa que mais segura o projeto).
  - Em "Onde está parado": quantas etapas seguintes cada unidade está segurando.
  - Regra: a planilha não tem coluna de predecessora, então vale a ordem do cronograma. Etapas paralelas da mesma fase não dependem entre si. A projeção nunca antecipa uma data, e dado ausente fica null.
- **Central de alertas (Fase 4), na guia nova Gestão › Alertas.**
  - Lista única com resumo por tipo e filtros por tipo, gravidade e órgão.
  - Tipos: cláusula suspensiva (indício), vigência de convênio, contratação, início e fim de obra, saldo sem fonte, etapa parada e dado desatualizado.
  - Prazos em dias corridos e úteis, com os feriados.
  - A regra meta × teto da Lei 14.133 está pronta (passar do teto = vermelho).
  - O que ainda não tem dado aparece em "Ainda sem fonte de dados". No Fluxo, a etapa "Alertas e prazos" passa a "disponível".
- **WhatsApp.** 3 modelos de mensagem para aprovação da Meta, com a validação das regras da Meta e o botão "Copiar texto".
- **Localização e fotos.** Lista das obras que ainda não aparecem no mapa (bairro não encontrado ou sem bairro), com link para cadastrar a localização de cada uma.

#### O que não mudou
- Login, `vercel.json` e dados. Nenhuma dependência nova e nada grava fora do navegador.

#### Revisão e testes
- **Revisão independente (Sonnet):** nada grave; não há dado pessoal nem XSS, e a junção está limpa. Correções aplicadas:
  - desembolso não informado não conta mais como "sem desembolso";
  - a data de hoje passou a usar o fuso de Brasília;
  - o critério de "travada" agora coincide com o de "Onde está parado".
- **Testes novos:** cada regra testada falha quando desligada.
- **astro check:** 0 erros.
- **test:dados:** 201 de 201.
- **Playwright chromium:** 62 de 62, incluindo axe nos temas claro e escuro e sem rolagem horizontal em 1280 e 390 px.
- **impacto:** Fluxo atualizado, nenhum arquivo sem mapa.

<a id="pr-43"></a>
### #43 — Processos no SEI (simulação), Fluxo legível e menu com blocos fechados

mesclado em 16/11/2026 · branch `govnexa-sei`

#### O que mudou
- **Projetos › Processos no SEI (simulação, Fase 2).** Guia nova com um exemplo fictício e os links públicos dos processos, por projeto.
  - **Leitor da página pública do processo** (`src/lib/sei/leitor.ts`):
    - lê o cabeçalho, os documentos (marcados como públicos ou restritos) e os andamentos;
    - "Interessados" nunca entra;
    - nos andamentos, mascara e-mail, CPF, login e o nome que vem depois de "atribuído para" ou "assinado por";
    - recusa a página quando ela vem sem as tabelas (captcha ou link vencido);
    - foi conferido nos dois processos reais (258 documentos e 443 andamentos; 324 e 50).
  - **Análise** (`src/lib/sei/analise.ts`):
    - reconhece os documentos-chave da Lei 14.133, cada um com o grau de confiança: alta ou "conferir";
    - sugere a etapa, mas só propõe avançar, e a mudança depende de aprovação;
    - mostra onde o processo está e há quantos dias;
    - avisa quando há termo de paralisação sem reinício depois.
  - **Link:** só é aceito se for https, do SEI da prefeitura e da página do processo. Fica em `sessionStorage`; na tela aparece mascarado.
  - **Comando para a equipe técnica:** `npm run sei:ler -- "<link>"` lê uma vez e não grava nada. Ele aceita só resposta `text/html`, com limite de 5 MB, sem seguir redirecionamento e com tempo máximo de 30 s.
  - **Fluxo:** a etapa "SEI" passa a "simulação".
- **Fluxo (pedido do dono):**
  - nenhuma caixa ou losango passa da largura da própria raia; quando o texto não cabe, a forma cresce na altura;
  - o losango quebra o texto mais cedo;
  - os rótulos de setas curtas e de setas que sobem não ficam mais cobertos.
- **Menu (pedido do dono):** os blocos principais (Projetos, Captação, Licitações, Gestão, Conta) começam fechados. O bloco da página atual abre, e cada navegador lembra o que a pessoa abriu.

#### O que não mudou
- Login, `vercel.json` e dados não mudaram. Não há dependência nova.
- O GovNexa ainda não abre o SEI sozinho. A leitura diária no servidor depende do banco de dados.

#### Revisão e testes
- **Revisão independente (Sonnet), em duas rodadas:** não achou XSS, SSRF nem vazamento de "Interessados". Todos os 7 pontos médios foram corrigidos:
  - edital e "Contrato" genéricos agora pedem conferência;
  - "Aviso" e "Publicação" soltos saíram dos documentos-chave;
  - a ordem de serviço genérica pede conferência;
  - a ordem de serviço de reinício agora fecha o alerta de paralisação;
  - as letras acentuadas escritas como código HTML são lidas certo;
  - nomes de servidores nos andamentos são mascarados;
  - o comando de leitura tem limite de bytes.
- **astro check:** 0 erros.
- **test:dados:** 215 de 215.
- **Playwright chromium:** 66 de 66, incluindo a tela nova com axe nos temas claro e escuro, sem rolagem horizontal em 1280 e 390 px, e o menu com os blocos fechados.
- **impacto:** Fluxo atualizado; nenhum arquivo sem mapa.

<a id="pr-44"></a>
### #44 — Fluxo: zoom e legenda recolhida

mesclado em 16/11/2026 · branch `govnexa-fluxo-zoom2`

#### O que mudou
- **Zoom no Fluxo** (pedido do dono). A barra acima do diagrama tem −, o valor atual, +, "Ajustar à tela" e "Tamanho padrão". Ctrl + roda do mouse sobre o diagrama também aproxima e afasta.
  - O padrão é 100%: o diagrama geral fica com 1000 px de largura, menor que antes em telas largas. Em tela mais estreita, ele já começa ajustado ao quadro.
  - A escolha fica guardada no navegador; um valor inválido guardado é ignorado.
  - Com zoom maior, a rolagem acontece dentro do quadro e a página não rola de lado.
  - Vale também para as páginas de fluxo detalhado.
- **"Como ler o diagrama" e "Fluxos detalhados"** começam recolhidos, então o diagrama aparece logo. Abrem com um clique e, na impressão/PDF, saem abertos.

#### O que não mudou
- O desenho do diagrama, os dados, o login e o `vercel.json` não mudaram. Não há dependência nova.

#### Revisão e testes
- **Revisão independente (Sonnet):** nada grave. Correções aplicadas:
  - o zoom pelo trackpad tem freio;
  - o quadro escondido não zera o desenho;
  - valor de zoom adulterado não conta como preferência (defeito achado pelo teste novo).
- **Testes novos** (`tests/fluxo-zoom.spec.ts`):
  - zoom inicial, aumentar, diminuir, ajustar e lembrar;
  - no celular, começa ajustado e não cria rolagem lateral;
  - zoom de 200% rola dentro do quadro;
  - valor adulterado é ignorado;
  - na impressão, as seções abrem e depois voltam como estavam;
  - fluxo detalhado também tem zoom;
  - axe nos temas claro e escuro.
- **astro check:** 0 erros.
- **test:dados:** 215 de 215.
- **Playwright chromium:** 72 testes; 71 passaram na rodada completa. O "Novo projeto" falhou uma vez por carga e passou em 3 de 3 repetições isoladas.
- **impacto:** Fluxo atualizado; nenhum arquivo sem mapa.

<a id="pr-45"></a>
### #45 — Licitação em detalhe (simulação): fases da Lei 14.133 com as datas do SEI

mesclado em 16/11/2026 · branch `govnexa-licitacao`

#### O que mudou
- **Licitações › Licitação em detalhe (simulação, Fase 4).**
  - **Como carregar:** a pessoa abre o link público do processo no SEI, salva a página (Ctrl+S) e carrega o arquivo. Vale `.html` em Latin-1 ou UTF-8, e também `.mhtml`. O arquivo é lido só no navegador e não é enviado a lugar nenhum.
  - **Fases da Lei 14.133** (`src/lib/licitacao/detalhe.ts`):
    - a fase interna vai do DFD ao parecer jurídico;
    - a externa vai do edital publicado à ordem de serviço;
    - cada fase usa a data real do primeiro documento-chave;
    - fase sem documento não é inventada e aparece como "sem documento";
    - peça feita em paralelo não ganha contagem de dias negativa.
  - **Na tela:**
    - fase atual, onde o processo está e há quantos dias;
    - duração da fase interna, da externa e do total, sem valores negativos;
    - prazo mínimo de publicidade (art. 55) por tipo de objeto;
    - publicação do contrato no PNCP marcada "sem dado", até existir a integração;
    - o projeto da carteira com o mesmo número SEI;
    - alerta de paralisação.
  - **Guarda na aba:** até 10 licitações em `sessionStorage`, validadas ao ler (data de calendário real e número de processo). A descrição dos andamentos não é guardada.
- **Fluxo:** as etapas Parecer jurídico, Publicação, Julgamento e Homologação ganham o link para a tela nova.

#### O que não mudou
- Login, `vercel.json` e dados não mudaram. Não há dependência nova.
- O GovNexa ainda não abre o SEI sozinho. A releitura diária depende do banco.

#### Revisão e testes
- **Revisão independente (Sonnet):** nada alto ou crítico. Pontos aplicados:
  - validação de data de calendário (o teste novo achou que "2026-13-01" quebrava a validação; corrigido);
  - duração inválida ou negativa vira vazio;
  - "(conferir)" também na duração quando o contrato vem de documento genérico;
  - erro de leitura do arquivo com mensagem;
  - anúncio para leitor de tela só no status;
  - arquivo solto fora da área não abre na aba;
  - a descrição dos andamentos não é guardada.
- **Mantido de propósito:** na data da publicação, o aviso de licitação vem antes do edital. O documento "Edital" costuma ser criado como rascunho antes do parecer jurídico.
- **Testes novos:**
  - `tests/licitacao/detalhe.test.ts`, 9 testes: fases, fase atual, prazo, duração, arquivo em Latin-1, UTF-8, MHTML quoted-printable e base64, recusas e validação;
  - `tests/licitacao.spec.ts`, 5 testes: exemplo, carregar, ligar ao projeto, lembrar, substituir, remover, arquivo errado, dado adulterado, axe nos temas claro e escuro, e 1280 e 390 px.
- **astro check:** 0 erros.
- **test:dados:** 224 de 224.
- **Playwright chromium:** 77 de 77.
- **impacto:** Fluxo atualizado; nenhum arquivo sem mapa.

<a id="pr-46"></a>
### #46 — README: situação atual, funcionalidades, decisões e próximos passos

mesclado em 16/11/2026 · branch `govnexa-readme`

#### O que mudou
- **README.md reescrito** para quem continua o trabalho, numa nova sessão ou como o outro desenvolvedor. Seções:
  - O que é o GovNexa e as premissas do produto;
  - Situação atual por fase, com %, e as entregas recentes (#18 a #45);
  - Funcionalidades por guia, cada uma marcada como disponível, simulação ou demonstrativa, com a pasta do código;
  - Macroetapas 00 a 06 e as regras de movimentação;
  - Pedidos de origem (áudios, reunião e planilhas) e onde cada um entrou;
  - O que funciona de verdade e o que é simulação, por que o SEI ainda não é automático e o que muda com o banco;
  - Decisões já tomadas, pendências do dono e próximos passos;
  - Comandos, regras de trabalho, armadilhas conhecidas, estrutura de pastas, rotinas, variáveis, segurança e documentação.

#### O que não mudou
- Código, dados, login e `vercel.json` não mudaram.
- Nenhum nome de pessoa, credencial, link privado ou conteúdo da pasta `Doc Referencia/` entrou no repositório. O plano completo continua privado; o README pede o link ao dono.

#### Testes
- Só documentação. Os links internos do README foram conferidos e todos existem.

<a id="pr-47"></a>
### #47 — README com história, princípios e roteiro; regra de README sempre atualizado

mesclado em 16/11/2026 · branch `govnexa-readme-historia`

#### O que mudou
- **README, parte 1.1:** problema, visão e os 10 princípios que valem para todo código novo, vindos dos áudios do dono, da reunião e das planilhas.
- **README, parte 1.2:** como o produto chegou até aqui. Começou como Atlas, com o bloco Captação (09 e 10/11). Em 15/11 virou o GovNexa, começando pelo módulo Projetos. As partes seguintes registram as entregas e as decisões de cada etapa até 16/11.
- **README, parte 1.3:** roteiro das Fases 0 a 5, com o portão de aceite de cada uma.
- **CLAUDE.md, regra 4 (pedido do dono):** toda entrega atualiza o README no mesmo PR, com situação, funcionalidades, pedidos de origem, decisões e pendências. Mudança de direção do produto também entra no README. O CLAUDE.md é versionado e recebe as regras novas.

#### O que não mudou
- Código, dados, login e `vercel.json` não mudaram.
- Nenhum nome de pessoa, credencial, link privado ou conteúdo da pasta `Doc Referencia/` entrou no repositório.

#### Testes
- Só documentação. Os links internos foram conferidos.

<a id="pr-48"></a>
### #48 — Plano completo do GovNexa no repositório, para todos os envolvidos

mesclado em 16/11/2026 · branch `govnexa-plano`

#### O que mudou
- **`docs/govnexa/plano.md` (novo):** o plano completo do GovNexa, que até agora era um documento privado, agora acessível a todos os envolvidos. Seções:
  - Andamento;
  - sumário (problema, visão, princípios e decisões);
  - atores e perfis;
  - mapa de módulos;
  - ciclo de vida;
  - os módulos Projetos, Captação e Contratação (Lei 14.133: fases, prazos, verificações, os cinco alertas);
  - a guia Gestão;
  - regras de negócio e catálogo de alertas;
  - dados e integrações, incluindo os testes do SEI;
  - segurança e LGPD, e o piloto multiprefeitura;
  - roteiro com critérios de aceite;
  - riscos e decisões;
  - rastreabilidade dos pedidos dos áudios, da reunião e das planilhas.
- **Ajustes para o repositório:**
  - o nome da pessoa na linha do autor saiu;
  - os três diagramas, que o Markdown não carregava, viraram Mermaid, que o GitHub desenha;
  - a nota sobre a "cor azul" passou a apontar para o CHANGELOG.
- **README:** aponta para o plano, em vez de "peça o link".
- **CLAUDE.md, regra 4:** toda entrega atualiza também o Andamento do plano; decisão, regra ou requisito novo entra na seção certa, com a data.

#### O que não mudou
- Código, dados, login e `vercel.json` não mudaram.
- O texto do plano é o mesmo do documento original, salvo os ajustes acima. Não entraram nomes de pessoas, credenciais nem conteúdo da pasta `Doc Referencia/`. Os links são só os públicos: Lei 14.133, páginas do SEI e documentação do governo.

#### Testes
- Só documentação. Conferidos: nenhuma menção a pessoa, e-mail, código de processo do SEI ou senha; links internos do README existem.
