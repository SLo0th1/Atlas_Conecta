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
