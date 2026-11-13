# Manual do usuário: bloco Captação (Atlas Conecta)

**Versão provisória, atualizada em 10/11/2026.** Os limites, pesos e textos marcados como *provisório* ainda serão definidos com o dono do produto.

---

## 1. O que é o bloco Captação

O bloco **Captação** reúne, em um só lugar, o que a Prefeitura precisa saber para **buscar, acompanhar e não perder recursos federais**:

- quanto o governo federal já repassou e quanto ainda falta liberar a convênios em andamento;
- que programas federais estão com inscrições abertas para o município;
- o que pode colocar esses recursos em risco (vigência acabando, pendência no CAUC, convênio parado);
- como a Prefeitura se compara com as outras capitais em repasses de saúde;
- o que foi publicado no Diário Oficial da União sobre o município;
- se os dados mostrados estão atualizados e, quando não estão, por quê.

**Para quem serve:** equipe de captação de recursos e gestores da Prefeitura que decidem o que propor, o que cobrar e onde agir.

**O que o bloco não faz (ainda):** não envia propostas, não preenche formulários nos portais federais e não substitui a consulta oficial. Ele **mostra dados públicos** e **indica o que conferir**. Toda decisão deve ser confirmada no portal oficial indicado em cada tela.

**Sobre os dados:** são dados públicos de fontes oficiais. O bloco não mostra dados bancários nem dados pessoais. CPFs de terceiros que aparecem em publicações do Diário Oficial são mascarados. Na rede de saúde, consultórios individuais e estabelecimentos de pessoa física não aparecem na lista nominal.

---

## 2. Como acessar

1. Entre na Plataforma do Atlas Conecta com o seu acesso habitual.
2. No menu, clique em **Plataforma**.
3. Clique em **Captação**.
4. Aparecem sete guias, nesta ordem: **Principal**, **Oportunidades**, **Acompanhamento**, **Alertas**, **Comparativo**, **Qualidade dos dados** e **Projetos**.

**Acesso atual:** há um único acesso para o município. Perfis separados por secretaria entram depois, junto com o banco de dados. Enquanto isso, quem tem acesso vê todas as guias.

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
| Repasses do FNS ao Fundo Municipal | Repasses da saúde do governo federal ao Fundo Municipal de Saúde, no ano, com a posição de Goiânia entre as capitais por habitante. Não inclui o Fundo Estadual. |
| Programas abertos para o município | Programas federais com prazo de proposta aberto para prefeituras de Goiás. Detalhes na guia Oportunidades. |
| Citações no DOU | Publicações da Seção 1 do Diário Oficial da União, no mês coletado, que citam o município ou os CNPJs monitorados. |
| Educação básica | Escolas, matrículas e IDEB da rede, pelo Censo Escolar e pelo IDEB do INEP. Dados agregados, sem nome de escola. Comparação entre anos e série do IDEB. |
| Rede de saúde (CNES) | Estabelecimentos de saúde ativos, leitos (total e de UTI) e quantos são pelo SUS, pelo Cadastro Nacional de Estabelecimentos de Saúde. |
| Saneamento (SINISA) | Água, esgoto, resíduos e drenagem do município, no ano de referência do SINISA (2024). Veja a ressalva abaixo. |
| Alertas abertos | Quantos alertas existem, por gravidade e por tipo. Detalhes na guia Alertas. |

**Rede de saúde (CNES): como ler.**

- O número de estabelecimentos é a **soma das unidades ativas** (desabilitados não entram).
- **Esfera e gestão não indicam quem é dono.** No CNES, a esfera mostra quem gere a unidade: estabelecimentos privados contratados pelo SUS aparecem como "municipais". A propriedade pública se confere pela **natureza jurídica** (administração pública).
- A **lista nominal** traz unidades públicas e hospitais. Consultórios individuais e estabelecimentos de pessoa física aparecem **só nas contagens**, por proteção de dados pessoais (LGPD).
- Equipamentos (tomógrafos, aparelhos de raio X etc.) **ainda não são coletados**.

**Saneamento (SINISA): atenção.** Três indicadores aparecem marcados com **ressalva**, porque parecem inconsistentes com os demais dados. Por enquanto, **não os use como fato** antes de conferir com a prefeitura (Secretaria responsável pelo saneamento):

- disposição final inadequada de resíduos;
- coleta seletiva;
- perdas totais de água.

No detalhe, cada ressalva aparece com a marca "ATENÇÃO, RESSALVA". Quando há ressalva, o indicador de saneamento fica com a situação **Atenção**.

**Como usar o "Ver detalhes":**

1. Na linha do indicador, clique em **Ver detalhes**.
2. Abre um painel com o título do indicador, o **que é** (explicação), a **lista** dos itens que formam o número e a **Fonte**.
3. Exemplo: em **Saldo a liberar**, a seção "De onde vêm os saldos (por convênio)" mostra quanto cada convênio contribui. Assim você sabe onde está o dinheiro a liberar.
4. Em **Já liberado**, a seção "Convênios com liberação" traz as datas e valores dos desembolsos.
5. Em **Assinados sem nenhum desembolso**, a lista mostra há quantos dias cada convênio foi assinado.
6. Em **Repasses do FNS**, a seção de comparação mostra a posição de Goiânia entre as capitais.

**O que observar:** se um número parecer errado, compare com a fonte citada no detalhe e com o portal oficial antes de agir. Se a **Data de coleta** estiver antiga, veja a seção 5 e a guia Qualidade dos dados.

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
- **Valor mínimo e contrapartida:** veja a seção 7 (limites). A fonte aberta **não traz** a regra oficial de valor mínimo/máximo nem o percentual de contrapartida. A tela mostra os trechos do texto oficial que citam esses valores e, quando há propostas de prefeituras já enviadas, **valores observados** (mínimo, mediana e máximo) e a contrapartida mediana. Esses valores são **referência, não regra**.
- **Em linguagem simples:** resumo de uma linha sobre o que a prefeitura precisa fazer. Quando o único prazo é o de emendas, o texto explica que só é possível propor se algum parlamentar tiver indicado emenda para o município.
- **Prazos:** datas de cada tipo de prazo, com a contagem de dias (por exemplo, "faltam 12 dias").
- **Tipo de transferência:** explica convênio e contrato de repasse.
- **Quem pode propor:** tipos de ente que podem apresentar proposta (prefeituras, estados, consórcios, organizações da sociedade civil).
- **Temas e secretarias envolvidas:** secretarias que costumam ser responsáveis. Lista genérica, **provisória**, a ser validada pelo dono.
- **Quem já propôs a este programa:** número de propostas registradas, quantas são de prefeituras, valores pedidos pelas prefeituras (mínimo, mediana e máximo), municípios de Goiás que propuseram e capitais que propuseram. Se nenhuma prefeitura propôs, a tela informa; isso pode indicar programa novo, restrito ou de baixa adesão.
- **Situação do município para receber (CAUC):** se o CAUC do município está regular na data de referência.
- **Como pedir (roteiro geral):** passos genéricos de pedido. Confirme sempre no programa.
- **Documentos geralmente exigidos:** lista genérica (plano de trabalho, projeto básico, certidões, contrapartida). **Confirme no edital ou nas orientações do programa.**
- **Links:**
  (a) documentos citados no texto oficial, como edital e orientações, quando o órgão os indica;
  (b) busca do código no **Transferegov Discricionárias**, para consultar o programa e o edital;
  (c) portal de transferências da União (Acesso livre > Consultar Programas).

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
| Fonte defasada, com falha ou sem carga | Uma das fontes da tabela da seção 4 fora do limite de atualização, com falha na última coleta ou sem nenhuma coleta (um alerta por fonte) | Alta se a fonte estiver **muito defasada** (acima do dobro do limite) ou sem carga; Média nos demais | Ver o motivo e a ação na guia Qualidade dos dados; informar a TI |

**O que fazer em cada tipo (resumo):**

- **Vigência:** confirme no portal o status e a data; se o objeto não termina a tempo, solicite aditivo antes do vencimento.
- **Sem desembolso:** pergunte à secretaria do objeto o andamento; confira empenhos e aditivos no "Ver detalhes" da guia Acompanhamento.
- **CAUC:** identifique o item (o texto do alerta diz qual) e o órgão que informa; regularize e acompanhe a próxima atualização.
- **Prazo de programa:** se é proposta, defina em poucos dias se o município vai concorrer; se é emenda, confirme com o gabinete se há emenda indicada.
- **DOU:** leia o trecho e a página certificada; se o CNPJ ou o nome não for da Prefeitura, registre que é falso alerta.
- **Fonte defasada, com falha ou sem carga:** não tome decisão só com base nos números dessa fonte até a atualização. Veja a seção 5.

**Regras do plano que ainda não aparecem na tela:** prazo de prestação de contas, nova oportunidade compatível e novo desembolso. Estão previstos, mas não são gerados ainda.

### 3.5 Comparativo

**Novidade (provisória).** Compara os **repasses de saúde do governo federal** às **27 capitais**, em valor total e **por habitante**, para mostrar onde Goiânia está e o que outras capitais recebem e Goiânia não.

**Escopo:** a comparação é **só de saúde** (repasses do Fundo Nacional de Saúde, FNS, aos fundos municipais). Não compara educação, assistência social, obras ou outras áreas.

**Colunas da tabela:**

| Coluna | Como ler |
|---|---|
| Posição | Lugar da capital no ranking por valor por habitante (1º é o maior). |
| Capital e UF | Nome da capital. |
| População | Estimativa do IBGE usada no cálculo. |
| Valor repasse FNS | Total repassado no ano de referência (valor bruto até a data da coleta). |
| Valor por habitante | Total dividido pela população. Permite comparar capitais de portes diferentes. |
| Comparação com Goiânia | "Recebe mais" ou "Recebe menos por habitante" em relação a Goiânia; "Município piloto" para Goiânia. |

**Como ler o "Ver detalhes" de uma capital:**

- **O que é:** explicação do repasse e do cálculo por habitante.
- **Posição:** posição no ranking e diferença por habitante para Goiânia.
- **Série dos últimos anos:** o mesmo número nos dois anos anteriores, quando a fonte tem dados.
- **Maiores grupos de repasse:** os 10 grupos (bloco e grupo) que mais somam na capital.

**O que aparece só no detalhe de Goiânia:**

1. **Grupos que outras capitais recebem e Goiânia não:** grupos de repasse recebidos por pelo menos 3 capitais e que Goiânia não recebe no ano. Mostra quantas capitais recebem e a mediana por habitante.
2. **Grupos em que Goiânia recebe bem menos por habitante:** grupos em que Goiânia recebe, mas abaixo de **70% da mediana** das capitais que recebem. O exemplo típico é a **atenção primária**.

**Como usar:** os grupos da lista 1 podem indicar programas de saúde que Goiânia ainda não acessou ou que não se aplicam ao município. Os da lista 2 mostram onde o repasse por habitante está baixo em relação às outras capitais. **É ponto de partida para a análise da Secretaria de Saúde, não uma conclusão.** Antes de propor algo, confirme se o grupo é de fato elegível e por que o município não recebe.

**Limites:**

- Os valores são **brutos** até a data da coleta e podem mudar.
- A **população** é a estimativa do IBGE, não o censo.
- Diferenças por habitante podem ter causas que a fonte não mostra (habilitação, pactuação, programas específicos). Não são prova de falha da gestão.
- As faixas de 3 capitais e de 70% da mediana são **provisórias**.

### 3.6 Qualidade dos dados

**Novidade (provisória).** Mostra **quão atualizado está cada dado** do bloco, em que situação está cada fonte e o **motivo** quando algo está fora do prazo. Regra do dono: **sempre sinalizar dado defasado, entender o motivo e corrigir.**

**Situação de cada fonte:**

| Situação | O que significa |
|---|---|
| **Em dia** | A coleta é recente, dentro do limite da fonte. Nada a fazer. |
| **Atenção: defasada** | A coleta passou do limite da fonte, mas não está muito atrasada. Os números podem não refletir o portal de hoje. |
| **Vencido: muito defasada** | A coleta passou do **dobro do limite** da fonte. Não use o número para decisão antes da atualização. |
| **Atenção: falha na coleta** | A última tentativa de coleta automática falhou. Os dados são os da coleta anterior, ainda válidos, mas podem estar antigos. |
| **Sem carga** | Nenhuma coleta desta fonte foi feita ainda. |

A ordem de verificação é: sem carga; muito defasada; falha na coleta; defasada; em dia.

**Limites por fonte (provisórios):**

| Fonte | Limite (dias da coleta) | Muito defasada acima de | Frequência da fonte |
|---|---|---|---|
| Transferegov (convênios) | 3 | 6 dias | Diária |
| Programas abertos (Transferegov) | 3 | 6 dias | Diária |
| CAUC (regularidade) | 3 | 6 dias | Diária (dias úteis) |
| FNS (repasses da saúde) | 3 | 6 dias | Diária |
| SICONFI (finanças) | 45 | 90 dias | Bimestral/quadrimestral (a coleta é diária) |
| IBGE (municípios e população) | 45 | 90 dias | Mensal |
| CNES (estabelecimentos de saúde) | 45 | 90 dias | Mensal |
| DOU (Diário Oficial da União) | 45 | 90 dias | Mensal (arquivo carregado manualmente) |
| INEP (educação) | 400 | 800 dias | Anual |
| SINISA (saneamento) | 400 | 800 dias | Anual |

A guia mostra também a **data de referência** de cada fonte (o período a que o dado se refere) e a **última tentativa** de coleta, com o erro registrado quando houve falha.

**Motivos possíveis e o que fazer:**

| Motivo | O que fazer |
|---|---|
| **Ainda não houve nenhuma coleta** da fonte. | Executar o coletor correspondente (TI). |
| **A última coleta automática falhou**, após algumas tentativas. O erro aparece no detalhe. | Verificar se a fonte oficial está no ar ou se mudou de formato (ficha técnica da fonte, no link do detalhe). Se o formato mudou, corrigir o coletor (TI). |
| **Carga manual pendente** (DOU, e a carga anual de INEP e SINISA quando não há nova versão). | Baixar o arquivo mais recente e atualizar a carga (TI). |
| **A coleta não registrou execução recente.** A rotina diária pode não ter rodado ou não ter sido publicada. | Conferir a rotina "Atualizar dados do bloco Captação" (TI). |
| **A coleta rodou com sucesso, mas o site ainda mostra dados antigos.** Os dados novos ainda não foram publicados. | A TI conclui a publicação dos dados novos. |

**O que fazer como usuário:**

1. Abra a guia **Qualidade dos dados**.
2. Veja as linhas que **não** estão "Em dia".
3. Leia o **Motivo** e a **Ação** no detalhe da fonte.
4. Se a ação for da TI, informe o nome da fonte e a data de coleta mostrada.
5. Até a correção, não decida só com base nos números dessa fonte.

**Limites:**

- Os limites são **provisórios** e serão validados com o dono do produto.
- Uma fonte com **falha** mantém os dados da última coleta válida. O aviso não significa que os números estão errados, e sim que podem estar antigos.

### 3.7 Projetos

**Ainda com dados de exemplo.** Esta guia mostra a forma como os projetos serão acompanhados, com registros fictícios. **Não use** os números desta guia para decisão. Os dados reais de projetos entram em fase futura.

**Parecer automático (exemplos fictícios).** Cada projeto pode ter um **parecer** que confere, em **21 regras determinísticas** (R01 a R21), se a proposta está pronta para envio. Os exemplos desta guia são **fictícios**.

- **Sem IA nesta etapa.** O parecer é calculado por regras fixas e verificáveis. Não há texto gerado por inteligência artificial.
- **Nada é gravado.** O parecer é apenas uma leitura do projeto. Projetos reais **não são gravados** até novo direcionamento do dono.
- **Gravidades:**
  - **Bloqueante:** impede o "pronto para envio".
  - **Alerta:** exige ciência registrada, mas permite seguir.
  - **Informativo:** apenas registra.
- **Dado ausente nunca conta como atendido.** Se a informação não foi preenchida, a regra aparece como não verificável, e não como cumprida.
- **Pronto para envio** só aparece com **parecer completo e aprovação**. A mesma pessoa elabora e aprova, sem separação de responsabilidades por enquanto.
- **Requisitos do programa** (valor mínimo, contrapartida, documentos exigidos) são **confirmados pela equipe da Prefeitura**, a partir do edital. O bloco não os inventa.

**Como ler o parecer:** o percentual é o total de verificações aplicáveis que foram atendidas. Cada item mostra a regra, o resultado (atendido, falha ou não verificável) e um link para o ponto do projeto que precisa de ajuste.

---

### 3.8 Agenda de prazos (arquivo para o calendário)

Reúne os **prazos do bloco** em um arquivo de agenda que pode ser importado no Google Agenda ou no Outlook. O arquivo fica em **/plataforma/agenda.ics**, e só abre para quem está dentro da Plataforma.

**O que entra na agenda:**

- **Fim de vigência** dos convênios em execução;
- **Limite da prestação de contas** dos convênios;
- **Vencimento da comprovação** de itens do CAUC que estão regulares;
- **Prazos dos programas** abertos (propostas, emendas ou beneficiário específico).

Só entram datas que ainda não passaram. Cada evento é de **dia inteiro** e tem **dois lembretes: 30 dias e 7 dias antes**.

**Como baixar o arquivo:**

1. Entre na Plataforma e abra a guia **Captação**.
2. Na barra de endereço do navegador, digite o endereço da agenda: `.../plataforma/agenda.ics` (no endereço completo do site).
3. O navegador baixa o arquivo `agenda.ics`. Guarde-o no computador.

**Resultado esperado:** um arquivo `agenda.ics` na pasta de downloads.

**Como importar no Google Agenda (computador):**

1. Abra o Google Agenda no navegador.
2. Clique na **engrenagem** (Configurações), no canto superior direito.
3. Clique em **Configurações**.
4. No menu da esquerda, clique em **Importar e exportar**.
5. Em **Importar**, clique em **Selecionar arquivo** e escolha o `agenda.ics`.
6. Em **Adicionar ao calendário**, escolha o calendário onde os prazos devem ficar (por exemplo, o da equipe de captação).
7. Clique em **Importar**.

**Resultado esperado:** aparece uma mensagem informando quantos eventos foram importados, e os prazos aparecem no calendário escolhido.

**Como importar no Outlook (navegador, Outlook.com ou Microsoft 365):**

1. Abra o Outlook e clique na **engrenagem** (Configurações), no canto superior direito.
2. Clique em **Calendário** e depois em **Importar calendário**.
3. Clique em **Procurar arquivo** e escolha o `agenda.ics`.
4. Escolha o calendário de destino e clique em **Importar**.

**Resultado esperado:** os prazos aparecem no calendário escolhido.

**Como importar no Outlook (programa instalado no computador):**

1. Clique em **Arquivo** > **Abrir e Exportar** > **Importar/Exportar**.
2. Escolha **Importar um arquivo iCalendar (.ics) ou vCalendar**.
3. Selecione o `agenda.ics` e clique em **Abrir**.

**Resultado esperado:** os eventos entram no calendário padrão do Outlook.

**Atenção:**

- **A importação é feita pelo arquivo baixado**, não por endereço de assinatura. Os programas de agenda não conseguem abrir o endereço protegido da Plataforma.
- Quando você importa um **arquivo novo**, confira se não surgiram eventos repetidos. O comportamento de cada programa de agenda é diferente.
- A agenda reflete os dados da **última atualização**. Se a guia Qualidade dos dados mostrar uma fonte defasada, os prazos dela podem estar desatualizados.
- Os lembretes de 30 e 7 dias são **provisórios**.

---

## 4. De onde vêm os dados

| Fonte | O que traz | Frequência | Limitações |
|---|---|---|---|
| **Transferegov (arquivos abertos)** | Convênios: situação, valores, datas, desembolsos, empenhos, aditivos e emendas | Diária (rotina automática às 09:30, horário de Brasília) | Retrato do que foi lançado no sistema pelos órgãos e prefeituras; o arquivo completo não é guardado no repositório (usa-se um resumo). |
| **Transferegov (programas)** | Programas com prazo aberto, texto oficial (objetivo, critérios, observações), propostas registradas | Diária | Não traz valor mínimo/máximo nem percentual de contrapartida. Edital e anexos só por link. |
| **CAUC (Tesouro Nacional)** | Situação de cada item de regularidade do município e validade | Diária, segundo o próprio arquivo do Tesouro | A situação é a do dia da pesquisa. Itens "indisponível" ou "sem informação" não permitem conclusão. |
| **SICONFI (Tesouro Nacional)** | RREO (execução da receita) e RGF (despesa com pessoal e RCL) | Conforme a entrega do município: RREO a cada bimestre, RGF a cada quadrimestre ou semestre | Dados declarados pelo próprio município; podem ser retificados. |
| **FNS (Fundo Nacional de Saúde)** | Repasses fundo a fundo da saúde ao município, por bloco e grupo; comparação com as capitais (guia Comparativo) | Diária (rotina automática) | Interface sem documentação oficial; pode mudar sem aviso. Valores brutos até a data da coleta. Só saúde. |
| **IBGE** | População estimada (para cálculo por habitante) e cadastro de municípios | População: anual. Cadastro: raramente | Servidores automáticos podem não alcançar o IBGE; isso não bloqueia a rotina. |
| **INEP (Censo Escolar e IDEB)** | Escolas, matrículas, docentes e IDEB da rede municipal | Anual (a rotina mensal verifica novas versões) | Não traz IDEB do ensino médio nem a população em idade escolar. Dados agregados. |
| **CNES (DATASUS)** | Estabelecimentos de saúde, leitos e leitos de UTI, por natureza jurídica e tipo de unidade | Mensal (a rotina mensal consulta a fonte) | Esfera e gestão não indicam propriedade. Consultórios individuais e pessoa física só nas contagens. Equipamentos ainda não coletados. |
| **SINISA (Ministério das Cidades)** | Indicadores de água, esgoto, resíduos e drenagem (ano de referência 2024) | Anual (a rotina mensal consulta a fonte) | Três indicadores com ressalva de inconsistência (disposição final inadequada, coleta seletiva e perdas totais). Não usar como fato sem conferir com a prefeitura. |
| **Diário Oficial da União (base de dados abertos)** | Publicações da Seção 1 que citam o município ou CNPJs | Mensal (em outubro de 2026 foi diária, por exceção) | Busca por nome e CNPJ pode trazer falsos positivos ou deixar de achar casos. CPFs de terceiros são mascarados. |
| **Lista de CNPJs da Prefeitura e dos fundos** | CNPJs usados na busca do DOU | Não periódica | **Candidata, pendente de validação humana.** Pode estar incompleta. |
| **Registro de coletas (guia Qualidade dos dados)** | Para cada fonte: data da última coleta, resultado e erro, se houve | A cada execução da rotina | Não é uma fonte de dados: serve para mostrar se a informação das outras fontes está em dia. |

**Não estão no bloco ainda:** MDS / FNAS (assistência social; fonte não acessível por robô), Câmara dos Deputados (fonte instável no teste), editais em PDF e os equipamentos da rede de saúde.

### 4.1 Como interpretar a data de referência

O bloco mostra **duas datas diferentes**. Não as confunda:

- **Data de coleta:** o dia em que o bloco baixou os dados da fonte. É a data de "quando o bloco pegou esse número".
- **Data de referência:** a data a que o dado se refere, definida pela própria fonte. Exemplos:
  - CAUC: a data da pesquisa do Tesouro;
  - SICONFI: o período do relatório (por exemplo, o bimestre);
  - DOU: o mês da publicação;
  - INEP: o ano do Censo;
  - CNES: a competência (mês) dos leitos;
  - SINISA: o ano de referência;
  - FNS: o exercício (ano) do repasse;
  - Alertas: a data em que o site foi publicado, porque são calculados na publicação.

Quando a data de coleta é antiga, o número pode não refletir o que está hoje no portal oficial. Veja a seção 5 e a guia Qualidade dos dados.

---

## 5. Atualização e o que fazer se um dado estiver defasado

**Como funciona:**

- **Todo dia**, por volta das **09:30 (horário de Brasília)**, a rotina automática "Atualizar dados do bloco Captação" busca as fontes diárias (Transferegov, programas, CAUC, FNS, SICONFI e IBGE), recalcula os alertas e publica o resultado. As execuções agendadas podem atrasar alguns minutos.
- **Todo mês**, no **dia 5, às 08:00 (horário de Brasília)**, uma rotina **separada** consulta as fontes mensais e anuais: **INEP** (Censo Escolar e IDEB), **SINISA** (saneamento) e **CNES** (estabelecimentos de saúde). Essas fontes mudam pouco ao longo do ano: o número só muda quando sai nova versão oficial.
- A **base mensal do DOU** não é baixada pela rotina diária; a carga é feita a partir do arquivo mais recente da base de dados abertos.
- Se alguma fonte falhar, os dados anteriores continuam valendo e aparece um alerta de **Fonte defasada, com falha ou sem carga**, com o motivo e a ação.

**Se um dado parecer defasado (passo a passo para o usuário):**

1. Olhe a **Data de coleta** da tabela (coluna "Data de referência" ou detalhe da fonte).
2. Abra a guia **Qualidade dos dados** e veja a situação da fonte.
3. Se estiver como **Atenção** ou **Vencido**, leia o **Motivo** e a **Ação** no detalhe.
4. Se houver um alerta **Fonte defasada** na guia **Alertas**, avise a equipe de TI com o nome da fonte e a data de coleta mostrada.
5. Não use o número como base de decisão até a TI confirmar a atualização.

**Para a equipe de TI (verificação):**

1. Abra o repositório do projeto no GitHub.
2. Clique na aba **Actions**.
3. Clique em **Atualizar dados do bloco Captação** (rotina diária) ou em **Atualizar dados mensais do bloco Captação** (rotina mensal).
4. Veja a última execução: se estiver com um "X" vermelho, clique nela e leia o passo que falhou.
5. Se a fonte oficial estiver fora do ar, aguarde a próxima execução; a rotina tenta de novo no dia seguinte (ou no próximo mês, na rotina mensal).
6. Se a execução deu certo mas o site continua antigo, conclua a publicação dos dados novos. Os registros de cada coleta ficam na guia Qualidade dos dados.

---

## 6. Glossário

- **Acompanhamento:** guia que lista os convênios em execução.
- **Aditivo:** alteração formal de um convênio, como prorrogação de vigência ou mudança de valor.
- **Alerta:** aviso automático gerado por uma regra, com ação recomendada.
- **CAUC (Cadastro Único de Exigências para Transferências Voluntárias):** cadastro do Tesouro Nacional que mostra se o município cumpre os requisitos fiscais para receber transferências voluntárias da União. Tem itens (cada um com validade) e situação geral.
- **Cláusula suspensiva:** condição que precisa ser cumprida antes de o recurso ser liberado (por exemplo, projeto básico ou licença).
- **CNES (Cadastro Nacional de Estabelecimentos de Saúde):** cadastro do Ministério da Saúde com as unidades de saúde do país, seus leitos e serviços. Usado no DATASUS.
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
- **FNS (Fundo Nacional de Saúde):** fundo do Ministério da Saúde que repassa recursos da saúde aos fundos municipais e estaduais.
- **Fundo a fundo:** repasse direto do fundo federal (por exemplo, Fundo Nacional de Saúde) ao fundo municipal, sem passar pelo estado.
- **IDEB (Índice de Desenvolvimento da Educação Básica):** indicador de qualidade da educação, calculado pelo INEP.
- **INEP (Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira):** órgão do Ministério da Educação que faz o Censo Escolar e calcula o IDEB.
- **Limite por habitante:** valor repassado dividido pela população estimada do IBGE, para comparar municípios de portes diferentes.
- **Mandatária:** instituição financeira que administra contratos de repasse em nome da União.
- **Pactuado:** valor combinado no convênio, antes de qualquer liberação.
- **Plano de trabalho:** documento com metas, etapas, cronograma e custos de um projeto proposto.
- **Prestação de contas:** comprovação de como o recurso foi usado, enviada ao órgão federal dentro do prazo.
- **Proponente:** quem apresenta a proposta (a Prefeitura ou seus fundos).
- **Proposta:** pedido formal de recurso, enviado em um programa aberto.
- **RCL (Receita Corrente Líquida):** base de cálculo dos limites da Lei de Responsabilidade Fiscal, como a despesa com pessoal.
- **RGF (Relatório de Gestão Fiscal) e RREO (Relatório Resumido da Execução Orçamentária):** relatórios fiscais que os municípios entregam ao Tesouro, pelo SICONFI.
- **SICONFI:** sistema do Tesouro Nacional que recebe os relatórios fiscais dos entes.
- **SINISA (Sistema Nacional de Informações em Saneamento):** sistema do Ministério das Cidades com indicadores de água, esgoto, resíduos e drenagem. Sucede o SNIS.
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
- **"Posso enviar a proposta pelo bloco?"** Não. O bloco mostra o que existe e indica onde agir. A proposta é feita no Transferegov, com a conta gov.br de quem responde pela Prefeitura.
- **"Os dados servem para prestação de contas?"** Não. Servem para acompanhamento. Prestação de contas segue o portal oficial e a documentação do convênio.
- **"Por que Goiânia aparece 'recebendo menos' que outra capital?"** A comparação é só de repasses de saúde por habitante. Não mostra a causa. Antes de concluir, confira na Secretaria de Saúde se o município tem o mesmo direito ao programa.
- **"Um dado está antigo. O que faço?"** Abra a guia Qualidade dos dados, leia o motivo e a ação (seção 5) e informe a TI.
- **"Por que o arquivo da agenda não atualiza sozinho no calendário?"** A importação é feita por arquivo. Baixe o `agenda.ics` de novo e importe; confira duplicados (seção 3.8).

**Limites conhecidos**

1. **Valor mínimo, máximo e percentual de contrapartida** dos programas **não estão em dados abertos**. Não são inventados. Aparecem apenas os trechos do texto oficial e os valores observados em propostas.
2. **Edital em PDF** não é baixado nem lido pelo bloco. Use o link.
3. **MDS / assistência social** ainda não é coletado (fonte não acessível por robô). Não há indicadores de assistência social.
4. **Leitura de prazos de emenda:** o bloco identifica o prazo como "emendas". Isso indica que a proposta depende de emenda indicada, mas **não sabe** se há emenda indicada para o município. Confirme com o gabinete.
5. **Regras de alerta provisórias:** os limites (90, 60, 30 e 15 dias; 3 e 7 dias; 180 dias sem desembolso; limites de defasagem por fonte da seção 3.6) ainda serão validados com o dono. A regra de vigência só cobre convênios com vigência futura: um convênio já vencido não gera alerta de vigência, mas aparece na tabela e no detalhe.
6. **Temas, secretarias, responsáveis e roteiros** são de rascunho.
7. **CNPJs da Prefeitura e dos fundos** são candidatos, pendentes de validação. Buscas no DOU podem ter falhas.
8. **Projetos** ainda com dados de exemplo. O parecer automático mostra exemplos fictícios; nada é gravado e não há IA nesta etapa.
9. **Alertas sem histórico e sem estados** (em andamento, resolvido). Não há responsável formal nem prazo de resposta.
10. **Um único acesso** até a etapa do banco de dados; sem perfis por secretaria.
11. **Dados das fontes podem mudar de endereço ou formato.** Quando isso ocorre, o bloco pode mostrar a última coleta válida e gerar alerta de fonte defasada.
12. **Comparativo** cobre só repasses de saúde (FNS) e usa população estimada do IBGE. Faixas de comparação são provisórias.
13. **Saúde (CNES):** equipamentos ainda não são coletados; a lista nominal omite consultórios individuais e pessoa física.
14. **Saneamento (SINISA):** três indicadores com ressalva de inconsistência não devem ser usados como fato sem conferência com a prefeitura.
15. **Educação (INEP):** sem IDEB do ensino médio e sem população em idade escolar.
16. **Agenda:** a importação é por arquivo baixado; os lembretes de 30 e 7 dias são provisórios.
17. **Qualidade dos dados:** os limites de defasagem por fonte são provisórios.
