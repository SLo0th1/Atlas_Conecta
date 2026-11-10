# Arquitetura — bloco Captação

Resumo vivo (detalhes e decisões em `plano-execucao.md`).

- **Frontend:** Astro + TypeScript, páginas estáticas (rodam em qualquer hospedagem: Vercel hoje; Hostinger ou servidor próprio depois).
- **Coletores:** scripts Node/TypeScript em `coletores/`, agendados pelo GitHub Actions (repositório público: somente dados públicos; chaves em segredos, nunca no código).
- **Dados:** `data/raw` (bruto, fora do Git) → `data/core/*.json` (tratado, com proveniência) → telas, sempre por `src/lib/dados/` (hoje JSON; depois PostgreSQL, sem mudar as telas).
- **Proveniência em todo valor:** fonte, url_origem, data_referencia, data_coleta, id_carga, hash_arquivo.
- **Multimunicípio:** tudo indexado por código IBGE e CNPJ; município piloto em `data/config/municipio.json`.
- **Banco futuro:** PostgreSQL (decisão do dono, 2026-11-09). Esquema das entidades: Plano Mestre, Parte 4.
- **Login:** continua o atual (um usuário, funções da Vercel) até a etapa de perfis.
