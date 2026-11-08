# Atlas Goiânia Conecta

Projeto local em Astro 7.4.7 + TypeScript e CSS próprio. Site estático e protótipo navegável, sem backend e sem dependência de rede em tempo de execução. Identidade, SVGs e textos próprios; a referência foi utilizada para a estrutura dos módulos, colunas e campos.

## Como rodar

Requer Node.js >=22.23.4 (validado com Node 24.22.2) e npm.

```sh
cd app
npm install
npm run dev
npm run check
npm run build
npm run preview
```

Neste ambiente, o cache global do npm e a pasta de preferências do Astro não permitem escrita. As verificações foram feitas com:

```sh
npm install --cache /tmp/atlas-npm-cache
ASTRO_TELEMETRY_DISABLED=1 npm run check
ASTRO_TELEMETRY_DISABLED=1 npm run build
```

`dist/` contém a saída estática. Configure o servidor para servir `404.html` com status 404. Antes de publicar, substitua `site` em `astro.config.mjs` pelo domínio definitivo: canonical, Open Graph, robots e sitemap usam esse valor. Contatos `.example` e WhatsApp são ilustrativos.

## Estrutura

- `src/layouts/`: layout público e estrutura da plataforma.
- `src/pages/`: páginas públicas, categorias, artigos e rotas estáticas da plataforma.
- `src/content/insights/`: oito textos Markdown, dois por tipo, validados por content collection.
- `src/data/modules.json`: 24 módulos, colunas, campos e registros fictícios. `source` identifica o número correspondente no mapa original.
- `src/data/offers.json`: 12 ofertas fictícias.
- `src/components/`: listagem de Insights, tabelas, marketplace e gráfico SVG.
- `src/scripts/`: menu, tema e comportamento das tabelas.
- `src/styles/global.css`: estilos, responsividade e temas.
- `public/`: SVGs originais; `robots.txt` é gerado por endpoint estático.
- `tests/`: aceitação Playwright e axe; configuração para Chromium e WebKit.

## O que é exemplo

Todos os processos, valores, CNPJs, pessoas, fornecedores, secretarias associadas a registros, indicadores, SLAs e ofertas são inventados. O projeto não representa a Prefeitura de Goiânia e não utiliza dados operacionais dela. Diligências, embarcações e fluxos de marketplace do mapa também foram mantidos como demonstração; locais de entrega adaptam o módulo de portos ao contexto municipal.

Busca, filtros, ordenação, paginação, visualização de registros, rascunhos de documentos e cesta funcionam no navegador. Ações de cadastro, exportação, configuração, negociação, envio e IA são simuladas e exibem **“protótipo: nada é gravado”**. Não há API, autenticação, geração real por IA ou transação. Os campos da referência são controles demonstrativos; valores e opções são exemplos, e não regras do sistema real.

A preferência de tema fica no `localStorage`. A cesta usa `sessionStorage` apenas para permitir a navegação entre catálogo, oferta e cotação e desaparece ao encerrar a sessão da aba. Nenhum dado é enviado a um servidor. O formulário público valida os campos e prepara um link `mailto:`, sem envio automático. A abertura de um aplicativo de e-mail depende da configuração do dispositivo.

## Testes e validação

Somente Chromium e WebKit estão configurados. O Playwright executa build e preview da produção antes dos testes, sem reutilizar servidores. Para executar:

```sh
npx playwright install chromium webkit
npm test
```

A suíte cobre páginas públicas e módulos em 1280/375 px, cabeçalho, submenu, menu móvel e foco, busca/tipo/tag/paginação dos Insights, páginas de tipo, artigos, tabelas, cesta, validação do formulário, tema, 404 e axe nos temas claro/escuro. Lighthouse e conformidade visual/WCAG precisam de verificação posterior em navegador; não se afirma nota ≥95 sem medição.

Rodada 1: build aprovado (58 páginas); Astro Check com zero erros, avisos e sugestões; `npm audit --omit=dev`: `found 0 vulnerabilities`. Schema adaptado para `astro/zod`. Sharp 0.35.5 é dependência transitiva do Astro, sem dependência direta ou uso no código da aplicação.

Playwright foi executado: Chromium 0 passaram/17 falharam ao iniciar (`bootstrap_check_in ... Permission denied (1100)`); WebKit 0 passaram/17 falharam ao iniciar (`Abort trap: 6`, saída 134). Nenhuma asserção da aplicação ou axe foi alcançada. Evidências em `test-results/*/error-context.md`. É necessário repetir em terminal com permissão para iniciar navegadores.

O preview padrão usa 4321. `--ignore-lock` mantém Astro 7 em primeiro plano, evitando o modo automático de segundo plano em agentes. Para porta ocupada: `PLAYWRIGHT_PORT=4322 npm test` (porta da execução registrada). A primeira tentativa deixou um preview em segundo plano em 4321, PID 52487; o ambiente recusou encerrá-lo com EPERM. Encerrar pelo terminal do usuário com `npx astro preview stop`.

A plataforma tem barra própria, busca global nos registros do painel, notificações ilustrativas, menu da conta e gaveta móvel com Escape e ciclo de foco. Tabelas têm etiquetas de status e primeira coluna fixa na rolagem móvel. Insights têm resumos e corpos distintos.
