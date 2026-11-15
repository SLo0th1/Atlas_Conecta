# GovNexa — Inteligência para a gestão pública

Visão geral para quem trabalha no código. O plano completo, com dados internos da prefeitura, fica fora deste repositório (que é público).

## O que é

Sistema de gestão da carteira de projetos de uma prefeitura, do desejo do gestor à obra entregue. Um projeto é cadastrado uma vez e todas as telas são visões dele. O piloto é a Prefeitura de Goiânia; depois o produto poderá atender outras prefeituras, cada uma com acesso e dados isolados.

## Módulos

Independentes e integrados: cada um funciona sozinho e, quando dois estão ativos, conversam por referência ao projeto.

| Módulo | Pergunta que responde | Situação |
| --- | --- | --- |
| Projetos (núcleo) | O que vamos fazer, em que etapa está, com quem e quando entrega? | Página inicial com o roteiro (Fase 0); carteira na Fase 1 |
| Captação | De onde vem o dinheiro e que prazos de convênio corremos? | Em uso, com dados reais |
| Licitações | Como está cada licitação e cada contrato? | Guias atuais mantidas; fluxo da Lei 14.133 na Fase 4 |
| Gestão | Como está tudo, agora, em uma tela? (painel do prefeito) | Página inicial (Fase 0); conteúdo na Fase 4 |
| Conta | Relatórios, perfil e configurações | Como está |

O catálogo de módulos e o agrupamento do menu ficam em `src/lib/govnexa/catalogo.ts`. A lista `src/data/modules.json` não precisa mudar: cada `group` dela é ligado a um módulo por `GRUPO_PARA_MODULO`. Grupo novo sem ligação faz o teste `tests/govnexa/catalogo.test.ts` falhar de propósito.

## Ciclo de vida do projeto (macroetapas)

1. Demanda ou ideia
2. Estruturação (escopo e local)
3. Projeto e orçamento
4. Peças técnicas (DFD, ETP, mapa de riscos, TR ou projeto básico)
5. Contratação: fase interna (edital, parecer jurídico, ajustes, autorização)
6. Contratação: fase externa (publicação, julgamento, habilitação, recursos, homologação)
7. Mobilização (garantia, contrato, ordem de serviço)
8. Execução (medições, avanço físico e financeiro)
9. Entrega

Estados laterais: condicionado (aguarda recurso externo), suspenso, relicitar, revogado, cancelado, fundido.

## Roteiro

| Fase | Entrega |
| --- | --- |
| 0 · Base e identidade | Marca GovNexa na plataforma, menu por módulos, município por configuração, modelo de dados |
| 1 · Carteira de Projetos | Importação das planilhas com conciliação, carteira, ficha, Kanban por macroetapa, Gantt geral |
| 2 · Cronograma e equipe | Modelos de cronograma, etapas com responsável, dependências, Kanban de tarefas, reunião semanal, SEI |
| 3 · Produção com banco | PostgreSQL, perfis, histórico, isolamento por prefeitura |
| 4 · Contratação, convênios e Gestão | Lei 14.133, cláusula suspensiva, alertas, painel do prefeito |
| 5 · Integrações e inteligência | PNCP, SIMEC, SISMOB, tabelas de preço, notificações, IA |

## Regras para o código

- **Nada fixo em um município.** Nome, logo e código IBGE vêm de `data/config/municipio.json` (`src/lib/municipio-ativo.ts`).
- **Marca centralizada** em `src/lib/marca.ts`. A plataforma usa GovNexa; o site público e o login continuam com a marca anterior até decisão (`USAR_NO_SITE_PUBLICO`).
- **Dado real fora do repositório.** Exemplos e testes usam dados fictícios ou públicos; nada de planilhas internas, nomes de pessoas ou credenciais.
- **Calcular, não digitar:** status, percentuais, prazos e alertas saem de regras com teste.
- **Dado ausente não é zero:** mostra "—".
- **Prazos legais como parâmetros** com a referência da lei; a prefeitura pode fixar metas internas menores. Ultrapassar um teto legal é alerta vermelho; prazos que são piso (publicidade do edital, recurso) não podem ser encurtados.
- **SEI:** leitura da página pública de cada processo (andamentos e documentos públicos) a partir do link colado pelo usuário, e importação de PDF para documentos restritos. Nunca contornar captcha.
