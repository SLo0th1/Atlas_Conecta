# Manual do usuário: bloco Captação (Atlas Conecta)

**Versão inicial e provisória.** Os limites, pesos e textos marcados como *provisório* ainda serão definidos com o dono do produto.

---

## 1. O que é o bloco Captação

O bloco **Captação** reúne, em um só lugar, o que a Prefeitura precisa saber para **buscar, acompanhar e não perder recursos federais**:

- quanto o governo federal já repassou e quanto ainda falta liberar a convênios em andamento;
- que programas federais estão com inscrições abertas para o município;
- o que pode colocar esses recursos em risco (vigência acabando, pendência no CAUC, convênio parado);
- o que foi publicado no Diário Oficial da União sobre o município.

**Para quem serve:** equipe de captação de recursos e gestores da Prefeitura que decidem o que propor, o que cobrar e onde agir.

**O que o bloco não faz (ainda):** não envia propostas, não preenche formulários nos portais federais e não substitui a consulta oficial. Ele **mostra dados públicos** e **indica o que conferir**. Toda decisão deve ser confirmada no portal oficial indicado em cada tela.

**Sobre os dados:** são dados públicos de fontes oficiais. O bloco não mostra dados bancários nem dados pessoais. CPFs de terceiros que aparecem em publicações do Diário Oficial são mascarados.

---

## 2. Como acessar

1. Entre na Plataforma do Atlas Conecta com o login e a senha que você já usa.
2. No menu, clique em **Plataforma**.
3. Clique em **Captação**.
4. Aparecem cinco guias, nesta ordem: **Principal**, **Oportunidades**, **Acompanhamento**, **Alertas** e **Projetos**.

**Acesso atual:** há um único login para o município. Perfis separados por secretaria entram depois, junto com o banco de dados. Enquanto isso, quem tem o login vê todas as guias.

**Resultado esperado:** a tela abre na guia Principal, com uma tabela de indicadores. Em cada tabela há a coluna **Fonte** e a **Data de referência**.

---

## 3. Guia por guia

### 3.1 Principal

É o painel do município. Cada linha é um indicador. A coluna **Situação** usa três rótulos:

- **Atenção**: há algo a conferir (por exemplo, saldo a liberar maior que zero).
- **Em dia** ou **Regular**: nada a conferir pelas regras atuais.
- **Informativo**: número de contexto, sem regra de alerta.

| Indicador | O que significa |
|---|---|
| Convênios municipais em execução | Quantos convênios e contratos de repasse em que a Prefeitura é a convenente estão com situação "Em execução" no Transferegov. Não entram concluídos, em prestação de contas ou anulados. |
| Repasse pactuado (em execução) | Soma do valor de repasse da União desses convênios. **Não inclui a contrapartida** da Prefeitura. |
| Já liberado (desembolsado) | Total que a União já desembolsou nesses convênios. |
| Saldo a liberar | **Repasse pactuado − já desembolsado**, só em convênios em execução. É o dinheiro que ainda pode vir. |
| Assinados sem nenhum desembolso | Convênios em execução com valor liberado igual a zero. |
| Regularidade no CAUC | Se o município cumpre os requisitos fiscais para receber transferências voluntárias da União. Uma pendência bloqueia novos repasses. |
| Despesa com pessoal / RCL | Percentual da receita corrente líquida gasto com pessoal, pelo RGF do SICONFI. A Lei de Responsabilidade Fiscal fixa limites. Ultrapassar limites afeta a capacidade de dar contrapartida. |
| Repasses do FNS ao Fundo Municipal | Repasses da saúde do governo federal ao Fundo Municipal de Saúde, no ano. Não inclui o Fundo Estadual. |
| Programas abertos para o município | Programas federais com prazo de proposta aberto para prefeituras de Goiás. Detalhes na guia Oportunidades. |
| Citações no DOU | Publicações da Seção 1 do Diário Oficial da União, no mês coletado, que citam o município ou os CNPJs monitorados. |
| Educação básica | Escolas, matrículas, IDEB e comparação de anos, pelo Censo Escolar e IDEB do INEP. |
| Alertas abertos | Quantos alertas existem, por gravidade e por tipo. Detalhes na guia Alertas. |

**Como usar o "Ver detalhes":**

1. Na linha do indicador, clique em **Ver detalhes**.
2. Abre um painel com o título do indicador, o **que é** (explicação), a **lista** dos itens que formam o número e a **Fonte**.
3. Exemplo: em **Saldo a liberar**, a seção "De onde vêm os saldos (por convênio)" mostra quanto cada convênio contribui. Assim você sabe onde está o dinheiro a liberar.
4. Em **Já liberado**, a seção "Convênios com liberação" traz as datas e valores dos desembolsos.
5. Em **Assinados sem nenhum desembolso**, a lista mostra há quantos dias cada convênio foi assinado.

**O que observar:** se um número parecer errado, compare com a fonte citada no detalhe e com o portal oficial antes de agir.

### 3.2 Oportunidades

Lista os **programas federais com prazo aberto** para prefeituras de Goiás (59 no último levantamento de dados reais). Colunas:

| Coluna | Como ler |
|---|---|
| Código | Código do programa no Transferegov. Use para buscar no portal oficial. |
| Programa | Nome oficial do programa. |
| Concedente | Ministério ou órgão que oferece o programa. |
| Modalidade | Tipo de transferência (ver glossário: convênio ou contrato de repasse). |
| Prazo | Data-limite e **tipo do prazo**: *Proposta* (inscrição normal), *Emendas* (só propostas ligadas a emendas parlamentares) ou *Beneficiário específico*. |
| Tema | Assunto do programa (drenagem, saúde, educação e outros). Classificação por palavras-chave, **provisória**. Se aparecer "A classificar", leia o texto oficial. |
| Status | "Atenção: prazo curto" quando faltam **15 dias ou menos**; "Aberto" nos demais casos. |

**Como ler o "Ver detalhes" de um programa:**

- **Do que se trata:** nome, órgão, código, data em que foi disponibilizado e, quando houver, a ação orçamentária.
- **Principal objetivo (resumo do texto oficial):** trecho inicial do texto oficial do programa, sem reescrita. Se o texto for longo, a descrição completa aparece em seguida.
- **Critérios de seleção** e **Observações do órgão:** copiados do texto oficial, para leitura.
- **Valor mínimo e contrapartida:** veja a seção 7 (limites). A fonte aberta **não traz** a regra oficial de valor mínimo/máximo nem o percentual de contrapartida. A tela mostra o que o texto oficial menciona e, quando há propostas de prefeituras já enviadas, **valores observados** (mínimo, mediana e máximo). Esses valores são **referência, não regra**.
- **Em linguagem simples:** resumo de uma linha sobre o que a prefeitura precisa fazer. Quando o único prazo é o de emendas, o texto explica que só é possível propor se algum parlamentar tiver indicado emenda para o município.
- **Prazos:** datas de cada tipo de prazo, com a contagem de dias (por exemplo, "faltam 12 dias").
- **Tipo de transferência:** explica convênio e contrato de repasse.
- **Quem pode propor:** tipos de ente que podem apresentar proposta (prefeituras, estados, consórcios, organizações da sociedade civil).
- **Temas e secretarias envolvidas:** secretarias que costumam ser responsáveis. Lista genérica, **provisória**, a ser validada pelo dono.
- **Quem já propôs a este programa:** número de propostas registradas, quantas são de prefeituras, valores pedidos pelas prefeituras (mínimo, mediana e máximo), municípios de Goiás que propuseram e capitais que propuseram. Se nenhuma prefeitura propôs, a tela informa; isso pode indicar programa novo, restrito ou de baixa adesão.
- **Situação do município para receber (CAUC):** se o CAUC do município está regular na data de referência.
- **Como pedir (roteiro geral):** passos genéricos de pedido. Confirme sempre no programa.
- **Documentos geralmente exigidos:** lista genérica (plano de trabalho, projeto básico, certidões, contrapartida). **Confirme no edital ou nas orientações do programa.**
- **Links:** (a) documentos citados no texto oficial, como edital e orientações, quando o órgão os indica; (b) busca do código no Transferegov Discricionárias; (c) portal de transferências da União.

**Atenção:** o edital em PDF **não é baixado nem mostrado** pelo bloco. Leia-o pelo link.

### 3.3 Acompanhamento

Lista os **convênios municipais em execução**, do maior para o menor **saldo a liberar**. Só entram convênios com situação "Em execução".

| Coluna | Como ler |
|---|---|
| Convênio | Número do convênio no Transferegov. |
| Objeto | O que o convênio financia. |
| Concedente | Órgão federal que repassa o recurso. |
| Valor pactuado | Repasse da União previsto no convênio. |
| Valor liberado | Total já desembolsado pela União. |
| Valor a liberar | **Pactuado − liberado**. É o saldo ainda não recebido. |
| Vigência | Data até a qual o convênio pode ser executado. |
| Situação | "Atenção: vigência curta" quando a vigência termina em **90 dias ou menos** (ou já passou); "Atenção: sem desembolso" quando nada foi liberado; "Em execução" nos demais casos. |

**Como ler o "Ver detalhes" de um convênio:**

- **Do que se trata:** objeto e proponente.
- **Quem concede:** órgão superior, órgão e modalidade.
- **Valores:** valor global, repasse, contrapartida (com percentual sobre o valor global), já liberado (com percentual sobre o repasse) e saldo a liberar.
- **Datas e prazos:** assinatura, fim da vigência (com dias restantes ou dias de atraso), limite para prestação de contas e número de aditivos.
- **Execução financeira:** os desembolsos, com data e valor (até 8 mais recentes).
- **Empenhos:** até 6 empenhos, com número, data, situação e valor.
- **Aditivos e prorrogações:** tipo, data de assinatura, nova vigência e valor, quando houver.
- **Emendas parlamentares vinculadas:** número, parlamentar autor e valor, quando houver.
- **O que observar:** os pontos de atenção pelas regras atuais (veja a seção 3.4).

**O que observar (leitura prática):**

1. Vigência acabando: avalie se o objeto vai terminar a tempo; se não, peça prorrogação ou aditivo ao concedente antes do vencimento.
2. Convênio assinado há muito tempo e sem nenhum desembolso: pergunte à secretaria responsável sobre a pendência (cláusula suspensiva, projeto básico, licença, licitação ou documentação).
3. Pouco liberado com vigência próxima: o saldo pode não ser executado a tempo.
4. Confira sempre a situação no portal oficial: Acesso livre > Consultar Pré-Instrumentos/Instrumentos, pesquisando o número do convênio.

### 3.4 Alertas

Lista os avisos gerados automaticamente pelas regras do bloco. Ordenados por gravidade (Alta, Média, Baixa). Cada alerta tem:

- **Código** (ALE-001, ALE-002 …): numeração da lista atual. **Atenção:** o número muda quando a lista muda; use o nome do alerta e a referência para localizar um caso.
- **Alerta:** o que aconteceu.
- **Referência:** convênio, item do CAUC, programa, publicação ou fonte.
- **Gravidade:** veja a tabela abaixo.
- **Ação recomendada:** o que fazer.
- **Responsável:** sugestão de quem deve agir (Captação, Fazenda / Controladoria, secretaria do objeto, TI). É uma sugestão, não uma atribuição formal.
- **Situação:** hoje, todos aparecem como **Aberto**. Os estados "em andamento" e "resolvido", com histórico, ainda não existem.

**Os tipos de alerta em uso e suas regras (valores provisórios, exceto o de 180 dias):**

| Tipo | Quando aparece | Gravidade | O que fazer |
|---|---|---|---|
| Vigência | Convênio em execução com vigência terminando em **90, 60, 30 ou 15 dias** | Alta se faltarem 30 dias ou menos; Média nos demais | Avaliar e pedir prorrogação ou aditivo |
| Sem desembolso | Convênio **assinado há mais de 180 dias** e sem nenhum desembolso | Alta | Verificar cláusula suspensiva ou documentação; cobrar a secretaria |
| CAUC (pendência) | Item do CAUC com situação **pendente** ou **vencido** | Alta | Regularizar o item específico, com o órgão responsável |
| CAUC (vencimento) | Item regular cuja validade acaba em **30 dias ou menos** | Alta se faltarem 7 dias ou menos; Média nos demais | Renovar a comprovação antes do vencimento |
| Prazo de programa | Programa acompanhado com prazo em **15 dias ou menos** | Alta se faltarem 3 dias ou menos; Média nos demais | Concluir e enviar a proposta, ou verificar se há emenda indicada |
| DOU | Publicação no Diário Oficial que cita o município ou os CNPJs monitorados | Média se citar CNPJ; Baixa nos demais | Ler o trecho e encaminhar ao setor responsável |
| Fonte defasada | Coleta de Transferegov, CAUC, SICONFI ou FNS com **mais de 3 dias** (ou sem carga) | Média | Informar a TI; os números podem estar antigos |

**O que fazer em cada tipo (resumo):**

- **Vigência:** confirme no portal o status e a data; se o objeto não termina a tempo, solicite aditivo antes do vencimento.
- **Sem desembolso:** pergunte à secretaria do objeto o andamento; confira empenhos e aditivos no "Ver detalhes" da guia Acompanhamento.
- **CAUC:** identifique o item (o texto do alerta diz qual) e o órgão que informa; regularize e acompanhe a próxima atualização.
- **Prazo de programa:** se é proposta, defina em poucos dias se o município vai concorrer; se é emenda, confirme com o gabinete se há emenda indicada.
- **DOU:** leia o trecho e a página certificada; se o CNPJ ou o nome não for da Prefeitura, registre que é falso alerta.
- **Fonte defasada:** não tome decisão só com base nos números dessa fonte até a atualização.

**Regras do plano que ainda não aparecem na tela:** prazo de prestação de contas, nova oportunidade compatível e novo desembolso. Estão previstos, mas não são gerados ainda.

### 3.5 Projetos

**Ainda com dados de exemplo.** Esta guia mostra a forma como os projetos serão acompanhados, com registros fictícios. **Não use** os números desta guia para decisão. Os dados reais de projetos entram em fase futura.

---

## 4. De onde vêm os dados

| Fonte | O que traz | Frequência | Limitações |
|---|---|---|---|
| **Transferegov (arquivos abertos)** | Convênios: situação, valores, datas, desembolsos, empenhos, aditivos e emendas | Diária (rotina automática às 09:30, horário de Brasília) | Retrato do que foi lançado no sistema pelos órgãos e prefeituras; o arquivo completo não é guardado no repositório (usa-se um resumo). |
| **Transferegov (programas)** | Programas com prazo aberto, texto oficial (objetivo, critérios, observações), propostas registradas | Diária | Não traz valor mínimo/máximo nem percentual de contrapartida. Edital e anexos só por link. |
| **CAUC (Tesouro Nacional)** | Situação de cada item de regularidade do município e validade | Diária, segundo o próprio arquivo do Tesouro | A situação é a do dia da pesquisa. Itens "indisponível" ou "sem informação" não permitem conclusão. |
| **SICONFI (Tesouro Nacional)** | RREO (execução da receita) e RGF (despesa com pessoal e RCL) | Conforme a entrega do município: RREO a cada bimestre, RGF a cada quadrimestre ou semestre | Dados declarados pelo próprio município; podem ser retificados. |
| **FNS (Fundo Nacional de Saúde)** | Repasses fundo a fundo da saúde ao município, por bloco e grupo | Diária (rotina automática) | Interface sem documentação oficial; pode mudar sem aviso. Valores brutos até a data da coleta. |
| **IBGE** | População estimada (para cálculo por habitante) e cadastro de municípios | População: anual. Cadastro: raramente | Servidores automáticos podem não alcançar o IBGE; isso não bloqueia a rotina. |
| **INEP (Censo Escolar e IDEB)** | Escolas, matrículas, docentes e IDEB da rede municipal | Anual | Não traz IDEB do ensino médio nem a população em idade escolar. |
| **Diário Oficial da União (base de dados abertos)** | Publicações da Seção 1 que citam o município ou CNPJs | Mensal (em outubro de 2026 foi diária, por exceção) | Busca por nome e CNPJ pode trazer falsos positivos ou deixar de achar casos. CPFs de terceiros são mascarados. |
| **Lista de CNPJs da Prefeitura e dos fundos** | CNPJs usados na busca do DOU | Não periódica | **Candidata, pendente de validação humana.** Pode estar incompleta. |

**Não estão no bloco ainda:** MDS / FNAS (assistência social; fonte não acessível por robô), SINISA (saneamento; fonte parcial), Câmara dos Deputados (fonte instável no teste) e editais em PDF.

### 4.1 Como interpretar a data de referência

O bloco mostra **duas datas diferentes**. Não as confunda:

- **Data de coleta:** o dia em que o bloco baixou os dados da fonte. É a data de "quando o bloco pegou esse número".
- **Data de referência:** a data a que o dado se refere, definida pela própria fonte. Exemplos:
  - CAUC: a data da pesquisa do Tesouro;
  - SICONFI: o período do relatório (por exemplo, o bimestre);
  - DOU: o mês da publicação;
  - INEP: o ano do Censo;
  - Alertas: a data em que o site foi publicado, porque são calculados na publicação.

Quando a data de coleta é antiga, o número pode não refletir o que está hoje no portal oficial. Veja a seção 5.

---

## 5. Atualização diária e o que fazer se um dado estiver defasado

**Como funciona:** todo dia, por volta das **09:30 (horário de Brasília)**, uma rotina automática (chamada "Atualizar dados do bloco Captação") busca as fontes, recalcula os alertas e publica o resultado. Se alguma fonte falhar, os dados anteriores continuam valendo e aparece um alerta de **Fonte defasada**.

**Se um dado parecer defasado (passo a passo para o usuário):**

1. Olhe a **Data de coleta** da tabela (coluna "Data de referência" ou detalhe da fonte).
2. Se estiver com mais de 3 dias, procure na guia **Alertas** um alerta do tipo **Fonte defasada**.
3. Se o alerta existir, avise a equipe de TI com o nome da fonte e a data de coleta mostrada.
4. Não use o número como base de decisão até a TI confirmar a atualização.

**Para a equipe de TI (verificação):**

1. Abra o repositório do projeto no GitHub.
2. Clique na aba **Actions**.
3. Clique em **Atualizar dados do bloco Captação**.
4. Veja a última execução: se estiver com um "X" vermelho, clique nela e leia o passo que falhou.
5. Se a fonte oficial estiver fora do ar, aguarde a próxima execução; a rotina tenta de novo no dia seguinte.

---

## 6. Glossário

- **Acompanhamento:** guia que lista os convênios em execução.
- **Aditivo:** alteração formal de um convênio, como prorrogação de vigência ou mudança de valor.
- **Alerta:** aviso automático gerado por uma regra, com ação recomendada.
- **CAUC (Cadastro Único de Exigências para Transferências Voluntárias):** cadastro do Tesouro Nacional que mostra se o município cumpre os requisitos fiscais para receber transferências voluntárias da União. Tem itens (cada um com validade) e situação geral.
- **Cláusula suspensiva:** condição que precisa ser cumprida antes de o recurso ser liberado (por exemplo, projeto básico ou licença).
- **Contrapartida:** valor que a Prefeitura entra com a sua parte no projeto, além do repasse federal.
- **Contrato de repasse:** modalidade em que o recurso federal passa por uma instituição financeira oficial (a mandatária, em geral a Caixa), que analisa, libera por etapas e fiscaliza.
- **Concedente:** órgão federal que oferece e repassa o recurso.
- **Convênio:** acordo em que um órgão federal repassa recurso ao município, que executa o objeto e presta contas.
- **Convenente:** quem recebe o recurso e executa (no caso, a Prefeitura ou seus fundos).
- **Desembolso:** liberação efetiva do dinheiro pela União.
- **Dias sem desembolso:** no alerta, contados desde a data de assinatura, enquanto não há nenhum desembolso.
- **DOU (Diário Oficial da União):** publicação oficial do governo federal.
- **Emenda parlamentar:** recurso que um deputado ou senador indica para um município, em um programa federal. Propostas ligadas a emendas têm prazo próprio.
- **Empenho:** reserva do dinheiro no orçamento para uma despesa específica.
- **Fundo a fundo:** repasse direto do fundo federal (por exemplo, Fundo Nacional de Saúde) ao fundo municipal, sem passar pelo estado.
- **IDEB (Índice de Desenvolvimento da Educação Básica):** indicador de qualidade da educação, calculado pelo INEP.
- **Mandatária:** instituição financeira que administra contratos de repasse em nome da União.
- **Pactuado:** valor combinado no convênio, antes de qualquer liberação.
- **Plano de trabalho:** documento com metas, etapas, cronograma e custos de um projeto proposto.
- **Prestação de contas:** comprovação de como o recurso foi usado, enviada ao órgão federal dentro do prazo.
- **Proponente:** quem apresenta a proposta (a Prefeitura ou seus fundos).
- **Proposta:** pedido formal de recurso, enviado em um programa aberto.
- **RCL (Receita Corrente Líquida):** base de cálculo dos limites da Lei de Responsabilidade Fiscal, como a despesa com pessoal.
- **RGF (Relatório de Gestão Fiscal) e RREO (Relatório Resumido da Execução Orçamentária):** relatórios fiscais que os municípios entregam ao Tesouro, pelo SICONFI.
- **SICONFI:** sistema do Tesouro Nacional que recebe os relatórios fiscais dos entes.
- **Transferegov:** portal do governo federal onde se fazem propostas, convênios e acompanhamento das transferências voluntárias.
- **Transferência voluntária:** recurso repassado por acordo, sem obrigação legal ou constitucional (são as que passam por CAUC).
- **Valor global:** valor total do projeto, somando repasse e contrapartida.
- **Vigência:** período em que o convênio pode ser executado. Depois do fim, é preciso prorrogar ou prestar contas.

---

## 7. Perguntas frequentes e limites conhecidos

**Perguntas frequentes**

- **"O saldo a liberar é o dinheiro que a Prefeitura vai receber amanhã?"** Não necessariamente. É o valor pactuado ainda não liberado. A liberação depende de etapas e de cumprimento das exigências do convênio.
- **"Por que um convênio não aparece na lista?"** Só aparecem convênios com situação "Em execução" no Transferegov. Concluídos, em prestação de contas ou anulados não entram.
- **"O alerta sumiu. Foi resolvido?"** Não há histórico ainda. Um alerta some quando a regra deixa de ser verdadeira na atualização seguinte. Confira no portal.
- **"O número do alerta mudou."** Os códigos ALE-001 etc. são numerados na lista atual. Use o nome do alerta e a referência.
- **"O valor mínimo e a contrapartida do programa estão corretos?"** Não há essa informação na fonte aberta. Os valores mostrados são observados em propostas já enviadas (referência) ou texto do edital (leia o link).
- **"Posso enviar a proposta pelo bloco?"** Não. O bloco mostra o que existe e indica onde agir. A proposta é feita no Transferegov, com login gov.br de quem responde pela Prefeitura.
- **"Os dados servem para prestação de contas?"** Não. Servem para acompanhamento. Prestação de contas segue o portal oficial e a documentação do convênio.

**Limites conhecidos**

1. **Valor mínimo, máximo e percentual de contrapartida** dos programas **não estão em dados abertos**. Não são inventados. Aparecem apenas os trechos do texto oficial e os valores observados em propostas.
2. **Edital em PDF** não é baixado nem lido pelo bloco. Use o link.
3. **MDS / assistência social** ainda não é coletado (fonte não acessível por robô). Não há indicadores de assistência social.
4. **Leitura de prazos de emenda:** o bloco identifica o prazo como "emendas". Isso indica que a proposta depende de emenda indicada, mas **não sabe** se há emenda indicada para o município. Confirme com o gabinete.
5. **Regras de alerta provisórias:** os limites (90, 60, 30 e 15 dias; 3 e 7 dias; 180 dias sem desembolso; 3 dias de defasagem) ainda serão validados com o dono. A regra de vigência só cobre convênios com vigência futura: um convênio já vencido não gera alerta de vigência, mas aparece na tabela e no detalhe.
6. **Temas, secretarias, responsáveis e roteiros** são de rascunho.
7. **CNPJs da Prefeitura e dos fundos** são candidatos, pendentes de validação. Buscas no DOU podem ter falhas.
8. **Projetos** ainda com dados de exemplo.
9. **Alertas sem histórico e sem estados** (em andamento, resolvido). Não há responsável formal nem prazo de resposta.
10. **Um único login** até a etapa do banco de dados; sem perfis por secretaria.
11. **Dados das fontes podem mudar de endereço ou formato.** Quando isso ocorre, o bloco pode mostrar a última coleta válida e gerar alerta de fonte defasada.
