# Regras de trabalho no repositório (GovNexa)

Valem para todas as pessoas e para toda sessão do Claude Code que desenvolver neste projeto.

## 1. Ao abrir a sessão: começar sempre da versão mais atual
1. `git fetch origin`
2. Se estiver na `main` e ela estiver atrás de `origin/main`: `git pull --ff-only`.
3. Se estiver numa branch de trabalho: trazer a `main` atual para ela (`git merge origin/main`) antes de continuar.
4. Só então começar a desenvolver. Se houver alterações locais não salvas, salvar (commit na branch) antes de atualizar; nunca descartar trabalho de outra pessoa.

## 2. Manter o repositório sempre atualizado
- Trabalhar em branch própria (nunca direto na `main`); enviar (push) com frequência.
- PRs pequenos e frequentes, para o outro desenvolvedor sempre ter a versão mais recente. O merge na `main` é feito pelo dono do repositório; a publicação na Vercel acontece sozinha após o merge.
- Descrever no PR o que mudou e o que **não** mudou.

## 3. Antes de abrir o PR
- `npx astro check` (0 erros), `npm run test:dados`, `npx playwright test --project=chromium`.
- `npm run impacto`: mostra as etapas do **Fluxo do sistema** afetadas. Se a mudança afetar o fluxo (etapa, tela ou situação), atualizar `src/lib/govnexa/fluxo.ts`, `subfluxos.ts` e `impacto.ts` na mesma entrega.
- Telas responsivas: sem rolagem horizontal em 1280px e 390px (celular); textos simples; contraste adequado nos temas claro e escuro.

## 4. Cuidados
- Não alterar o login (`api/`, `lib/session.ts`, `middleware.ts`, `src/pages/entrar.astro`) nem `vercel.json` sem autorização do dono.
- A pasta local `Doc Referencia/` (insumos internos) nunca vai para o repositório.
- `data/carga-real/` é publicação **temporária** dos dados da planilha; será retirada quando houver banco de dados.
- Testes usam sempre os dados fictícios de `data/exemplo` (`GOVNEXA_EXEMPLO=1`).
- Nunca colocar senhas ou chaves no código; usar variáveis de ambiente/segredos.

Mais contexto: `docs/govnexa/visao-geral.md`, `docs/govnexa/modelo-dados.md` e `docs/CHANGELOG.md`.
