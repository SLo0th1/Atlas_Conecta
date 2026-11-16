# Atlas Goiânia Conecta · GovNexa

Portal público **Atlas Goiânia Conecta** e plataforma de gestão pública **GovNexa — Inteligência para a gestão pública**. O piloto é a Prefeitura de Goiânia.

- **Produção:** https://atlas.gestaonexus.com.br. A Vercel publica sozinha a cada merge no `main`.
- **Repositório público:** só entram código, dados públicos e dados fictícios. A carga real da planilha (`data/carga-real/`) está aqui por decisão temporária do dono e sai quando houver banco de dados.
- **Leia primeiro:** as seções "Situação atual", "O que funciona de verdade e o que é simulação" e "Regras de trabalho".

Situação descrita em **16/11/2026**, depois do PR #45.

---

## 1. O que é o GovNexa

O GovNexa nasceu para substituir a planilha de obras prioritárias da prefeitura. O objetivo é acompanhar cada projeto do começo ao fim:

1. a ideia ou demanda;
2. a captação de recursos (convênios e emendas);
3. a contratação pela Lei 14.133;
4. a execução da obra;
5. a entrega à população.

São módulos independentes que conversam entre si:

| Módulo | Para quê |
| --- | --- |
| **Projetos** (núcleo) | Carteira de projetos, macroetapas, cronogramas, onde está parado, movimentação com histórico, reunião semanal, sala de guerra, SEI |
| **Captação** | Convênios, programas abertos, CAUC, repasses, alertas, parecer de elegibilidade (dados públicos reais) |
| **Licitações** | Prazos da Lei 14.133, licitação em detalhe com as datas do SEI e as guias demonstrativas anteriores (operação, preços etc.) |
| **Gestão** | Painel do prefeito (foto atual e mapa das obras), Central de alertas e WhatsApp |
| **Conta** | Perfil e configurações (demonstrativo) |

**Premissas do produto:**
- Goiânia é o piloto. Depois, o produto será vendido a outras prefeituras, cada uma com acesso e dados isolados. Por isso nada fica fixo em Goiânia: o município ativo é lido de `data/config/municipio.json`.
- O MVP roda em JSON, sem banco. O modelo já está pronto para PostgreSQL, com isolamento por prefeitura (RLS) em `db/migracoes/`.
- O MVP não usa IA. A IA fica para a Fase 5, sempre com revisão humana.
- **Requisito mínimo:** as transcrições dos áudios do dono, a reunião com a equipe e as planilhas-base. Esses insumos ficam na pasta local `Doc Referencia/`, que **nunca** vai para o Git.
- **Plano completo:** [docs/govnexa/plano.md](docs/govnexa/plano.md), de conhecimento de todos os envolvidos. Traz atores, módulos, regras de negócio, prazos da Lei 14.133, integrações (SEI inclusive), segurança e LGPD, roteiro, riscos, decisões e a rastreabilidade dos pedidos. A seção "Andamento" é atualizada a cada entrega.
- **Este README é a fonte para dar continuidade.** Ele é atualizado em toda entrega: situação, funcionalidades, decisões e pendências. A regra está no [CLAUDE.md](CLAUDE.md).

### 1.1 Problema, visão e princípios (dos áudios, da reunião e das planilhas)

**Problema.** A carteira, com cerca de 400 projetos, vive em planilhas editadas à mão. Os cronogramas de cada obra ficam em abas separadas, e os painéis são montados manualmente toda semana. Ninguém responde de imediato:
- onde o projeto está parado;
- com quem;
- há quantos dias;
- quanto do orçamento não tem fonte.

**Visão.** O GovNexa é a base única da carteira de projetos da prefeitura, do desejo do gestor à obra entregue. Ele substitui a planilha de obras prioritárias e conecta captação de recursos, contratação (Lei 14.133/2021) e o painel do prefeito.
- Um projeto é cadastrado **uma vez**, e todas as telas são visões dele: carteira, Kanban, Gantt, cronograma, captação, licitação, painel e WhatsApp.
- O sistema **calcula** status, prazos e alertas. A equipe só registra fatos: iniciou, concluiu, enviou, voltou.

**Princípios** (valem para todo código novo):

| Princípio | Na prática |
| --- | --- |
| Uma fonte da verdade | O projeto é único; os módulos se ligam a ele por referência |
| Calcular, não digitar | Status, %, farol, entrega projetada, saldo sem fonte, atraso em cascata e economia saem de regras |
| Dado ausente não é zero | Fica "—" e entra em pendências de dado; nunca se inventa data ou valor |
| Toda espera tem dono | Etapa parada mostra quem deve o quê e desde quando |
| Simples para quem usa | Fichas em texto, poucos cliques, sem rolagem lateral, funciona no celular; a equipe tem dificuldade com planilha e IA |
| Origem preservada | Todo dado guarda fonte, data e o valor original importado; toda alteração vai para o histórico |
| Qualquer caminho, mesma regra | O projeto anda ou volta pelo Kanban, pela ficha, pelas Pendências ou pelo SEI, sempre pelo mesmo motor e com o mesmo registro (pedido do dono, 15/11) |
| Gestão leve | PMBOK para marcos, linha de base e caminho crítico; execução ágil em Kanban; sala de guerra no padrão PMI |
| Nada fixo em Goiânia | Município, logo, feriados e metas vêm de configuração; cada prefeitura terá acesso e dados isolados |
| Lei é teto, meta é menor | A prefeitura define metas internas menores que a Lei 14.133; passar do teto legal é alerta grave; o prazo-piso não se encurta |

### 1.2 Como o produto chegou até aqui (histórico das decisões)

1. **09 e 10/11/2026 — Atlas, bloco Captação.** O projeto começou como portal público (Atlas Goiânia Conecta) com o bloco **Captação**: coletores de dados públicos (Transferegov, CAUC, SICONFI, FNS, DOU, INEP, CNES, SINISA), alertas, comparativo entre capitais e parecer de elegibilidade sem IA. Tudo com dados públicos reais e rotinas diárias e mensais no GitHub.
2. **15/11/2026 — virada para o GovNexa.** Os áudios do dono e a reunião com a equipe mudaram o foco: o problema central é **gerir a carteira de projetos**, não só captar recursos. Decisões:
   - nome **GovNexa — Inteligência para a gestão pública**;
   - **começar pelo módulo Projetos**, com a Carteira de Projetos substituindo a planilha como primeira entrega;
   - módulos independentes e integrados: Projetos (núcleo), Captação (continua, e o parecer passa a referenciar Projetos), Licitações/Contratação (as guias antigas ficam e serão reavaliadas) e a guia **Gestão**, o painel do prefeito, que lê todos os módulos;
   - PostgreSQL planejado, com o MVP em JSON até a produção;
   - sem IA no MVP;
   - o texto "Área do comprador" sai da página;
   - nenhum nome de pessoa no repositório.
3. **15/11 — Fases 0, 1, 1.5 e 2:**
   - marca e menu por módulo;
   - carteira importada da planilha (334 projetos);
   - Kanban, Gantt e Visão por órgão;
   - motor de movimentação e histórico;
   - cronogramas do GEPP e Onde está parado;
   - Reunião semanal e Sala de guerra;
   - o **Fluxo do sistema**, que vira o mapa oficial e é atualizado a cada mudança.
4. **15 e 16/11 — Fase 4 e início da 5:**
   - Prazos da Lei 14.133 com metas internas;
   - Painel do prefeito e Mapa das obras;
   - Central de alertas;
   - WhatsApp em simulação.
   - O dono também decidiu publicar **temporariamente** a carga real da planilha no repositório, até existir o banco.
5. **16/11 — SEI e licitações.**
   - **Teste e reteste do link público do SEI:** abre sem captcha.
   - **Regra do dono:** documento público é lido automaticamente; documento restrito entra por PDF; nunca contornar captcha.
   - **Entregas:** Processos no SEI e Licitação em detalhe, em simulação.
   - **Dependências entre etapas:** opção A, deduzidas pela ordem e pelas datas, a revisar com o cliente.
   - **Pedidos de interface do dono:** Fluxo legível com zoom e menu com blocos fechados.

### 1.3 Roteiro por fases

| Fase | Objetivo | Portão de aceite |
| --- | --- | --- |
| 0 · Base e identidade | Marca, menu por módulos, município configurável | Plataforma com a marca e o menu novos |
| 1 · Carteira de Projetos | Substituir a planilha: carteira, ficha, Kanban, Gantt, por órgão | Carga real conciliada com a planilha |
| 1.5 · Cadastro e movimentação | Projeto nasce no cadastro e anda ou volta por qualquer caminho, com histórico | Gravar de verdade (precisa do banco) |
| 2 · Cronograma e equipe | Cronogramas, quem está com cada tarefa, onde está parado, reunião semanal, SEI | Leitura diária do SEI (precisa do banco) |
| 3 · Produção com banco | PostgreSQL, perfis por secretaria, isolamento por prefeitura | Simulações viram gravação real |
| 4 · Contratação, convênios e Gestão | Lei 14.133 ponta a ponta, cláusula suspensiva, painel do prefeito, medições | PNCP e datas reais por licitação |
| 5 · Integrações e inteligência | PNCP, SIMEC, SISMOB, SINAPI e GOINFRA, WhatsApp real, IA com revisão humana | Conta do WhatsApp Business; IA aprovada |

---

## 2. Situação atual (16/11/2026)

| Fase | O que entrega | Situação | % |
| --- | --- | --- | --- |
| Planejamento | Plano, decisões, rastreabilidade, Fluxo do sistema, fluxos detalhados, mapa de impacto | Publicado; caixas do Fluxo na largura da raia; zoom no Fluxo | 97% |
| 0 · Base e identidade | Marca GovNexa, menu por módulos, tema estável, paginação | Publicada; blocos do menu começam fechados | 100% |
| 1 · Carteira de Projetos | Carga real, Carteira, ficha, Kanban, Gantt, Visão por órgão, celular | Publicada com dados reais | 100% |
| 1.5 · Cadastro, movimentação, log, sala de guerra | Novo projeto, Kanban e Pendências, Histórico, Sala de guerra | Publicada em simulação; gravar depende do banco | 95% |
| 2 · Cronograma e equipe | Cronogramas, quadro de tarefas, Onde está parado, Reunião semanal, dependências, SEI | Publicada; leitura do SEI em simulação; leitura diária depende do banco | 90% |
| 3 · Produção com banco | PostgreSQL, perfis, isolamento por prefeitura | Tabelas e carga preparadas e testadas; aguarda o banco na Vercel | 30% |
| 4 · Contratação, convênios e Gestão | Lei 14.133, alertas, painel do prefeito, licitação em detalhe | Prazos da lei, Painel do prefeito, Mapa das obras, Central de alertas e Licitação em detalhe (simulação); falta a leitura automática e o PNCP | 75% |
| 5 · Integrações e inteligência | PNCP, SIMEC, SISMOB, preços, WhatsApp, IA | WhatsApp em simulação (permissão por número, relatórios, perguntas, modelos para a Meta) | 10% |

### Entregas recentes (PRs)

| Data | O que | PR |
| --- | --- | --- |
| 16/11 | Plano completo publicado no repositório para todos (docs/govnexa/plano.md) | #48 |
| 16/11 | README completo (história, princípios, roteiro) e regra de manter o README sempre atualizado | #46, #47 |
| 16/11 | Licitação em detalhe: fases da Lei 14.133 com as datas reais do SEI | #45 |
| 16/11 | Fluxo: zoom e legenda recolhida | #44 |
| 16/11 | Processos no SEI (leitor da página pública); caixas do Fluxo na raia; menu com blocos fechados | #43 |
| 16/11 | Dependências entre etapas e atraso em cascata; Central de alertas; modelos do WhatsApp para a Meta; obras sem localização | #42 |
| 15/11 | WhatsApp da Gestão (simulação) | #41 |
| 15/11 | Correção do mapa em branco: nomes de arquivo só hexadecimais no build | #40 |
| 15/11 | Fases 0, 1, 1.5 e 2, Fluxo do sistema, log, sala de guerra, reunião, prazos, painel do prefeito, mapa | #18 a #39 |

O detalhe de cada entrega está em [docs/CHANGELOG.md](docs/CHANGELOG.md).

---

## 3. Funcionalidades por guia

Legenda: **Disponível** = funciona com dados reais. **Simulação** = as regras rodam, mas nada é gravado; fica na aba do navegador (`sessionStorage`) até existir o banco. **Demonstrativo** = protótipo com dados fictícios.

### Projetos

| Guia | O que faz | Situação | Código |
| --- | --- | --- | --- |
| Projetos · Início | Resumo da carteira por macroetapa: quantidade, valor e farol de prazo (verde, amarelo, vermelho) | Disponível | `src/lib/carteira/` |
| Fluxo do sistema | Diagrama em raias (BPMN simplificado) com 32 etapas, do início ao fim. Cada caixa explica o que é feito, o que é validado, quem faz e a situação, e abre a tela. Inclui 6 fluxos detalhados, zoom e exportação em PDF | Disponível | `src/lib/govnexa/fluxo.ts`, `subfluxos.ts`, `src/components/fluxo/` |
| Novo projeto (fora do menu, botão na Carteira) | Cadastro com os campos da planilha; o projeto nasce em "00 – Em estruturação" | Simulação | `src/components/carteira/NovoProjeto.astro` |
| Carteira de projetos | Todos os projetos, com busca e ficha completa (valores, recurso, datas, histórico) | Disponível | `src/lib/carteira/` |
| Localização e fotos | Ponto ou trechos da obra no mapa; lista das obras que ainda não aparecem no mapa | Simulação (fotos com o banco) | `src/lib/mapa/`, `src/components/mapa/` |
| Kanban por macroetapa | Colunas com quantidade e valor; arrastar ou "Mover", com portões e motivo | Simulação | `src/components/carteira/Kanban.astro`, `src/lib/carteira/movimentacao.ts` |
| Gantt geral | Linha do tempo prevista por macroetapa | Disponível | `src/components/carteira/Gantt.astro` |
| Visão por órgão | Obras por órgão e macroetapa; pronta para imprimir | Disponível | `src/components/carteira/VisaoOrgaos.astro` |
| Cronogramas | Cronogramas do GEPP: fase atual, realizado × previsto, ritmo. Cada cronograma tem linha do tempo, quadro de tarefas, **Dependências** (atraso em cascata) e pendências de dado | Disponível | `src/lib/cronograma/`, `src/pages/plataforma/cronograma/[id].astro` |
| Onde está parado | Etapas vencidas por unidade e responsável, com quantas etapas seguintes cada unidade segura | Disponível | `src/components/cronograma/Parado.astro` |
| Pendências de etapa | Aprovar avança e reprovar volta: mesma regra do Kanban | Simulação | `src/components/carteira/PendenciasEtapa.astro` |
| Reunião semanal | Pauta montada pelo sistema, decisões, ações e ata | Simulação | `src/lib/reuniao/` |
| Sala de guerra | Missões no padrão PMI: objetivo, prazo, responsável, riscos, ações, problemas e decisões | Simulação | `src/lib/sala/` |
| Histórico de alterações | Log do ciclo de vida: o quê, quem, quando, origem, antes e depois; filtros e CSV | Disponível (cargas) / Simulação (movimentos) | `src/lib/log/` |
| Processos no SEI | Leitor da página pública do processo, documentos-chave, etapa sugerida, onde está e há quantos dias, link por projeto | Simulação | `src/lib/sei/`, `src/components/sei/` |

### Captação (dados públicos reais)

| Guia | O que faz |
| --- | --- |
| Principal | Indicadores com fonte e data: convênios, CAUC, SICONFI, FNS, educação (INEP), saúde (CNES), saneamento (SINISA), DOU |
| Oportunidades | Programas abertos compatíveis com o município, com explicação simples, prazos e busca por necessidade |
| Acompanhamento | Convênios e repasses: pactuado, liberado e saldo a liberar |
| Alertas | Alertas da Captação, com motivo, regra e o que fazer |
| Comparativo | Repasses de saúde por habitante entre as 27 capitais |
| Qualidade dos dados | Frescor, falhas e motivo por fonte |
| Projetos (parecer) | Parecer determinístico de elegibilidade (regras R01 a R21), sem IA |

Código: `src/lib/dados/`, `src/lib/projetos/`, `coletores/`. Detalhes em [docs/manual-usuario.md](docs/manual-usuario.md) e [docs/projetos-ia.md](docs/projetos-ia.md).

### Licitações

| Guia | O que faz | Situação |
| --- | --- | --- |
| Licitação em detalhe | A pessoa salva a página pública do processo no SEI (Ctrl+S) e carrega o arquivo, que é lido só no navegador. A tela mostra: as fases interna e externa da Lei 14.133 com as datas reais dos documentos, a fase atual, os dias entre etapas, a duração, o prazo mínimo de publicidade (art. 55) e o projeto da carteira | Simulação (`src/lib/licitacao/`) |
| Prazos da Lei 14.133 | Prazos legais (piso e teto) e metas internas da prefeitura; calendário com feriados | Disponível (`src/lib/prazos/`) |
| Processos, Cotações, Documentos e outras | Protótipo anterior (Operação, Planejamento, Preços, Automação, Mercado, Cadastros) | Demonstrativo (`src/data/modules.json`, de outro desenvolvedor; não alterar sem combinar) |

### Gestão

| Guia | O que faz | Situação |
| --- | --- | --- |
| Gestão · Painel | Painel do prefeito: foto atual da carteira e dos recursos, mapa das obras, números clicáveis | Disponível |
| Alertas | Central única: cláusula suspensiva (indício), vigência de convênio, contratação, início e fim de obra, saldo sem fonte, etapa parada, dado desatualizado. Filtros por tipo, gravidade e órgão; mostra também o que ainda não tem fonte | Disponível |
| WhatsApp | Números autorizados (por cargo, nunca nome), permissão por número, relatório semanal ou diário, prévia de perguntas e modelos para aprovação da Meta | Simulação (envio real depende do banco e da conta do WhatsApp Business) |

---

## 4. Ciclo de vida do projeto (macroetapas)

Os códigos oficiais vêm da aba PIPELINE da planilha:

| Código | Macroetapa |
| --- | --- |
| 00 | Em estruturação |
| 01 | Planejamento |
| 02 | Preparatório para Contratação |
| 03 | Contratação |
| 04 | Mobilização |
| 05 | Execução |
| 06 | Conclusão |

**Regras de movimentação** (`src/lib/carteira/movimentacao.ts`):
- O projeto nasce no cadastro e anda ou volta por **qualquer caminho**: Kanban, ficha, Pendências de etapa ou SEI.
- Todos os caminhos passam pela mesma regra e geram o mesmo registro no histórico.
- **Avançar** exige os portões da etapa. **Voltar** e **forçar** exigem motivo.
- O SEI **só propõe** avançar. A mudança vale depois de aprovada.

**Compromisso do projeto:**
- **decidido:** executa com ou sem recurso externo;
- **condicionado:** só executa se vier recurso externo (projeto "desejo");
- **ideia:** demanda ainda não avaliada.

---

## 5. Pedidos de origem e onde estão

Os pedidos vêm dos áudios do dono, da reunião com a equipe e das planilhas.

| Pedido | Onde entrou | Situação |
| --- | --- | --- |
| Ver de relance o que está em planejamento, contratação ou execução | Início de Projetos, Kanban | Feito |
| Gantt por macroetapa | Gantt geral | Feito |
| Macroetapas com os nomes e as datas finais da planilha | Importador da carteira | Feito |
| Kanban com os valores no topo das colunas | Kanban | Feito |
| Cadastrar todos os projetos a partir da planilha | `npm run importar:carteira` (aba PIPELINE + BASE_OPERACIONAL) | Feito |
| Telas simples, sem barra de rolagem, que funcionem no celular | Regra de interface, com teste automático | Feito |
| Projeto nasce no cadastro e anda ou volta por qualquer caminho, com histórico | Motor de movimentação, Histórico | Feito em simulação (gravar depende do banco) |
| Log de toda alteração (o quê, quem, quando) | Histórico de alterações | Feito |
| Com quem está cada tarefa; em que ponto da contratação está | Cronogramas, Onde está parado | Feito |
| Predecessoras e etapas em paralelo | Aba Dependências (deduzida pela ordem e pelas datas) | Feito (decisão A; revisar com o cliente) |
| Reunião semanal, providências e ações | Reunião semanal | Feito em simulação |
| SEI: atualizar a partir do processo público | Processos no SEI, Licitação em detalhe | Feito em simulação; automático depende do banco |
| Captar recursos: convênios, alertas e prazos | Módulo Captação | Feito (SIMEC e SISMOB na Fase 4/5) |
| Saldo sem fonte (orçamento maior que repasse + contrapartida) | Ficha e Central de alertas | Feito |
| Cláusula suspensiva com prazo e alertas | Central de alertas (indício) | Parcial (falta a data oficial) |
| Fluxo da Lei 14.133: prazos, jurídico, PNCP, colocados | Prazos da lei, Licitação em detalhe | Parcial (PNCP e colocados a fazer) |
| Painel do prefeito: etapa, empresa, valor, foto atual e histórico | Gestão · Painel, Mapa | Parcial (empresa e proposta dependem do PNCP) |
| WhatsApp para o prefeito em linguagem simples | Gestão › WhatsApp | Simulação |
| Projetos "desejo" separados dos que serão executados | Campo compromisso | A fazer na carga (a planilha não tem o campo) |
| Projeto × oportunidade com sugestão | Fase 4 | A fazer |
| Medições, avanço físico e financeiro | Fase 4 | A fazer |
| Medir tempo e volume por colaborador | Fase 2 (contagem), Fase 5 (horas) | A fazer |
| IA para proposta, ETP e minutas | Fase 5 | A fazer (sem IA no MVP) |
| Orçamento por SINAPI e GOINFRA | Fase 5 | A fazer |

---

## 6. O que funciona de verdade e o que é simulação

O site é **estático** (Astro na Vercel). Não há banco de dados nem servidor próprio além do login. Na prática:
- **Ler dados** funciona: a carteira, os cronogramas e a Captação são gerados no build.
- **Gravar** ainda não existe: cadastro, movimentação, reunião, sala de guerra, links do SEI, licitações carregadas e WhatsApp ficam na aba do navegador e somem ao fechá-la. Cada tela mostra o aviso "Modo simulação".
- Todo dado lido do navegador é validado ao ler. Dado adulterado é descartado.

### SEI: por que ainda não é automático

- **O que já foi provado:** o link público do processo (`md_pesq_processo_exibir.php?<código>`) abre **sem captcha** depois de obtido. Foi testado em 15/11 e de novo em 16/11, com os mesmos links. O comando `npm run sei:ler -- "<link>"` lê um processo real e mostra o resumo.
- **Por que a tela não lê sozinha:** uma página do GovNexa, rodando no navegador, **não pode** ler outro site (trava de segurança CORS do navegador), e o SEI não autoriza.
- **Como fica:** a leitura automática precisa de um programa no servidor, rodando uma vez por dia, que leia os links guardados e grave o resultado no **banco**.
- **Enquanto o banco não existe:** a guia Licitação em detalhe aceita a página salva pelo navegador.
- **O que é sempre manual:**
  - o primeiro link de cada processo, porque a pesquisa pede captcha e o GovNexa **nunca** contorna captcha;
  - o conteúdo de documento **restrito**, que entra por PDF.
- **Regra do dono:** documento público é lido automaticamente; documento restrito entra por PDF.

### O que muda quando o banco existir (Fase 3)

1. **Gravação:** `src/lib/repositorio/` troca o JSON pelo PostgreSQL. As migrações `db/migracoes/001` a `004`, com RLS por prefeitura, e `scripts/gerar-sql-carga.ts` já foram validadas em PostgreSQL 16.
2. **Fim da carga temporária:** a pasta `data/carga-real/` sai do repositório.
3. **Simulações viram gravação real:** cadastro, Kanban, pendências, reunião, sala de guerra, links do SEI e WhatsApp.
4. **SEI automático:** a leitura diária precisa de autorização do dono para rodar no agendador da Vercel (`api/` e `vercel.json`, hoje intocáveis) ou num robô do GitHub.

---

## 7. Decisões já tomadas (não reabrir sem o dono)

- **Marca:** GovNexa vale só na plataforma. O site público e o login continuam com a marca anterior (`src/lib/marca.ts`, `USAR_NO_SITE_PUBLICO=false`).
- **Domínio:** continua o endereço atual. O plano prevê um subdomínio por prefeitura.
- **Prazos:** a lei é o limite e a prefeitura define **metas internas menores** (`data/config/prazos-internos.json`). Passar do teto legal é alerta grave. Prazos-piso (publicidade do art. 55, recurso) não podem ser encurtados.
- **Dependências entre etapas** (16/11): opção A. A dependência é deduzida pela ordem e pelas datas do cronograma, porque a planilha do GEPP não tem coluna de predecessora. Será revista quando o fluxo for validado com o cliente.
- **SEI:** não pedir agora à TI o serviço web do SEI. Usar o link público e o PDF.
- **Carga real:** publicada temporariamente em `data/carga-real/`, com aviso fixo na plataforma.
- **PDFs de referência:** são exemplo de conteúdo, não meta visual. A base são as planilhas.
- **Privacidade:**
  - nomes das pessoas da reunião nunca entram no projeto;
  - números do WhatsApp são cadastrados por cargo ou equipe;
  - "Interessados" do SEI não são lidos;
  - nomes de servidores nos andamentos são mascarados.

---

## 8. Pendências e próximos passos

### Dependem do dono

| Pendência | Para quê |
| --- | --- |
| Criar o banco na Vercel (Neon) e a chave nos segredos | Fase 3: gravar de verdade, SEI automático, fotos |
| Cadastrar o segredo `VERCEL_DEPLOY_HOOK` no GitHub | A rotina "Garantir publicação" aciona a Vercel quando ela não publica sozinha |
| Validar o Fluxo com as áreas e com o cliente | Confirmar etapas, dependências e subprocessos |
| Decreto de feriados de Goiânia | Contagem de dias úteis exata (hoje, feriados municipais conhecidos e aviso na tela) |
| Conta oficial do WhatsApp Business na Meta e aprovação dos 3 modelos | Envio real dos relatórios |
| Decidir se o SEI fica automático antes do banco (robô do GitHub) ou espera o banco | Leitura diária dos processos |

### Possíveis sem banco

1. **Leitura de PDF no navegador**, para documentos restritos do SEI. Exige a biblioteca `pdfjs-dist`, da Mozilla.
2. **SEI automático provisório** por um robô agendado no GitHub, se o dono autorizar.
3. **Projeto × oportunidade:** sugestão de programas abertos para cada projeto.
4. **Medições e avanço físico e financeiro**, quando houver fonte (planilha ou SISMOB/SIMEC).

---

## 9. Como rodar no computador

Requer Node.js 22.23.4 ou mais novo (o desenvolvimento atual usa o Node 26, que roda `.ts` direto) e npm.

```sh
npm ci
npm run dev          # http://localhost:4321
```

No modo local, `/plataforma/` abre **sem login**, porque a autenticação só roda nas funções da Vercel. Sem as variáveis `GOVNEXA_DADOS_*`, a carteira usa a carga de `data/carga-real/` ou os dados de exemplo.

| Comando | Para quê |
| --- | --- |
| `npm run build` | Baixa os dados (se configurado) e gera o site em `dist/` |
| `npm run preview` | Serve o `dist/` como em produção |
| `npx astro check` | Verificação de tipos (precisa dar 0 erros) |
| `npm run test:dados` | Testes rápidos em Node (~224): dados, carteira, cronograma, dependências, movimentação, log, prazos, painel, mapa, WhatsApp, alertas, SEI, licitação |
| `npx playwright test --project=chromium` | Testes de interface (~77), com axe (temas claro e escuro) e sem rolagem horizontal em 1280 e 390 px. Usam sempre os dados fictícios (`GOVNEXA_EXEMPLO=1`). Porta alternativa: `PLAYWRIGHT_PORT=4400`. Primeira vez: `npx playwright install chromium` |
| `npm run impacto` | Mostra as etapas do Fluxo afetadas pelos arquivos alterados e se o Fluxo foi atualizado junto |
| `npm run importar:carteira -- --planilha <arquivo>` | Importa a planilha da carteira, com conciliação e histórico (`--anonimizar`, `--autor`) |
| `npm run importar:cronogramas` | Importa os cronogramas do GEPP |
| `npm run geocodificar` | Centro dos bairros para o mapa |
| `npm run sei:ler -- "<link público>"` | Lê um processo do SEI uma vez e mostra o resumo, sem gravar nada |

---

## 10. Regras de trabalho (todas as pessoas e todas as sessões)

As regras completas estão em [CLAUDE.md](CLAUDE.md). Resumo:

1. **Comece da versão atual:** `git fetch origin` e `git pull --ff-only` no `main`. Numa branch de trabalho, traga o `main` (`git merge origin/main`).
2. **Uma branch por entrega, PR pequeno:** a descrição do PR diz o que mudou e o que **não** mudou. O merge é do dono; não use "Update branch" no GitHub.
3. **Antes do PR:**
   - `npx astro check` com 0 erros;
   - `npm run test:dados`;
   - `npx playwright test --project=chromium`;
   - `npm run impacto`.
4. **Fluxo do sistema:** se a mudança afeta etapa, tela ou situação, atualize na **mesma entrega** `src/lib/govnexa/fluxo.ts`, `subfluxos.ts` e `impacto.ts`.
5. **Interface:**
   - sem rolagem horizontal em 1280 e 390 px;
   - textos simples;
   - contraste certo nos temas claro e escuro;
   - a situação sempre escrita, não só por cor.
6. **Não mexer sem autorização do dono:** o login (`api/`, `lib/session.ts`, `middleware.ts`, `src/pages/entrar.astro`) e o `vercel.json`.
7. **Segurança:**
   - nunca senha ou chave no código;
   - texto vindo de fora entra na tela só por `textContent`;
   - JSON embutido na página com `<` escapado;
   - nunca contornar captcha;
   - revisar os 9 vetores de [docs/seguranca.md](docs/seguranca.md).
8. **Simulação:** tudo que grava fica em `sessionStorage`, com validação ao ler, até existir o banco.
9. **Registro:** toda entrega vai para [docs/CHANGELOG.md](docs/CHANGELOG.md) **e atualiza este README** no mesmo PR: situação, funcionalidades, decisões e pendências (regra 4 do [CLAUDE.md](CLAUDE.md)).

### Armadilhas conhecidas

- **Nomes de arquivo no build:** precisam ser só hexadecimais (`hashCharacters: 'hex'` em `astro.config.mjs`). A Vercel não servia arquivos com nome terminado em `_`, e o mapa ficava em branco. Depois de um merge que traz módulo novo, abra a página publicada e confira que todo `/_astro/*` responde 200.
- **Data de hoje:** use `hojeEmBrasilia()` (`src/lib/whatsapp/farol.ts`). A página estática não pode ficar presa ao dia do build; prazos e farol são recalculados no navegador.
- **Quebras de linha:** vários arquivos usam CRLF. Scripts que editam texto precisam aceitar `\r\n`.
- **`src/data/modules.json`:** é do outro desenvolvedor (protótipo de Licitações). Módulos novos entram por `src/lib/govnexa/catalogo.ts`.

---

## 11. Estrutura

```
api/, lib/, middleware.ts      Login (funções e middleware da Vercel). NÃO alterar sem o dono
astro.config.mjs               Build (nomes de arquivo hexadecimais)
coletores/                     Coletores de dados públicos (IBGE, CAUC, FNS, SICONFI, Transferegov, DOU, INEP, CNES, SINISA…)
data/config/                   Município ativo, feriados, metas internas de prazo, temas, secretarias
data/core/                     Dados públicos tratados, com proveniência em cada valor
data/carga-real/               Carga TEMPORÁRIA da planilha e dos cronogramas (sai com o banco)
data/exemplo/                  Dados fictícios (testes e demonstração)
db/migracoes/                  SQL do PostgreSQL com RLS por prefeitura (001 a 004)
scripts/                       Importadores, build de exemplo, impacto, geocodificação, leitor do SEI
src/pages/                     Site público e rotas da plataforma ([...module].astro, cronograma/[id], fluxo/[id], agenda.ics)
src/layouts/Platform.astro     Casca da plataforma: menu por módulo, tema, aviso de dados
src/lib/
  carteira/                    Carteira, macroetapas, movimentação, simulação
  cronograma/                  Cronogramas, visões, dependências
  sei/                         Leitor da página pública do SEI, análise, link, arquivo salvo
  licitacao/                   Licitação em detalhe
  prazos/                      Lei 14.133 e calendário com feriados
  alertas/                     Central de alertas
  gestao/, mapa/               Painel do prefeito e mapa das obras
  whatsapp/                    Permissões, base, mensagens, modelos (simulação)
  reuniao/, sala/, log/        Reunião semanal, sala de guerra, histórico
  repositorio/                 Repositório único JSON/PostgreSQL
  govnexa/                     Catálogo do menu, Fluxo, subfluxos, mapa de impacto
  dados/, projetos/            Bloco Captação e parecer de elegibilidade
src/components/                Telas de cada guia (pastas por assunto)
src/data/modules.json          Módulos demonstrativos de Licitações e Conta (outro desenvolvedor)
docs/                          Documentação (abaixo)
tests/                         Testes Node (*.test.ts) e Playwright (*.spec.ts)
```

---

## 12. Dados e rotinas automáticas (GitHub Actions)

| Rotina | Quando | O que faz |
| --- | --- | --- |
| Atualizar dados do bloco Captação | Todo dia, 09h30 (Brasília) | Roda os coletores e abre PR do ramo `dados-atualizados` |
| Atualizar dados mensais | Dia 5 de cada mês | INEP, SINISA e CNES; PR do ramo `dados-mensais-atualizados` |
| Garantir publicação na Vercel | A cada atualização do `main` | Confere se a Vercel publicou; se não, aciona o gancho (precisa do segredo `VERCEL_DEPLOY_HOOK`) |
| Portal da Transparência (coletar, explorar, testar) | Manual | Convênios pela API (chave em segredo do GitHub) |

Os PRs de dados automáticos precisam de revisão e merge, como qualquer outro.

## 13. Configuração (variáveis e segredos)

Nenhum valor fica no código. Só os nomes:

| Nome | Onde | Uso |
| --- | --- | --- |
| `AUTH_EMAIL`, `AUTH_PASSWORD_SHA256`, `AUTH_SECRET` | Vercel | Login da plataforma. Sem elas, o login fica bloqueado |
| `GOVNEXA_DADOS_REPO`, `GOVNEXA_DADOS_TOKEN`, `GOVNEXA_DADOS_REF` | Vercel | Baixar a carteira de um repositório privado no build |
| `VERCEL_DEPLOY_HOOK` | GitHub (segredo) | Gancho da rotina de publicação (ainda não cadastrado) |
| `PORTAL_TRANSPARENCIA_CHAVE` | GitHub (segredo) | Coletor de convênios |

Colaboradores não recebem esses valores.

## 14. Segurança

A revisão dos 9 vetores está em [docs/seguranca.md](docs/seguranca.md). Em resumo:
- `/plataforma/` exige sessão válida;
- o login bloqueia após 5 falhas;
- cabeçalhos de segurança e CSP ficam no `vercel.json`;
- os segredos ficam só na Vercel e no GitHub;
- CPFs de terceiros vindos do DOU são mascarados, e o teste de contrato falha se aparecer CPF ou dado bancário em `data/core`.

Nas telas novas, tudo que vem de fora (arquivo, link, `sessionStorage`) é validado e mostrado só como texto.

## 15. Documentação

| Arquivo | Conteúdo |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Regras de trabalho no repositório |
| [docs/govnexa/plano.md](docs/govnexa/plano.md) | **Plano completo do GovNexa** (detalhe de tudo que o README resume) |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Histórico de mudanças, entrega por entrega |
| [docs/govnexa/visao-geral.md](docs/govnexa/visao-geral.md) | GovNexa: módulos, macroetapas, roteiro e regras de código |
| [docs/govnexa/modelo-dados.md](docs/govnexa/modelo-dados.md) | Modelo de dados da carteira (JSON e PostgreSQL) |
| [docs/arquitetura.md](docs/arquitetura.md) | Arquitetura do bloco Captação |
| [docs/plano-execucao.md](docs/plano-execucao.md) | Plano e decisões do bloco Captação |
| [docs/manual-usuario.md](docs/manual-usuario.md) | Manual do usuário (Captação) |
| [docs/projetos-ia.md](docs/projetos-ia.md) | Parecer de elegibilidade (R01 a R21) e IA com revisão humana |
| [docs/regras-alertas.md](docs/regras-alertas.md) | Regras dos alertas da Captação |
| [docs/fontes/](docs/fontes/) | Fichas das fontes de dados |
| [docs/seguranca.md](docs/seguranca.md) | Revisão de segurança |
| [docs/esquema-postgres.sql](docs/esquema-postgres.sql) | Esquema do bloco Captação para PostgreSQL |
| [data/carga-real/LEIA-ME.md](data/carga-real/LEIA-ME.md) | Por que a carga real está no repositório e quando sai |

## Aviso

- **Módulos demonstrativos:** os registros (processos, valores, CNPJs, fornecedores, ofertas) são fictícios, assim como os exemplos marcados como "fictício" nas telas.
- **Captação:** os dados vêm de fontes públicas oficiais, com a origem indicada.
- **Carteira e cronogramas:** vêm da planilha da prefeitura, publicada temporariamente.
- O projeto não é um canal oficial da Prefeitura de Goiânia.
