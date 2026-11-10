# Revisão de segurança — 9 vetores (2026-11-10)

Escopo: aplicação Astro (páginas estáticas + funções de login na Vercel), coletores, workflows do GitHub Actions e a nova camada de dados. Regra de referência: linha de base de segurança do dono (9 vetores). Cada vetor foi checado explicitamente.

| # | Vetor | Resultado | Onde | O que foi feito |
|---|---|---|---|---|
| 1 | XSS | **1 achado corrigido**; resto OK | `src/pages/insights/[slug].astro:5` (JSON-LD com `set:html`) | `JSON.stringify` não escapa `<`; um título contendo `</script>` fecharia a tag. Passou a escapar `<` como `<`. O diálogo de detalhes (`src/layouts/Platform.astro`) monta o conteúdo só com `textContent` e aceita links apenas `https://`. Não há outro `innerHTML`/`set:html` no código. CSP adicionada como camada extra (`vercel.json`). |
| 2 | Rotas de API expostas | OK | `middleware.ts:3` (matcher `/plataforma` e `/plataforma/:path*`), `api/login.ts`, `api/logout.ts` | As telas com dados (Captação) ficam sob `/plataforma/` e exigem sessão válida. As únicas rotas de API são login (POST) e logout. Não há rota de debug/admin. Arquivos `data/` não são servidos (só entram no build). |
| 3 | Chaves de API expostas | OK, 1 observação | `.env.example` (sem valores), workflows | A chave do Portal da Transparência só existe como segredo do GitHub e é lida por variável de ambiente (`coletores/portal-transparencia.ts`); nunca impressa nem gravada. Observação: `coletores/receita-cnpj-fundos.ts:13` traz o **token público** do compartilhamento da Receita (é público por desenho; não é credencial), documentado em `docs/fontes/receita-cnpj.md`. |
| 4 | Banco de dados aberto | N/A hoje | — | Não há banco. Requisito já registrado para a etapa PostgreSQL: conexão só por rede interna, usuário de aplicação com privilégio mínimo, nunca superusuário, credenciais em segredo. |
| 5 | SQL injection | N/A hoje | `docs/esquema-postgres.sql` | Não há consultas. Regra para a camada PostgreSQL: somente consultas parametrizadas; nomes de tabela/coluna dinâmicos só contra lista fixa. |
| 6 | Limite de tentativas de login | **Achado corrigido** | `api/login.ts:16,27,30`, `lib/rate-limit.ts`, `tests/seguranca/rate-limit.test.ts` | O login não tinha limite. Agora: 5 falhas em 15 min por IP **ou** por e-mail geram bloqueio de 1 min, dobrando a cada nova falha, teto de 1 h. Nem compara a senha enquanto bloqueado, e a mensagem não revela se o e-mail existe. 6 testes automatizados + teste manual do endpoint (6ª tentativa já bloqueada, inclusive com a senha certa). |
| 7 | Prompt injection | N/A hoje; requisito registrado | — | Ainda não há LLM. Textos externos (DOU, programas, descrições) já são exibidos apenas como texto. Na Fase 4 (IA): tratar esses textos como **dado**, isolar instruções, e nenhuma ação (gravar, aprovar, enviar) sem confirmação humana (já é regra do Plano Mestre). |
| 8 | Pacotes inventados | OK | `package.json` | Dependências: `astro`, `@astrojs/sitemap`, `@fontsource/poppins`, `@astrojs/check`, `@axe-core/playwright`, `@playwright/test`, `typescript` — todas existentes, mantidas e já presentes antes desta sessão. Nenhuma dependência nova foi adicionada ao projeto (coletores usam só o Node). |
| 9 | Rate limiting | **Parcial** | `lib/rate-limit.ts`, Vercel Firewall | O login tem limite no código (ver 6). Limitação: o estado fica na memória da função (serverless): cada instância conta separado e reinicia ao ser reciclada. **Falta** a regra de Rate Limiting do Vercel Firewall (passos abaixo) para cobrir o site todo e ataques distribuídos. |

## Cabeçalhos de segurança adicionados (`vercel.json`)
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` e `Content-Security-Policy` (`default-src 'self'`; scripts e estilos `'self'` + inline, exigido pelo Astro; `frame-ancestors 'none'`; `form-action 'self'`). **Conferir na prévia da Vercel** se nada quebrou (abrir o site, o login e as telas do bloco Captação).

## Recomendações que dependem do dono (não alteradas)
1. **Hash da senha**: o login compara SHA-256 simples (`lib/session.ts:35`), sem sal nem custo. Se o segredo da Vercel vazar, a senha cai por força bruta offline. Recomendo migrar para PBKDF2/scrypt (exige regerar o hash da senha na Vercel).
2. **Bloqueio por e-mail permite negação de acesso**: quem errar a senha 5 vezes com o e-mail real bloqueia o login do dono por 1 min ou mais. É o custo normal desse tipo de proteção; o Firewall resolve melhor por IP.
3. **Ativar 2FA** nas contas da Vercel e do GitHub.
4. **Dados públicos**: o repositório é público; só entram dados públicos. As citações do DOU têm CPFs de terceiros mascarados (LGPD) e o teste de contrato `npm run test:dados` falha se aparecer CPF ou dado bancário em `data/core`.

## Passos para ativar o Rate Limiting no Vercel Firewall
1. Entre em https://vercel.com/dashboard e abra o projeto do Atlas Conecta.
2. Clique em **Firewall** (menu do projeto).
3. Clique em **Configure** e depois em **Add Rule** (regra personalizada).
4. Condição: **Request Path** *equals* `/api/login`. Em **Then**, escolha **Rate Limit**: por exemplo 10 requisições por minuto por IP; ação **Deny** (ou *Challenge*).
5. Salve e clique em **Publish** para ativar.
6. Resultado esperado: tentativas repetidas ao login passam a receber bloqueio imediato da Vercel, antes de chegar ao código.
(Os recursos disponíveis dependem do plano; se a opção não aparecer no plano atual, a defesa do código continua valendo.)
