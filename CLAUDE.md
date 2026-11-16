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
- Registrar a entrega em `docs/CHANGELOG.md` e no `README.md` (regra 4).

## 3. Antes de abrir o PR
- `npx astro check` (0 erros), `npm run test:dados`, `npx playwright test --project=chromium`.
- `npm run impacto`: mostra as etapas do **Fluxo do sistema** afetadas. Se a mudança afetar o fluxo (etapa, tela ou situação), atualizar `src/lib/govnexa/fluxo.ts`, `subfluxos.ts` e `impacto.ts` na mesma entrega.
- Telas responsivas: sem rolagem horizontal em 1280px e 390px (celular); textos simples; contraste adequado nos temas claro e escuro.

## 4. README sempre atualizado (regra do dono, 16/11/2026)
O `README.md` é a fonte para dar continuidade: quem baixar o repositório precisa saber o que o sistema é, o que já foi feito, o que está sendo feito e o que falta.
- **Toda entrega** (todo PR que muda funcionalidade, decisão ou situação) atualiza o README no mesmo PR:
  - **seção 2:** situação por fase, % e entregas recentes;
  - **seção 3:** funcionalidades por guia e a situação de cada uma (disponível, simulação ou demonstrativo);
  - **seção 5:** pedidos de origem e onde estão;
  - **seção 7:** decisões novas do dono;
  - **seção 8:** pendências e próximos passos.
- **Mudança de direção do produto:** princípio novo, módulo novo ou nova regra de comportamento entra nas seções 1.1 a 1.3, com a data.
- **Plano completo** em `docs/govnexa/plano.md`, de conhecimento de todos: toda entrega atualiza a seção "Andamento" (data e hora, situação e % por fase, linha na tabela de entregas). Decisão, regra ou requisito novo entra na seção correspondente do plano, com a data.
- **Fora do README e do plano:** nomes de pessoas, credenciais, links privados e conteúdo da pasta `Doc Referencia/`.
- **Este arquivo (`CLAUDE.md`) é versionado:** quando uma regra de trabalho mudar, atualize-o no mesmo PR.

## 5. Cuidados
- Não alterar o login (`api/`, `lib/session.ts`, `middleware.ts`, `src/pages/entrar.astro`) nem `vercel.json` sem autorização do dono.
- A pasta local `Doc Referencia/` (insumos internos) nunca vai para o repositório.
- `data/carga-real/` é publicação **temporária** dos dados da planilha; será retirada quando houver banco de dados.
- Testes usam sempre os dados fictícios de `data/exemplo` (`GOVNEXA_EXEMPLO=1`).
- Nunca colocar senhas ou chaves no código; usar variáveis de ambiente/segredos.

Mais contexto: `README.md` (comece por ele), `docs/govnexa/plano.md` (plano completo), `docs/govnexa/visao-geral.md`, `docs/govnexa/modelo-dados.md` e `docs/CHANGELOG.md`.
