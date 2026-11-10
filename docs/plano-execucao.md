# Plano de execução — Fase 0 (Fundação e descoberta)

Bloco **Captação** do Atlas Conecta. Documento de planejamento: **nenhum código foi escrito**. Aguarda confirmação do dono do produto antes da execução.

Data: 2026-11-09 · Base: Plano Mestre (Partes 1 a 9) + decisões do dono desta sessão.

## 1. Decisões que orientam o plano

| # | Decisão | Consequência |
|---|---------|--------------|
| D1 | Prevalece a arquitetura que o sistema já usa (Astro + TypeScript, páginas estáticas, dados em JSON, funções de login na Vercel). | A stack do Plano Mestre (Python/FastAPI, Next.js, Prefect, PostgreSQL) **não** é adotada agora. Coletores em Node/TypeScript. |
| D2 | Foco em funcionalidades, ainda sem dados concretos. | Telas e fluxos primeiro, com dados de exemplo marcados como fictícios. |
| D3 | O que não estiver definido deve ser seguro, gratuito e portável (Vercel hoje; Hostinger ou servidor próprio depois). | Sem serviço pago nem dependência exclusiva da Vercel no código de negócio. |
| D4 | Pronto para receber banco de dados na etapa seguinte. | Camada de dados com interface única; hoje lê JSON, amanhã lê o banco, sem mudar as telas. |
| D5 | Multimunicípio desde o início (Plano Mestre 1.2). | Todo dado indexado por código IBGE e CNPJ; nenhum "Goiânia" fixo nas regras novas (município vem de configuração). |

## 2. Arquitetura da Fase 0 (adaptada)

```
fontes oficiais ──► coletores (Node/TS, scripts) ──► data/raw (bruto + hash)
                                                  └─► data/core/*.json (tratado, com proveniência)
telas Astro (bloco Captação) ──► camada de dados (src/lib/dados) ──► hoje: JSON  |  depois: banco
```

- **Camada de dados** (`src/lib/dados/`): funções como `listarInstrumentos(municipio)`; as telas só chamam essas funções. Trocar JSON por banco é trocar a implementação, não as telas (D4).
- **Proveniência** em todo valor: `fonte`, `url_origem`, `data_referencia`, `data_coleta`, `id_carga`, `hash_arquivo` (Plano Mestre 3.3). Já entra no formato dos JSON.
- **Agendamento gratuito:** GitHub Actions (cron) roda os coletores; o repositório é público, então só entram dados públicos, sem chaves nem dados pessoais. As chaves ficam em segredos do GitHub/Vercel.
- **Portabilidade:** as páginas são estáticas (rodam em qualquer hospedagem). As funções `api/login.ts` e `api/logout.ts` são específicas da Vercel; a fase de portabilidade (Fase 1 do nosso lado) as isola atrás de um adaptador para rodar também em Node na Hostinger ou em servidor próprio.
- **Futuro banco:** o desenho das tabelas (Parte 4 do Plano Mestre) é entregue na Fase 0 como esquema neutro. Banco escolhido pelo dono: **PostgreSQL** (gratuito, roda na Hostinger ou em servidor próprio).

## 3. Tarefas da Fase 0

### T1. Estrutura do repositório e padrões
- Criar `docs/` (`arquitetura.md`, `regras-alertas.md`, `CHANGELOG.md`, `fontes/`), `coletores/`, `data/{raw,core,config}/`, `src/lib/dados/`.
- `data/config/municipio.json` com Goiânia (IBGE 5208707) como **primeiro cadastro**, e `.env.example` sem valores.
- Padrões: UTF-8 sem BOM, TypeScript estrito, `npm run check` e build como portão antes de cada entrega.
- **Aceite:** build e `astro check` passam; nenhuma credencial no repositório.

### T2. Validar cada fonte (Parte 2) e documentar em `docs/fontes/`
Uma ficha por fonte com: URL, método de acesso, autenticação, limite de requisições, frequência da fonte, campos usados, **data da última validação**. Para cada fonte será feito um teste real de acesso (sem gravar dado de produção) e o resultado, inclusive "endpoint mudou", entra na ficha.

| Ordem | Fonte | Verificar antes de implementar |
|-------|-------|-------------------------------|
| 1 | Transferegov (arquivos abertos) | Endereço atual do repositório de dados abertos; nomes e layout dos arquivos |
| 2 | Transferegov (API: especiais, fundo a fundo, TED) | Endpoints e Swagger de cada módulo |
| 3 | Portal da Transparência | Chave gratuita; limite por minuto; rotas de convênios e emendas |
| 4 | CAUC (STN) | Se existe arquivo aberto ou API antes de usar robô |
| 5 | SICONFI | Endpoints RREO, RGF, DCA |
| 6 | FNS | Endpoints que o portal consome |
| 7 | IBGE | Localidades, agregados, malhas |
| 8 | DATASUS / CNES | CKAN e API de dados abertos |
| 9 | FNDE / INEP | CKAN |
| 10 | MDS / FNAS | Relatórios e dados abertos |
| 11 | SINISA | Formato de publicação |
| 12 | DOU (INLABS) | Cadastro e formato do XML |
| 13 | Novo PAC e editais | Páginas e estrutura para coleta |
| 14 | Receita (CNPJ) | Carga de dados abertos e filtro por natureza jurídica de fundo |
| 15 | Congresso | APIs da Câmara e do Senado |

- **Aceite:** 15 fichas preenchidas, cada uma com data de validação e resultado do teste.

### T3. Credenciais (ações do dono — não posso fazer)
1. **Portal da Transparência:** acessar o portal, ir em "API de dados", fazer o cadastro com conta gov.br e gerar a chave. Guardar nos segredos do GitHub (nunca no código).
2. **INLABS:** cadastrar-se em inlabs.in.gov.br com e-mail institucional.
3. Informar a mim apenas que foram obtidas; os valores **não** devem ser colados no chat.

### T4. Tabela mestre do IBGE
- Carregar municípios, UF, regiões metropolitanas e capitais a partir das APIs de localidades do IBGE.
- Saída: `data/core/ibge-municipios.json` com proveniência.
- **Aceite:** 27 capitais identificadas; Goiânia com código 5208707 e população com data de referência.

### T5. CNPJs da Prefeitura e dos fundos
- Levantar nos dados abertos da Receita os CNPJs do município e dos fundos (natureza jurídica de fundo público), gerar lista candidata e **marcar como "pendente de validação"**.
- **Aceite:** lista entregue à prefeitura; só vira "validada" após confirmação humana (ação do dono / prefeitura).

### T6. Tabela de temas e secretarias
- `data/config/temas.json`: tema ↔ função/subfunção orçamentária ↔ órgão concedente ↔ palavras-chave (drenagem, mobilidade, saúde, educação, assistência social e outros).
- `data/config/secretarias.json`: secretarias, temas e CNPJs vinculados.
- **Aceite:** revisada pelo dono; usada pela busca por necessidade nas fases seguintes.

### T7. Esqueleto do bloco Captação (interface)
Evolução do bloco criado nesta sessão, só com dados de exemplo, para validar o fluxo antes dos dados reais. Guias previstas (nomes ajustáveis, como você pediu):
`Principal` (painel do município) · `Oportunidades` · `Acompanhamento` · `Alertas` · `Projetos`.
Cada uma com selo "dados de exemplo" até existir carga real.
- **Aceite:** guias navegáveis, responsivas e com acessibilidade verificada.

## 4. Fora do escopo da Fase 0 (próximas fases)
Coletores em produção, banco de dados, motor de alertas, agenda, IA com revisão humana, login gov.br, perfis e segregação por secretaria. A **autenticação atual (um usuário)** continua como está.

## 5. Riscos específicos desta adaptação

| Risco | Mitigação |
|-------|-----------|
| Repositório público: dado indevido exposto | Só dados públicos no repositório; chaves em segredos; revisão antes de cada commit de `data/` |
| Limites do GitHub Actions gratuito | Cargas incrementais por hash; ajustar frequência; migrar o agendador para servidor próprio se necessário |
| Funções da Vercel presas à plataforma | Adaptador isolado (portabilidade) antes da migração |
| Sem banco, sem perfis reais | Fase 0 mantém login único; perfis entram junto com o banco |
| Fonte mudou de endereço | Verificação registrada em `docs/fontes/` antes de cada coletor |

## 6. Perguntas para confirmar antes de começar

- **Q1.** Os coletores devem rodar em **Node/TypeScript** (mesma stack, mais simples) em vez de Python? *(recomendado: sim)*
- **Q2.** Posso usar **GitHub Actions** como agendador gratuito, sabendo que o repositório é público? *(recomendado: sim)*
- **Q3.** Banco futuro: **PostgreSQL** (decidido pelo dono em 2026-11-09).
- **Q4.** A Fase 0 pode começar por **T1, T2 e T4** (não dependem de chaves), enquanto você obtém as chaves da T3?
- **Q5.** O outro desenvolvedor já tem trabalho em `docs/` ou nesse bloco? (evitar conflito antes de criar as pastas)

## 7. Fluxo de trabalho colaborativo
Antes de cada tarefa: `git fetch` + `git pull --ff-only`. Trabalho em branch própria, Pull Request para revisão, merge na `main` por decisão do dono. Cada fase termina com atualização do `docs/CHANGELOG.md` e relatório de entregas, critérios de aceite e pontos de melhoria.
