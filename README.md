# Atlas Goiânia Conecta · GovNexa

Portal público **Atlas Goiânia Conecta** e plataforma de gestão pública **GovNexa** (piloto: Prefeitura de Goiânia).

- Produção: https://atlas.gestaonexus.com.br (Vercel, publica sozinho a cada atualização do `main`)
- Repositório: público. Só entram código, dados públicos e dados fictícios.

## O que tem aqui

| Parte | Onde | Situação |
| --- | --- | --- |
| Site público (início, setor público, fornecedores, compradores, Insights, demonstração) | `src/pages/` | No ar |
| Login da plataforma | `api/login.ts`, `api/logout.ts`, `middleware.ts`, `lib/` | No ar (um usuário, sessão de 8 h, limite de tentativas) |
| **Projetos** (núcleo GovNexa): início, Carteira com ficha, Kanban por macroetapa, Gantt geral, Visão por órgão | `src/lib/carteira/`, `src/components/carteira/` | Fase 1 entregue (dados de exemplo ou carteira real baixada no build) |
| **Captação**: Principal, Oportunidades, Acompanhamento, Alertas, Comparativo, Qualidade dos dados, Projetos (parecer automático) | `src/lib/dados/`, `src/lib/projetos/`, `coletores/` | Em uso, com dados públicos reais |
| **Licitações**: operação, planejamento, preços, automação, mercado e cadastros | `src/data/modules.json` | Protótipo demonstrativo (nada é gravado) |
| **Gestão** (painel do prefeito) e **Conta** | `src/lib/govnexa/catalogo.ts` | Página inicial; conteúdo nas próximas fases |

O roteiro por fases, as macroetapas do projeto e as regras de código do GovNexa estão em [docs/govnexa/visao-geral.md](docs/govnexa/visao-geral.md).

## Como rodar no computador

Requer Node.js 22.23.4 ou mais novo (validado com Node 24) e npm.

```sh
npm install
npm run dev          # http://localhost:4321
```

No modo local, `/plataforma/` abre **sem login**: a autenticação só roda nas funções da Vercel. Sem as variáveis `GOVNEXA_DADOS_*`, a carteira usa os dados de exemplo de `data/exemplo/carteira/`.

Outros comandos:

| Comando | Para quê |
| --- | --- |
| `npm run build` | Baixa a carteira real (se configurada) e gera o site em `dist/` |
| `npm run preview` | Serve o `dist/` como em produção |
| `npm run check` | Verificação de tipos do Astro |
| `npm run test:dados` | Testes rápidos (Node): contratos dos dados, qualidade, catálogo de módulos, limite de login, importador e visões da carteira |
| `npm test` | Testes de interface (Playwright, Chromium e WebKit; faz build e preview antes). Primeira vez: `npx playwright install chromium webkit` |
| `npm run importar:carteira` | Importa a planilha da carteira, com conciliação (detalhes em [docs/govnexa/modelo-dados.md](docs/govnexa/modelo-dados.md)) |

## Como colaborar

1. Crie um ramo a partir do `main` atualizado (`git switch -c nome-do-ramo`).
2. Faça as alterações e rode `npm run test:dados` e `npm run build`.
3. Envie o ramo e abra um Pull Request para o `main`. A Vercel gera uma prévia do PR.
4. Depois do merge, a Vercel publica o `main`. A rotina **Garantir publicação na Vercel** confere a publicação e, se ela não acontecer, aciona o gancho de publicação.
5. Registre a mudança em [docs/CHANGELOG.md](docs/CHANGELOG.md).

Não suba planilhas internas, documentos de reunião, nomes de pessoas, CPFs ou credenciais. As pastas `Doc Referencia/` e `.govnexa-dados/` já ficam fora do Git.

## Estrutura

```
api/, lib/, middleware.ts   Login (funções e middleware da Vercel)
coletores/                  Coletores de dados públicos (IBGE, CAUC, FNS, SICONFI, Transferegov, DOU, INEP, CNES, SINISA…)
data/config/municipio.json  Município ativo (nome, logo, código IBGE): nada fica fixo em Goiânia
data/core/                  Dados tratados, com proveniência em cada valor
data/exemplo/               Dados fictícios (carteira de exemplo)
scripts/                    Baixa da carteira real no build e importador da planilha
src/pages/                  Site público e rotas da plataforma ([...module].astro, agenda.ics)
src/lib/                    Regras e leitura de dados (carteira, dados, projetos, govnexa, marca, município)
src/components/             Tabelas, Kanban, Gantt, visão por órgão, gráficos
src/data/modules.json       Módulos demonstrativos de Licitações e Conta
docs/                       Documentação (abaixo)
tests/                      Testes Node (*.test.ts) e Playwright (*.spec.ts)
```

## Dados e rotinas automáticas (GitHub Actions)

| Rotina | Quando | O que faz |
| --- | --- | --- |
| Atualizar dados do bloco Captação | Todo dia, 09h30 (Brasília) | Roda os coletores e abre PR do ramo `dados-atualizados` |
| Atualizar dados mensais | Dia 5 de cada mês | INEP, SINISA e CNES, PR do ramo `dados-mensais-atualizados` |
| Garantir publicação na Vercel | A cada atualização do `main` | Confere se a Vercel publicou; se não, aciona o gancho |
| Portal da Transparência (coletar, explorar, testar) | Manual | Convênios pela API (chave em segredo do GitHub) |

Os PRs de dados automáticos precisam de revisão e merge, como qualquer outro.

## Configuração (variáveis e segredos)

Nenhum valor fica no código. Só os nomes:

| Nome | Onde | Uso |
| --- | --- | --- |
| `AUTH_EMAIL`, `AUTH_PASSWORD_SHA256`, `AUTH_SECRET` | Vercel | Login da plataforma. Sem elas, o login fica bloqueado |
| `GOVNEXA_DADOS_REPO`, `GOVNEXA_DADOS_TOKEN`, `GOVNEXA_DADOS_REF` | Vercel | Baixar a carteira real de um repositório privado no build |
| `VERCEL_DEPLOY_HOOK` | GitHub (segredo) | Gancho usado pela rotina de publicação |
| Chave do Portal da Transparência | GitHub (segredo) | Coletor de convênios |

A troca de senha está em `../ENTREGA-CODEX.md`, seção Rodada 3. Colaboradores não recebem esses valores.

## Segurança

Revisão dos 9 vetores em [docs/seguranca.md](docs/seguranca.md). Em resumo: `/plataforma/` exige sessão válida, o login bloqueia após 5 falhas, cabeçalhos de segurança e CSP ficam no `vercel.json`, os segredos ficam só na Vercel e no GitHub, e os CPFs de terceiros vindos do DOU são mascarados. O teste de contrato falha se aparecer CPF ou dado bancário em `data/core`.

## Documentação

| Arquivo | Conteúdo |
| --- | --- |
| [docs/govnexa/visao-geral.md](docs/govnexa/visao-geral.md) | GovNexa: módulos, macroetapas, roteiro e regras de código |
| [docs/govnexa/modelo-dados.md](docs/govnexa/modelo-dados.md) | Modelo de dados da carteira |
| [docs/arquitetura.md](docs/arquitetura.md) | Arquitetura do bloco Captação |
| [docs/plano-execucao.md](docs/plano-execucao.md) | Plano e decisões do bloco Captação |
| [docs/manual-usuario.md](docs/manual-usuario.md) | Manual do usuário |
| [docs/projetos-ia.md](docs/projetos-ia.md) | Guia Projetos: parecer, regras R01–R21 e IA com revisão humana |
| [docs/regras-alertas.md](docs/regras-alertas.md) | Regras dos alertas |
| [docs/fontes/](docs/fontes/) | Fontes de dados |
| [docs/seguranca.md](docs/seguranca.md) | Revisão de segurança |
| [docs/esquema-postgres.sql](docs/esquema-postgres.sql) | Esquema para a futura etapa com PostgreSQL |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Histórico de mudanças |

## Aviso

Registros dos módulos demonstrativos (processos, valores, CNPJs, fornecedores, ofertas) são fictícios. Os dados do bloco Captação vêm de fontes públicas oficiais, com a origem indicada. O projeto não é um canal oficial da Prefeitura de Goiânia.
