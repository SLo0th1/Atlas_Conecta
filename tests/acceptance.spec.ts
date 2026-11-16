import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import modules from '../src/data/modules.json' with {type:'json'};
import cronogramasExemplo from '../data/exemplo/cronogramas/cronogramas.json' with {type:'json'};
const publicPages=['/','/compradores/','/setor-publico/','/fornecedores/','/insights/','/tipo/artigo/','/tipo/estudo-de-caso/','/tipo/guia/','/tipo/boletim/','/sobre/','/privacidade/','/termos/','/plataforma/','/demonstracao/'];
for(const width of [1280,375]){
 test(`páginas públicas e módulos em ${width}px`,async({page})=>{await page.setViewportSize({width,height:900});for(const path of [...publicPages,...modules.filter(m=>m.slug).map(m=>`/plataforma/${m.slug}/`)]){const response=await page.goto(path);expect(response?.status(),path).toBe(200);await expect(page.locator('h1'),path).toHaveCount(1);await expect(page.locator('h1')).not.toBeEmpty();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBeTruthy();}});
}
test('cabeçalho desktop abre os destinos corretos',async({page})=>{await page.setViewportSize({width:1280,height:900});for(const [name,path] of [['Início','/'],['Insights','/insights/'],['Sobre','/sobre/'],['Acessar plataforma','/plataforma/'],['Solicitar demonstração','/demonstracao/']]){await page.goto('/');await page.getByRole('navigation',{name:'Principal'}).getByRole('link',{name,exact:true}).click();await expect(page).toHaveURL(new RegExp(`${path}$`));}for(const [name,path] of [['Compradores','compradores'],['Setor público','setor-publico'],['Fornecedores','fornecedores']]){await page.goto('/');await page.locator('header summary').click();await page.locator('header').getByRole('link',{name,exact:true}).click();await expect(page).toHaveURL(new RegExp(`/${path}/$`));}});
test('menu móvel, Escape e foco preso',async({page})=>{await page.setViewportSize({width:375,height:812});await page.goto('/');const menu=page.getByRole('button',{name:'Menu',exact:true});await expect(menu).toHaveAttribute('aria-expanded','false');await menu.click();await expect(menu).toHaveAttribute('aria-expanded','true');await expect(page.locator('#navigation').getByRole('link',{name:'Início',exact:true})).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(menu).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.locator('#navigation').getByRole('link',{name:'Solicitar demonstração'})).toBeFocused();await page.keyboard.press('Escape');await expect(menu).toBeFocused();await expect(menu).toHaveAttribute('aria-expanded','false');});
test('Insights busca, tipo, tag, paginação e artigos',async({page})=>{await page.goto('/insights/');await expect(page.locator('[data-entry]:visible')).toHaveCount(6);await page.getByRole('button',{name:'Próxima',exact:true}).click();await expect(page.locator('[data-entry]:visible')).toHaveCount(2);await page.getByLabel('Tipo',{exact:true}).selectOption('guia');await expect(page.locator('[data-entry]:visible')).toHaveCount(2);for(const card of await page.locator('[data-entry]:visible').all())await expect(card).toHaveAttribute('data-type','guia');await page.getByLabel('Buscar conteúdo').fill('pesquisa de preços');await expect(page.locator('[data-entry]:visible')).toHaveCount(1);await page.locator('[data-entry]:visible a').click();await expect(page.locator('h1')).toHaveText('Como organizar uma pesquisa de preços');await expect(page.getByText(/min de leitura/)).toBeVisible();await expect(page.getByRole('heading',{name:'Continue a leitura'})).toBeVisible();await page.goto('/insights/');await page.getByLabel('Tag',{exact:true}).selectOption('saúde');await expect(page.locator('[data-entry]:visible')).toHaveCount(1);});
for(const tipo of ['artigo','estudo-de-caso','guia','boletim'])test(`categoria ${tipo}`,async({page})=>{await page.goto(`/tipo/${tipo}/`);await expect(page.locator('[data-entry]:visible')).toHaveCount(2);for(const card of await page.locator('[data-entry]:visible').all())await expect(card).toHaveAttribute('data-type',tipo);});
test('tabelas buscam, ordenam, filtram e paginam',async({page})=>{await page.goto('/plataforma/');await expect(page.getByText('Processos ativos',{exact:true})).toBeVisible();await page.getByLabel('Buscar painel',{exact:false}).fill('Alimentos');await expect(page.locator('[data-row]:visible')).toHaveCount(1);await page.getByLabel('Buscar painel',{exact:false}).fill('inexistente');await expect(page.getByText('Nenhum registro encontrado.',{exact:false})).toBeVisible();await page.goto('/plataforma/processos/');await page.locator('[data-sort="0"]').click();await expect(page.locator('th[aria-sort="ascending"]')).toHaveCount(1);await page.getByRole('button',{name:'Próxima',exact:true}).click();await expect(page.locator('[data-table-page]')).toHaveText('Página 2 de 2');await page.getByLabel('Filtrar por valor').selectOption({index:1});await expect(page.locator('[data-table-count]')).toContainText('1 registros');await page.getByRole('button',{name:'Novo registro'}).click();await expect(page.locator('#toast')).toHaveText('protótipo: nada é gravado');});
test('marketplace filtra e monta cesta temporária',async({page})=>{await page.goto('/plataforma/marketplace/');await page.getByLabel('Tipo de oferta').selectOption('Produto');await page.getByLabel('UF atendida').selectOption('GO');await page.locator('[data-offer]:visible').first().getByRole('button',{name:'Adicionar à cotação'}).click();await page.getByRole('link',{name:'Minha cotação →'}).click();await expect(page.locator('[data-offer]:visible')).toHaveCount(1);await page.locator('[data-offer]:visible').getByRole('button',{name:'Remover da cotação'}).click();await expect(page.locator('[data-offer]:visible')).toHaveCount(0);});
test('formulário valida e prepara mailto',async({page})=>{await page.goto('/demonstracao/');await page.getByRole('button',{name:'Preparar pedido'}).click();await expect(page.locator('#confirmation')).toBeHidden();expect(await page.locator('input[name=nome]').evaluate((e:HTMLInputElement)=>e.validity.valueMissing)).toBeTruthy();await page.getByLabel('Nome *',{exact:true}).fill('Pessoa Exemplo');await page.getByLabel('E-mail profissional').fill('pessoa@example.org');await page.getByLabel('Organização').fill('Organização Exemplo');await page.getByLabel('Seu perfil').selectOption('Setor público');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Preparar pedido'}).click();await expect(page.locator('#confirmation')).toBeVisible();await expect(page.locator('#email-link')).toHaveAttribute('href',/^mailto:/);});
test('tema persiste e erro 404 permite busca',async({page})=>{await page.goto('/');const before=await page.locator('html').getAttribute('data-theme');await page.getByRole('button',{name:'Alternar tema claro e escuro'}).click();expect(await page.locator('html').getAttribute('data-theme')).not.toBe(before);await page.reload();expect(await page.locator('html').getAttribute('data-theme')).not.toBe(before);const response=await page.goto('/nao-existe/');expect(response?.status()).toBe(404);await page.getByLabel('Buscar nos Insights').fill('primeira proposta');await page.getByRole('button',{name:'Buscar',exact:true}).click();await expect(page.locator('[data-entry]:visible')).toHaveCount(1);});
for(const width of [1280,375])for(const theme of ['light','dark'])test(`axe ${width}px ${theme}`,async({page})=>{await page.setViewportSize({width,height:900});for(const path of ['/','/insights/','/demonstracao/','/plataforma/','/plataforma/marketplace/']){await page.goto(path);await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`${path}: ${JSON.stringify(results.violations)}`).toEqual([]);}});

test('rodada 2: módulos têm conteúdo próprio e abas com contagens',async({page})=>{
 for(const slug of ['processos','cotacoes']){await page.goto(`/plataforma/${slug}/`);await expect(page.getByText('Processos ativos',{exact:true})).toHaveCount(0);await page.locator('[data-tab="Em andamento"]').click();await expect(page.locator('[data-row]:visible').first()).toContainText('Em andamento');await expect(page.locator('[data-row]:visible').first()).toContainText(/PE \d{3}\/2026/);await expect(page.locator('[data-row]:visible').first()).toContainText(/\d{2}\/\d{2}\/2026/);}
 await page.goto('/plataforma/gestao-publica/');for(const title of ['Ciclo previsto de compras','Distribuição por etapa','Saúde da carteira','Conversão do portfólio','Fila de atenção do gestor'])await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();await expect(page.getByText('Processos ativos',{exact:true})).toHaveCount(0);
});
test('rodada 2: documentos filtram e geram rascunho local',async({page})=>{
 await page.goto('/plataforma/documentos/');await page.locator('[data-tab="TR"]').click();for(const row of await page.locator('[data-row]:visible').all())await expect(row).toHaveAttribute('data-bucket','TR');await page.getByRole('button',{name:'Gerar rascunho',exact:true}).click();await page.getByLabel('Objeto',{exact:true}).fill('Material escolar');await page.getByLabel('Secretaria',{exact:true}).selectOption('Educação');await page.getByLabel('Justificativa',{exact:true}).fill('Atender a rede municipal');await page.getByRole('button',{name:'Gerar exemplo local'}).click();await expect(page.locator('#doc-text')).toContainText('Material escolar');await expect(page.locator('#doc-text')).toContainText('Atender a rede municipal');await page.getByRole('button',{name:'Fechar',exact:true}).click();await expect(page.locator('#doc-dialog')).toBeHidden();
});
test('rodada 2: preços calculam resultados e salvam somente no navegador',async({page})=>{
 await page.goto('/plataforma/banco-de-precos/');await expect(page.locator('#price-stats .card')).toHaveCount(4);await page.locator('[data-table-search]').fill('Alimentos');await expect(page.locator('#price-stats')).toContainText('R$');await page.getByRole('button',{name:'Salvar pesquisa',exact:true}).click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('atlas-price-search')!).query)).toBe('Alimentos');await page.locator('[data-table-search]').fill('inexistente');await expect(page.locator('#price-stats')).toContainText('Sem resultados');await page.goto('/plataforma/atas/');await expect(page.locator('.status').getByText(/Vencida/).first()).toBeVisible();await expect(page.locator('.status').getByText(/Vigente/).first()).toBeVisible();
});
test('rodada 2: importação, relatórios e conta',async({page})=>{
 for(const slug of ['produtos','fornecedores','enderecos','locais-de-entrega']){await page.goto(`/plataforma/${slug}/`);await page.getByRole('button',{name:'Importar planilha'}).click();await expect(page.locator('#import-dialog')).toBeVisible();await page.locator('#import-dialog').getByRole('button',{name:'Fechar'}).click();}
 await page.goto('/plataforma/relatorios/');await page.getByRole('button',{name:'Ver prévia'}).first().click();await expect(page.locator('#report-dialog')).toBeVisible();for(const slug of ['perfil','configuracoes']){await page.goto(`/plataforma/${slug}/`);for(const input of await page.locator('fieldset input,fieldset select,fieldset textarea').all())await expect(input).toBeDisabled();}
});
test('rodada 2: marketplace atendimento nacional',async({page})=>{await page.goto('/plataforma/marketplace/');await page.getByLabel('Atendimento nacional',{exact:true}).check();await expect(page.locator('[data-offer]:visible')).toHaveCount(4);for(const card of await page.locator('[data-offer]:visible').all())await expect(card).toHaveAttribute('data-national','true');});
test('rodada 2: barra móvel em uma linha e busca expansível',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/plataforma/');await expect(page.locator('#platform-search')).toBeHidden();await page.getByRole('button',{name:'Expandir busca'}).click();await expect(page.getByLabel('Busca global')).toBeFocused();await page.getByRole('button',{name:'Expandir busca'}).click();const boxes=await Promise.all(['.appbar .brand','#drawer-toggle','#search-toggle','.app-notifications','.app-user'].map(s=>page.locator(s).boundingBox()));expect(Math.max(...boxes.map(b=>b!.y))-Math.min(...boxes.map(b=>b!.y))).toBeLessThan(20);await page.getByRole('button',{name:'Módulos',exact:true}).click();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Módulos',exact:true})).toBeFocused();await page.locator('.app-user summary').click();await expect(page.getByRole('button',{name:'Alternar tema claro e escuro'})).toBeVisible();
});
test('rodada 2: sidebar até o fim e summary sem marcador nativo',async({page})=>{
 await page.setViewportSize({width:1280,height:700});await page.goto('/plataforma/gestao-publica/');const sidebar=await page.locator('.sidebar').boundingBox();const workspace=await page.locator('.workspace').boundingBox();expect(sidebar!.height).toBeCloseTo(700-112,0);expect(sidebar!.y).toBeGreaterThanOrEqual(80);await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));const after=await page.locator('.sidebar').boundingBox();expect(after!.y).toBeGreaterThanOrEqual(80);expect(after!.y+after!.height).toBeLessThanOrEqual(700);expect(workspace!.height).toBeGreaterThan(0);for(const summary of await page.locator('summary').all())expect(await summary.evaluate(e=>getComputedStyle(e).listStyleType)).toBe('none');await page.screenshot({path:test.info().outputPath('rodada2-sidebar-fullpage.png'),fullPage:true});
});

 test('login tem campos acessíveis e passa no axe', async ({page}) => {
  await page.goto('/entrar/?erro=1&next=%2Fplataforma%2Fprocessos%2F');
  await expect(page.getByLabel('E-mail', {exact:true})).toHaveAttribute('autocomplete', 'username');
  await expect(page.getByLabel('Senha', {exact:true})).toHaveAttribute('type', 'password');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('input[name="next"]')).toHaveValue('/plataforma/processos/');
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});


test('rodada 4: menu recolhe, expande e persiste',async({page})=>{
 await page.goto('/plataforma/');const toggle=page.locator('#sidebar-toggle');await expect(toggle).toHaveAttribute('aria-expanded','true');await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(toggle).toHaveAccessibleName('Expandir menu');await expect(page.locator('.sidebar')).toHaveAttribute('data-closed','true');await page.reload();await expect(toggle).toHaveAttribute('aria-expanded','false');await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');await expect(toggle).toHaveAccessibleName('Recolher menu');await page.reload();await expect(toggle).toHaveAttribute('aria-expanded','true');
});
test('rodada 4: paginação informa intervalo e avança',async({page})=>{
 await page.goto('/plataforma/processos/');await expect(page.locator('[data-table-range]')).toHaveText('Mostrando 1–10 de 12');const first=await page.locator('[data-row]:visible').first().textContent();await page.getByRole('button',{name:'Próxima',exact:true}).click();await expect(page.locator('[data-table-range]')).toHaveText('Mostrando 11–12 de 12');expect(await page.locator('[data-row]:visible').first().textContent()).not.toBe(first);await expect(page.locator('[data-table]')).toBeFocused();await expect(page.locator('[data-table-next]')).toBeDisabled();
});
test('rodada 4: login mostra e oculta senha',async({page})=>{
 await page.goto('/entrar/');const password=page.getByLabel('Senha',{exact:true});await password.fill('exemplo-local');await page.getByRole('button',{name:'Mostrar senha',exact:true}).click();await expect(password).toHaveAttribute('type','text');await expect(page.locator('#password-toggle')).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Ocultar senha',exact:true}).click();await expect(password).toHaveAttribute('type','password');await expect(password).toHaveValue('exemplo-local');await expect(page.locator('#password-toggle')).toHaveAttribute('aria-pressed','false');
});

test('govnexa: marca e módulos na plataforma',async({page})=>{
 for(const path of ['/plataforma/projetos/','/plataforma/gestao/']){const response=await page.goto(path);expect(response?.status(),path).toBe(200);await expect(page.locator('h1'),path).toHaveCount(1);}
 await page.goto('/plataforma/');await expect(page).toHaveTitle(/GovNexa/);
 const side=page.locator('.sidebar');for(const t of ['Projetos','Captação','Licitações','Gestão'])await expect(side).toContainText(t);await expect(side).not.toContainText('Área do comprador');
 await page.goto('/entrar/');await expect(page).toHaveTitle(/Atlas/);
});
test('govnexa: carteira, kanban, gantt e órgãos',async({page})=>{
 const paginas=['/plataforma/projetos-carteira/','/plataforma/projetos-kanban/','/plataforma/projetos-gantt/','/plataforma/projetos-orgaos/'];
 for(const path of paginas){const response=await page.goto(path);expect(response?.status(),path).toBe(200);await expect(page.locator('h1'),path).toHaveCount(1);}
 await page.goto('/plataforma/projetos-kanban/');
 const nomes=['Em estruturação','Planejamento','Preparatório para Contratação','Contratação','Mobilização','Execução','Conclusão'];
 const cabecalhos=page.locator('.kb-col h2');await expect(cabecalhos).toHaveCount(7);
 for(let i=0;i<nomes.length;i++)await expect(cabecalhos.nth(i)).toHaveText(nomes[i]);
 const todos=await page.locator('.kb-card:visible').count();expect(todos).toBeGreaterThan(0);
 await page.locator('[data-kb-orgao]').selectOption({index:1});
 expect(await page.locator('.kb-card:visible').count()).toBeLessThan(todos);
 await page.goto('/plataforma/projetos-gantt/');expect(await page.locator('.gt-bar').count()).toBeGreaterThan(0);
 await page.goto('/plataforma/projetos-carteira/');
 await page.getByRole('button',{name:'Ver detalhes'}).first().click();
 await expect(page.locator('#record-body')).toContainText('Valores e recursos');
 for(const width of [375,1280]){await page.setViewportSize({width,height:900});for(const path of paginas){await page.goto(path);const sobra=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(sobra,`${path} em ${width}px`).toBeLessThanOrEqual(0);}}
 await page.setViewportSize({width:1280,height:900});
 for(const theme of ['light','dark'])for(const path of ['/plataforma/projetos-kanban/','/plataforma/projetos-gantt/']){await page.goto(path);await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`${path} ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: tabelas cabem na largura, sem rolagem horizontal',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 for(const slug of ['projetos','projetos-carteira','gestao','captacao','captacao-oportunidades','captacao-acompanhamento','captacao-alertas','captacao-comparativo','captacao-qualidade','captacao-projetos']){await page.goto(`/plataforma/${slug}/`);const sobra=await page.$$eval('.table-wrap',ws=>Math.max(0,...ws.map(e=>e.scrollWidth-e.clientWidth)));expect(sobra,slug).toBeLessThanOrEqual(1);}
 await page.goto('/plataforma/projetos/');await expect(page.locator('table')).toContainText('Total da carteira');await expect(page.locator('table')).not.toContainText('Fase 0');
});

test('govnexa: cronogramas, onde está parado e simulação',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 const idCronograma=cronogramasExemplo.cronogramas[0].id;
 const paginas=['/plataforma/projetos-cronogramas/','/plataforma/projetos-parado/','/plataforma/projetos-pendencias/',`/plataforma/cronograma/${idCronograma}/`];
 for(const path of paginas){const response=await page.goto(path);expect(response?.status(),path).toBe(200);await expect(page.locator('h1'),path).toHaveCount(1);}
 // página do cronograma: três abas alternam
 await page.goto(`/plataforma/cronograma/${idCronograma}/`);
 const abas=[['Linha do tempo','tempo'],['Quadro de tarefas','quadro'],['Pendências de dado','dados']];
 for(const [nome,chave] of abas){const botao=page.getByRole('button',{name:nome});await botao.click();await expect(botao).toHaveAttribute('aria-pressed','true');await expect(page.locator(`[data-cr-painel="${chave}"]`)).toBeVisible();for(const [,outra] of abas)if(outra!==chave)await expect(page.locator(`[data-cr-painel="${outra}"]`)).toBeHidden();}
 // Kanban: botão Mover em modo simulação
 await page.goto('/plataforma/projetos-kanban/');
 await expect(page.getByText('Modo simulação: as regras são aplicadas, mas nada é gravado até o banco de dados ser configurado.').first()).toBeVisible();
 const coluna=page.locator('.kb-col').filter({has:page.getByRole('heading',{name:'Em estruturação',exact:true})});
 await coluna.locator('[data-kb-card]').first().getByRole('button',{name:/Mover/}).click();
 await expect(page.locator('#kb-dialog')).toBeVisible();
 await page.locator('#kb-dialog').getByLabel('Para a etapa').selectOption({label:'Planejamento'});
 await page.locator('#kb-dialog').getByRole('button',{name:'Aplicar',exact:true}).click();
 const resultado=page.locator('#toast:not([hidden]), #kb-dialog[open]').first();
 await expect(resultado).toBeVisible();
 if(await page.locator('#kb-dialog[open]').count()){await expect(page.locator('#kb-dialog')).toContainText('Faltam requisitos');expect(await page.locator('#kb-dialog [data-kb-dlg-erro] li').count()).toBeGreaterThan(0);}
 else await expect(page.locator('#toast')).toContainText('Simulação');
 // Pendências: reprovar exige motivo
 await page.goto('/plataforma/projetos-pendencias/');
 await page.getByRole('button',{name:'Reprovar',exact:true}).first().click();
 const dialogo=page.locator('#pd-dialog');await expect(dialogo).toBeVisible();
 await dialogo.getByRole('button',{name:'Aplicar',exact:true}).click();
 await expect(dialogo).toBeVisible();await expect(dialogo.getByRole('alert')).toContainText('motivo');await expect(page.locator('.pd-resultado:visible')).toHaveCount(0);
 await dialogo.getByLabel('Motivo (obrigatório)').fill('Documento incompleto');
 await dialogo.getByRole('button',{name:'Aplicar',exact:true}).click();
 await expect(dialogo).toBeHidden();await expect(page.locator('.pd-resultado:visible').first()).toContainText('Simulação');
 // sem rolagem horizontal das tabelas
 for(const path of paginas){await page.goto(path);const sobra=await page.$$eval('.table-wrap',ws=>Math.max(0,...ws.map(e=>e.scrollWidth-e.clientWidth)));expect(sobra,path).toBeLessThanOrEqual(1);}
 // axe: pendências e cronograma, claro e escuro
 for(const theme of ['light','dark'])for(const path of ['/plataforma/projetos-pendencias/',`/plataforma/cronograma/${idCronograma}/`]){await page.goto(path);await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`${path} ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: histórico de alterações',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 const response=await page.goto('/plataforma/projetos-log/');
 expect(response?.status()).toBe(200);
 await expect(page.locator('h1')).toHaveCount(1);
 const contador=page.locator('[data-lg-contador]');
 await expect(contador).toContainText('registros');
 const numero=async()=>Number((await contador.textContent())!.split(' de ')[0]);
 const total=await numero();
 expect(total).toBeGreaterThan(20);
 // filtro por ação reduz o contador; Limpar restaura
 await page.locator('[data-lg-acao]').selectOption({label:'Mudança de etapa'});
 await expect.poll(numero).toBeLessThan(total);
 expect(await numero()).toBeGreaterThan(0);
 for(const celula of await page.locator('[data-lg-corpo] tr:not(.lg-detalhe) td:nth-child(3)').all())await expect(celula).toContainText('Mudança de etapa');
 await page.getByRole('button',{name:'Limpar'}).click();
 await expect.poll(numero).toBe(total);
 // linha expansível mostra antes e depois
 await page.locator('[data-lg-acao]').selectOption({label:'Campos alterados'});
 const ver=page.locator('.lg-ver').first();
 await ver.click();
 await expect(ver).toHaveAttribute('aria-expanded','true');
 const detalhe=page.locator('.lg-detalhe:not([hidden])').first();
 await expect(detalhe).toContainText('Antes:');
 await expect(detalhe).toContainText('Depois:');
 // exportar CSV baixa o que está filtrado
 const [baixado]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Exportar CSV'}).click()]);
 expect(baixado.suggestedFilename()).toMatch(/^historico-govnexa-\d{4}-\d{2}-\d{2}\.csv$/);
 // pré-filtro pela URL: só o projeto pedido
 await page.goto('/plataforma/projetos-log/?projeto=P-900');
 await expect(page.locator('[data-lg-projeto]')).toHaveValue('P-900');
 await expect.poll(async()=>(await page.locator('[data-lg-corpo] tr:not(.lg-detalhe)').count())).toBeGreaterThan(0);
 for(const celula of await page.locator('[data-lg-corpo] tr:not(.lg-detalhe) td:nth-child(2)').all())await expect(celula).toContainText('P-900');
 // simulação no Kanban aparece no topo do log com o selo
 await page.goto('/plataforma/projetos-kanban/');
 const coluna=page.locator('.kb-col').filter({has:page.getByRole('heading',{name:'Em estruturação',exact:true})});
 await coluna.locator('[data-kb-card]').first().getByRole('button',{name:/Mover/}).click();
 const dialogo=page.locator('#kb-dialog');
 await dialogo.getByLabel('Para a etapa').selectOption({label:'Planejamento'});
 await dialogo.getByRole('button',{name:'Aplicar',exact:true}).click();
 if(await dialogo.evaluate((d:HTMLDialogElement)=>d.open)){
  await dialogo.getByLabel(/Forçar com motivo/).check();
  await dialogo.getByLabel(/Motivo/).fill('Teste da simulação no histórico');
  await dialogo.getByRole('button',{name:'Aplicar',exact:true}).click();
 }
 await expect(page.locator('#toast')).toContainText('Simulação');
 await page.goto('/plataforma/projetos-log/');
 await expect(page.locator('[data-lg-corpo] tr').first()).toContainText('Simulação (não gravado)');
 await expect(page.locator('[data-lg-corpo] tr').first()).toContainText('Mudança de etapa');
 // sem rolagem horizontal em 1280px (página e tabela)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 expect(await page.$$eval('.lg-tabela',ws=>Math.max(0,...ws.map(e=>e.scrollWidth-e.clientWidth)))).toBeLessThanOrEqual(1);
 await page.getByRole('button',{name:'Ver detalhes'}).first().click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 // axe: claro e escuro
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`log ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: fluxo do sistema',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 const resposta=await page.goto('/plataforma/projetos-fluxo/');
 expect(resposta?.status()).toBe(200);
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('svg.fx-svg [data-no]')).toHaveCount(32);
 // clique no portão: validações e link para as pendências
 await page.locator('svg.fx-svg [data-no="portao"]').click();
 const dlg=page.locator('#fluxo-detalhe');
 await expect(dlg).toBeVisible();
 await expect(dlg.getByRole('heading',{name:'O que é validado'})).toBeVisible();
 const link=dlg.getByRole('link',{name:'Abrir: Pendências de etapa'});
 await expect(link).toHaveAttribute('href','/plataforma/projetos-pendencias/');
 await link.click();
 await expect(page).toHaveURL(/\/plataforma\/projetos-pendencias\/$/);
 // teclado: foco + Enter no início; "Próximas etapas" leva ao cadastro
 await page.goto('/plataforma/projetos-fluxo/');
 await page.locator('svg.fx-svg [data-no="inicio"]').focus();
 await page.keyboard.press('Enter');
 await expect(dlg).toBeVisible();
 await expect(dlg.getByRole('heading',{name:'Próximas etapas'})).toBeVisible();
 await dlg.locator('[data-fx-prox] button').first().click();
 await expect(dlg.locator('[data-fx-titulo]')).toHaveText('Cadastro do projeto');
 await page.keyboard.press('Escape');
 await expect(dlg).toBeHidden();
 // sem rolagem horizontal em 1280px e 375px
 for(const width of [1280,375]){await page.setViewportSize({width,height:900});await page.goto('/plataforma/projetos-fluxo/');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`largura ${width}`).toBeTruthy();}
 // axe: claro e escuro
 await page.setViewportSize({width:1280,height:900});
 await page.goto('/plataforma/projetos-fluxo/');
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`fluxo ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: fluxo exporta em PDF',async({page})=>{
 await page.goto('/plataforma/projetos-fluxo/');await expect(page.getByRole('button',{name:'Exportar em PDF'})).toBeVisible();
 await page.emulateMedia({media:'print'});await expect(page.locator('.fx-anexo')).toBeVisible();await expect(page.locator('.fx-anexo-no')).toHaveCount(32);await expect(page.getByRole('button',{name:'Exportar em PDF'})).toBeHidden();
});

test('govnexa: sala de guerra',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 const resposta=await page.goto('/plataforma/projetos-sala/');
 expect(resposta?.status()).toBe(200);
 await expect(page.locator('h1')).toHaveCount(1);
 for(const nome of ['Em sala agora','Candidatos à sala','Encerradas'])await expect(page.getByRole('heading',{name:nome})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 // "Abrir sala" num candidato (se houver): diálogo, aviso de simulação e registro
 const abrir=page.locator('[data-sl-candidato]').first().getByRole('button',{name:/Abrir sala/});
 if(await abrir.count()){
  await abrir.click();
  const dlg=page.locator('#sl-dialog');
  await expect(dlg).toContainText('Modo simulação: nada é gravado até o banco de dados ser configurado.');
  await dlg.getByLabel(/Objetivo/).fill('Destravar a etapa parada');
  await dlg.getByLabel(/Dono da sala/).fill('Responsável 1');
  await dlg.getByRole('button',{name:'Abrir sala (simulação)'}).click();
  await expect(page.locator('#toast')).toContainText('Simulação');
  await page.goto('/plataforma/projetos-log/');
  await expect(page.locator('[data-lg-corpo] tr').first()).toContainText('Sala de guerra aberta');
  await page.goto('/plataforma/projetos-sala/');
 }
 // axe na lista, claro e escuro
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`sala lista ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
 // página da 1ª sala: quadro RAID, ação vencida, modo reunião
 await page.locator('.sl-cartao').first().getByRole('link',{name:/Abrir sala/}).click();
 await expect(page).toHaveURL(/\/plataforma\/sala-de-guerra\/S-1\/$/);
 await expect(page.locator('h1')).toHaveCount(1);
 for(const nome of ['Riscos','Ações','Problemas','Decisões'])await expect(page.locator('.sl-coluna').getByRole('heading',{name:nome})).toBeVisible();
 await expect(page.locator('.sl-vencida').first()).toContainText('vencida');
 await expect(page.locator('[data-sl-reuniao]')).toBeHidden();
 await page.getByRole('button',{name:'Modo reunião'}).click();
 await expect(page.locator('[data-sl-reuniao]')).toBeVisible();
 await expect(page.locator('.sl-pauta li').first()).toContainText('Objetivo e prazo');
 await page.locator('[data-sl-item-pauta]').first().check();
 await page.getByRole('button',{name:'Registrar reunião'}).click();
 await expect(page.locator('#toast')).toContainText('Simulação');
 // nova ação em simulação
 await page.getByRole('button',{name:'Nova ação'}).click();
 await expect(page.locator('#sl-item-dialog')).toContainText('Modo simulação');
 await page.locator('[data-sl-item-desc]').fill('Ação criada no teste');
 await page.locator('#sl-item-dialog').getByRole('button',{name:'Adicionar (simulação)'}).click();
 await expect(page.locator('[data-sl-coluna="acao"]')).toContainText('Ação criada no teste');
 // sem rolagem horizontal em 1280px
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 // exportar em PDF: na impressão tudo aparece expandido e os botões somem
 await page.emulateMedia({media:'print'});
 await expect(page.locator('[data-sl-reuniao]')).toBeVisible();
 await expect(page.getByRole('button',{name:'Exportar em PDF'})).toBeHidden();
 await page.emulateMedia({media:'screen'});
 // axe na página da sala, claro e escuro
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`sala ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: sala de guerra incluir e retirar',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 // candidatos explicam o porquê
 await page.goto('/plataforma/projetos-sala/');
 const cand=page.locator('[data-sl-candidato]');
 if(await cand.count())await expect(cand.first()).toContainText('Sugerido porque');
 // página da sala S-1 (1 projeto): retirar desabilitado
 await page.goto('/plataforma/sala-de-guerra/S-1/');
 const lista=page.locator('[data-sl-proj-lista]');
 await expect(lista.locator('[data-sl-proj]')).toHaveCount(1);
 await expect(lista.getByRole('button',{name:/Retirar da sala/})).toBeDisabled();
 await expect(page.getByText('A sala precisa de ao menos um projeto.')).toBeVisible();
 // incluir projeto buscando "Exemplo"
 await page.getByRole('button',{name:'Incluir projeto'}).click();
 const dInc=page.locator('#sl-incluir-dialog');
 await expect(dInc).toContainText('Modo simulação');
 await dInc.getByLabel(/Buscar projeto/).fill('Exemplo');
 const botoes=dInc.locator('[data-sl-busca-lista] button:not([disabled])');
 expect(await botoes.count()).toBeGreaterThan(0);
 await dInc.locator('[data-sl-inc-motivo]').fill('Mesmo tema');
 await botoes.first().click();
 await expect(page.locator('#toast')).toContainText('Simulação');
 await expect(lista.locator('[data-sl-proj]')).toHaveCount(2);
 // retirar sem motivo não retira; com motivo retira
 await lista.getByRole('button',{name:/Retirar da sala/}).first().click();
 const dRet=page.locator('#sl-retirar-dialog');
 await expect(dRet).toContainText('Modo simulação');
 await dRet.getByRole('button',{name:'Retirar (simulação)'}).click();
 await expect(dRet.locator('[data-sl-ret-erro]')).toContainText('Informe o motivo');
 await expect(lista.locator('[data-sl-proj]')).toHaveCount(2);
 await dRet.getByLabel(/Motivo/).fill('Saiu do escopo');
 await dRet.getByRole('button',{name:'Retirar (simulação)'}).click();
 await expect(lista.locator('[data-sl-proj]')).toHaveCount(1);
 // registros no histórico
 await page.goto('/plataforma/projetos-log/');
 await expect(page.locator('[data-lg-corpo]')).toContainText('Projeto retirado da sala de guerra');
 await expect(page.locator('[data-lg-corpo]')).toContainText('Projeto incluído na sala de guerra');
 // sem rolagem horizontal (1280 e 390)
 for(const largura of [1280,390]){
  await page.setViewportSize({width:largura,height:900});
  await page.goto('/plataforma/sala-de-guerra/S-1/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`rolagem ${largura}`).toBeTruthy();
  await page.getByRole('button',{name:'Incluir projeto'}).click();
  await page.getByLabel(/Buscar projeto/).fill('Exemplo');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`rolagem diálogo ${largura}`).toBeTruthy();
  await page.getByRole('button',{name:'Fechar'}).click();
 }
 await page.setViewportSize({width:1280,height:900});
 // axe na página da sala, claro e escuro
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`sala incluir ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: tema escolhido se mantém ao trocar de guia',async({page})=>{
 for(const [esquema,escolhido] of [['light','dark'],['dark','light']] as const){
  await page.emulateMedia({colorScheme:esquema});await page.goto('/plataforma/projetos/');
  await page.evaluate(t=>{localStorage.setItem('atlas-theme',t);document.documentElement.dataset.theme=t},escolhido);
  for(const nome of ['Carteira de projetos','Kanban por macroetapa','Fluxo do sistema','Histórico de alterações','Projetos · Início']){
   await page.locator('.sidebar').getByRole('link',{name:nome,exact:true}).click();await page.waitForLoadState('domcontentloaded');
   await expect(page.locator('html'),nome).toHaveAttribute('data-theme',escolhido);
  }
 }
});

test('govnexa: novo projeto',async({page})=>{
 await page.goto('/plataforma/projetos/');
 await expect(page.locator('.workspace').getByRole('link',{name:'Novo projeto',exact:true})).toBeVisible();
 await page.goto('/plataforma/projetos-carteira/');
 await page.locator('.workspace').getByRole('link',{name:'Novo projeto',exact:true}).click();
 await page.waitForURL(/projetos-novo/);
 await expect(page.getByRole('heading',{name:'Novo projeto',level:1})).toBeVisible();
 await expect(page.getByText('Modo simulação').first()).toBeVisible();
 // enviar vazio mostra erros de Nome e Órgão
 await page.getByRole('button',{name:'Validar e simular cadastro'}).click();
 await expect(page.locator('[data-np-resumo]')).toContainText('Informe o nome do projeto');
 await expect(page.locator('[data-np-resumo]')).toContainText('Escolha o órgão');
 await expect(page.locator('#np-nome')).toHaveAttribute('aria-invalid','true');
 await expect(page.locator('#np-orgao')).toHaveAttribute('aria-invalid','true');
 // preencher nome e órgão
 await page.locator('#np-nome').fill('Nova UBS do teste');
 await page.locator('#np-orgao').selectOption({index:1});
 await page.getByRole('button',{name:'Validar e simular cadastro'}).click();
 const ok=page.locator('[data-np-ok]');
 await expect(ok).toContainText('Simulação');
 await expect(ok).toContainText('00 – Em estruturação');
 await expect(ok).toContainText('Nada foi gravado');
 // sem rolagem horizontal em 1280 e 390px
 for(const width of [1280,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px`).toBeTruthy();}
 // axe claro/escuro
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),theme).toEqual([]);}
 await page.setViewportSize({width:1280,height:900});
 // o histórico mostra o registro simulado
 await ok.getByRole('link',{name:'Ver no Histórico de alterações'}).click();
 await page.waitForURL(/projetos-log/);
 await expect(page.getByText('Simulação (não gravado)').first()).toBeVisible();
 await expect(page.locator('td').getByText('Projeto incluído').first()).toBeVisible();
});

test('govnexa: fluxos detalhados',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 const ids=['cadastro','oportunidade','movimentacao','clausula','licitacao','sala'];
 const urls=new Set<string>();
 const coletar=async()=>{const lista:{telas:{url:string}[];subfluxo:string|null}[]=JSON.parse((await page.locator('[data-fx-dados]').textContent())||'[]');for(const n of lista){for(const t of n.telas)urls.add(t.url);if(n.subfluxo)urls.add(`/plataforma/fluxo/${n.subfluxo}/`);}};
 // mapa geral: 6 fluxos detalhados listados, selo nas caixas e botão no diálogo
 await page.goto('/plataforma/projetos-fluxo/');
 await expect(page.getByRole('heading',{name:'Fluxos detalhados',level:2})).toBeVisible();
 await expect(page.locator('.fx-subs li')).toHaveCount(6);
 await expect(page.locator('svg.fx-svg .fx-selo-sub')).toHaveCount(6);
 await coletar();
 await page.locator('svg.fx-svg [data-no="cadastro"]').click();
 const dlg=page.locator('#fluxo-detalhe');
 const ver=dlg.getByRole('link',{name:'Ver fluxo detalhado'});
 await expect(ver).toHaveAttribute('href','/plataforma/fluxo/cadastro/');
 await ver.click();
 await expect(page).toHaveURL(/\/plataforma\/fluxo\/cadastro\/$/);
 // cada fluxo detalhado: 200, um h1, link de volta, PDF e hexágonos de exceção
 for(const id of ids){
  const r=await page.goto(`/plataforma/fluxo/${id}/`);
  expect(r?.status(),id).toBe(200);
  await expect(page.locator('h1'),id).toHaveCount(1);
  await expect(page.locator('h1'),id).toContainText('Fluxo detalhado:');
  await expect(page.getByRole('link',{name:/Voltar ao fluxo do sistema/}),id).toHaveAttribute('href','/plataforma/projetos-fluxo/');
  await expect(page.getByRole('button',{name:'Exportar em PDF'}),id).toBeVisible();
  expect(await page.locator('svg.fx-svg path.fx-exc').count(),`${id}: hexágonos de exceção`).toBeGreaterThan(0);
  expect(await page.locator('svg.fx-svg [data-no] .fx-exc-rot').count(),id).toBe(await page.locator('svg.fx-svg path.fx-exc').count());
  await coletar();
 }
 // clicar numa exceção mostra "Aceita quando" e o que fica registrado
 await page.goto('/plataforma/fluxo/cadastro/');
 await page.locator('svg.fx-svg [data-no="c-pend-exc"]').click();
 const d=page.locator('dialog[open]');
 await expect(d).toContainText('Aceita quando');
 await expect(d).toContainText('O que fica registrado');
 await expect(d.locator('[data-fx-exc]')).toBeVisible();
 await page.keyboard.press('Escape');
 // PDF: o anexo traz as exceções
 await page.emulateMedia({media:'print'});
 await expect(page.locator('.fx-anexo-no')).toHaveCount(11);
 await expect(page.locator('.fx-anexo')).toContainText('Exceção aceita quando');
 await page.emulateMedia({media:'screen'});
 // todos os links de tela dos diálogos (mapa geral e fluxos detalhados) respondem 200
 expect(urls.size).toBeGreaterThan(10);
 for(const u of urls){const resp=await page.request.get(u);expect(resp.status(),u).toBe(200);}
 // histórico: ?excecoes=1 mostra só exceções
 await page.goto('/plataforma/projetos-log/');
 await expect(page.locator('[data-lg-contador]')).toContainText('registros');
 const total=Number(((await page.locator('[data-lg-contador]').textContent())||'').split(' de ')[0]);
 await page.goto('/plataforma/projetos-log/?excecoes=1');
 await expect(page.locator('[data-lg-excecoes]')).toBeChecked();
 await expect.poll(async()=>page.locator('[data-lg-corpo] tr:not(.lg-detalhe)').count()).toBeGreaterThan(0);
 expect(Number(((await page.locator('[data-lg-contador]').textContent())||'').split(' de ')[0])).toBeLessThan(total);
 for(const linha of await page.locator('[data-lg-corpo] tr:not(.lg-detalhe)').all())await expect(linha).toContainText('Exceção');
 await page.locator('[data-lg-corpo] .lg-ver').first().click();
 await expect(page.locator('.lg-detalhe:not([hidden])').first()).toContainText('Exceção — motivo');
 // sem rolagem horizontal em 1280 e 390px
 for(const width of [1280,390])for(const u of ['/plataforma/fluxo/cadastro/','/plataforma/fluxo/licitacao/','/plataforma/projetos-fluxo/'])
  {await page.setViewportSize({width,height:900});await page.goto(u);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${u} ${width}px`).toBeTruthy();}
 // axe claro e escuro em um fluxo detalhado
 await page.setViewportSize({width:1280,height:900});
 await page.goto('/plataforma/fluxo/cadastro/');
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`subfluxo ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: novo projeto em colunas e foco no resultado',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 await page.goto('/plataforma/projetos-novo/');
 const colunas=async()=>page.locator('.np-grade').first().evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
 expect(await colunas()).toBe(3);
 await page.setViewportSize({width:800,height:900});expect(await colunas()).toBe(2);
 await page.setViewportSize({width:390,height:900});expect(await colunas()).toBe(1);
 await page.getByRole('button',{name:'Validar e simular cadastro'}).click();
 await expect(page.locator('[data-np-resumo]')).toBeFocused();
 await page.locator('#np-nome').fill('Projeto do teste de foco');
 await page.locator('#np-orgao').selectOption({index:1});
 await page.getByRole('button',{name:'Validar e simular cadastro'}).click();
 await expect(page.locator('[data-np-ok]')).toBeFocused();
 await expect(page.locator('[data-np-ok]')).toBeInViewport();
});

test('govnexa: paginação compacta com reticências',async({page})=>{
 await page.setViewportSize({width:1280,height:900});await page.goto('/plataforma/captacao-acompanhamento/');
 const n=page.locator('[data-page-numbers]').first();const total=await n.locator('button').count();
 if(total<=7){await expect(n.locator('.pag-reticencias')).toHaveCount(0);return;}
 await expect(n.locator('button').first()).toHaveText('1');await expect(n.locator('.pag-reticencias')).toHaveCount(1);expect(total).toBeLessThanOrEqual(7);
});

test('govnexa: prazos da Lei 14.133',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 const resp=await page.goto('/plataforma/licitacoes-prazos/');
 expect(resp?.status()).toBe(200);
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('h1')).toHaveText('Prazos da Lei 14.133');
 await expect(page.locator('[data-pz-tabela] tbody tr')).toHaveCount(11);
 // teto: decisão do recurso, início 13/11/2026 -> limite 30/11 e meta 23/11 (20/11 é feriado)
 await page.locator('#pz-prazo').selectOption('decisao_recurso');
 await page.locator('#pz-inicio').fill('2026-11-13');
 await page.locator('#pz-hoje').fill('2026-11-20');
 await expect(page.locator('[data-pz-legal]')).toHaveText('30/11/2026');
 await expect(page.locator('[data-pz-meta]')).toHaveText('23/11/2026');
 await expect(page.locator('[data-pz-situacao]')).toContainText('No prazo');
 await page.locator('#pz-hoje').fill('2026-11-25');
 await expect(page.locator('[data-pz-situacao]')).toContainText('Passou da meta interna — atenção');
 await page.locator('#pz-hoje').fill('2026-12-02');
 await expect(page.locator('[data-pz-situacao]')).toContainText('Passou do limite da lei — alerta');
 // piso: abertura cedo demais mostra o aviso
 await page.locator('#pz-prazo').selectOption('publicidade_bens_menor_preco');
 await page.locator('#pz-abertura').fill('2026-11-16');
 await expect(page.locator('[data-pz-situacao]')).toContainText('A abertura não pode ser antes de 26/11/2026');
 await page.locator('#pz-abertura').fill('2026-11-26');
 await expect(page.locator('[data-pz-situacao]')).toContainText('No prazo');
 // feriados do ano
 await page.locator('#pz-ano').fill('2026');
 await expect(page.locator('[data-pz-feriados]')).toContainText('Aniversário de Goiânia');
 await expect(page.locator('[data-pz-feriados]')).toContainText('20/11/2026');
 // sem rolagem horizontal em 1280 e 390px
 for(const width of [1280,390]){await page.setViewportSize({width,height:900});await page.goto('/plataforma/licitacoes-prazos/');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px`).toBeTruthy();}
 // axe claro e escuro
 await page.setViewportSize({width:1280,height:900});
 await page.goto('/plataforma/licitacoes-prazos/');
 await page.locator('#pz-inicio').fill('2026-11-13');
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`prazos ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: reunião semanal',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 const resposta=await page.goto('/plataforma/projetos-reuniao/');
 expect(resposta?.status()).toBe(200);
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('[data-ru-lista] .ru-item').first()).toBeVisible();
 const total=async()=>page.locator('[data-ru-lista] .ru-item').count();
 const antes=await total();
 expect(antes).toBeGreaterThan(0);
 // mudar a data da última reunião recalcula a pauta
 await page.locator('[data-ru-desde]').fill('2000-01-01');
 await expect.poll(total).toBeGreaterThanOrEqual(antes);
 const comTudo=await total();
 await page.locator('[data-ru-desde]').fill('2099-01-01');
 await expect.poll(total).toBeLessThanOrEqual(comTudo);
 await page.locator('[data-ru-desde]').fill('2000-01-01');
 await expect.poll(total).toBe(comTudo);
 // acrescentar ação e registrar
 const item=page.locator('[data-ru-lista] .ru-item').first();
 await item.getByLabel('Discussão').fill('Conversamos sobre o prazo.');
 await item.getByLabel('Decisão').fill('Cobrar o responsável.');
 await item.getByRole('button',{name:/Acrescentar ação/}).click();
 await item.getByLabel(/Descrição da ação/).fill('Enviar ofício');
 await item.getByLabel(/Responsável da ação/).fill('Responsável 1');
 await item.getByLabel(/Prazo da ação/).fill('2026-12-01');
 await item.getByLabel('Discutido').check();
 await page.getByRole('button',{name:'Registrar reunião (simulação)'}).click();
 await expect(page.locator('[data-ru-ok]')).toContainText('Nada foi gravado');
 await page.goto('/plataforma/projetos-log/');
 await expect(page.locator('[data-lg-corpo]')).toContainText('Reunião semanal registrada');
 await expect(page.locator('[data-lg-corpo]')).toContainText('Ação criada na reunião');
 // sem rolagem horizontal em 1280 e 390px
 for(const width of [1280,390]){await page.setViewportSize({width,height:900});await page.goto('/plataforma/projetos-reuniao/');await expect(page.locator('[data-ru-lista] .ru-item').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`reunião ${width}px`).toBeTruthy();}
 // axe claro e escuro
 await page.setViewportSize({width:1280,height:900});
 await page.goto('/plataforma/projetos-reuniao/');
 await expect(page.locator('[data-ru-lista] .ru-item').first()).toBeVisible();
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`reunião ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: Novo projeto fora do menu, aberto pelo botão',async({page})=>{
 await page.goto('/plataforma/projetos/');
 await expect(page.locator('.sidebar').getByRole('link',{name:'Novo projeto',exact:true})).toHaveCount(0);
 await page.locator('.workspace').getByRole('link',{name:'Novo projeto',exact:true}).click();await page.waitForURL(/projetos-novo/);
 await expect(page.locator('h1')).toHaveText('Novo projeto');
});

test('govnexa: menu lateral com blocos que abrem e fecham',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 await page.goto('/plataforma/projetos/');
 const bloco=()=>page.locator('.sidebar button[data-sec^="m:"]',{hasText:/licita/i}).first();
 // por padrão os blocos principais começam fechados; o da página atual abre
 await expect(bloco()).toHaveAttribute('aria-expanded','false');
 const corpo=page.locator('#'+await bloco().getAttribute('aria-controls'));
 await expect(corpo).toBeHidden();
 await expect(page.locator('.sidebar a[aria-current=page]').first()).toBeVisible();
 await bloco().click();
 await expect(bloco()).toHaveAttribute('aria-expanded','true');await expect(corpo).toBeVisible();
 await page.reload();
 await expect(bloco()).toHaveAttribute('aria-expanded','true');
 // sub-bloco (Operação, dentro de Licitações)
 const sub=page.locator('.sidebar button[data-sec^="g:Licitações:"]').first();const subCorpo=page.locator('#'+await sub.getAttribute('aria-controls'));
 await sub.click();await expect(sub).toHaveAttribute('aria-expanded','false');await expect(subCorpo).toBeHidden();
 await sub.click();await expect(subCorpo).toBeVisible();
 // bloco inteiro, lembrado depois de recarregar
 await bloco().click();
 await expect(bloco()).toHaveAttribute('aria-expanded','false');await expect(corpo).toBeHidden();
 await page.reload();
 await expect(bloco()).toHaveAttribute('aria-expanded','false');
 // a página atual abre o bloco dela mesmo se estiver fechado
 const link=await corpo.locator('a').first().getAttribute('href');
 await page.goto(link!);
 await expect(bloco()).toHaveAttribute('aria-expanded','true');
 // axe claro e escuro na barra lateral
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).include('.sidebar').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`menu ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: menu no celular com menu recolhido salvo continua reabrindo blocos',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/plataforma/projetos/');
 await page.evaluate(()=>{localStorage.setItem('atlas-sidebar','true');localStorage.setItem('govnexa-menu-estado',JSON.stringify({'m:Licitações':false}))});
 await page.reload();
 await page.locator('#drawer-toggle').click();
 const bloco=page.locator('.sidebar button[data-sec="m:Licitações"]');
 await expect(bloco).toBeVisible();await expect(bloco).toHaveAttribute('aria-expanded','false');
 await bloco.click();
 await expect(page.locator('#'+await bloco.getAttribute('aria-controls')).locator('a').first()).toBeVisible();
});

test('govnexa: painel do prefeito',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 const resposta=await page.goto('/plataforma/gestao/');
 expect(resposta?.status()).toBe(200);
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('h1')).toHaveText('Gestão · Painel');
 const cartoes=page.locator('[data-painel] .pn-cartao');
 await expect(cartoes).toHaveCount(6);
 const destinos=await cartoes.evaluateAll(els=>els.map(e=>(e as HTMLAnchorElement).getAttribute('href')||''));
 for(const href of destinos){expect(href.startsWith('/plataforma/'),href).toBeTruthy();const r=await page.request.get(href);expect(r.status(),href).toBe(200);}
 await expect(page.getByRole('button',{name:'Exportar em PDF'})).toBeVisible();
 await expect(page.getByText('Licitações em detalhe',{exact:false})).toBeVisible();
 await expect(page.getByRole('link',{name:'Histórico de alterações',exact:false}).first()).toHaveAttribute('href','/plataforma/projetos-log/');
 for(const width of [1280,390]){await page.setViewportSize({width,height:900});await page.goto('/plataforma/gestao/');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`painel ${width}px`).toBeTruthy();}
 await page.setViewportSize({width:1280,height:900});
 await page.goto('/plataforma/gestao/');
 for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`painel ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);}
});

test('govnexa: mapa das obras',async({page,browser})=>{
 await page.route('https://tile.openstreetmap.org/**',r=>r.abort());
 const semRolagem=()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
 const numero=async()=>Number((await page.locator('[data-mp-contagem]').innerText()).match(/^(\d+)/)![1]);
 // painel do prefeito com o mapa
 await page.setViewportSize({width:1280,height:900});
 const resposta=await page.goto('/plataforma/gestao/');
 expect(resposta?.status()).toBe(200);
 await expect(page.locator('#mapa')).toBeVisible();
 await expect(page.locator('#mapa .leaflet-container')).toBeVisible();
 await expect(page.locator('#mapa .leaflet-marker-icon .mp-marcador').first()).toBeVisible();
 await expect(page.locator('#mapa path.leaflet-interactive').first()).toBeAttached();
 const antes=await numero();
 expect(antes).toBeGreaterThanOrEqual(2);
 await page.screenshot({path:'C:/Users/ANIEL_~1/AppData/Local/Temp/claude/4a02c2d203f7e454/dc8f7733-5c4f-49f8-90a6-ea4344865340/scratchpad/mapa-1280.png',fullPage:false});
 await page.locator('#mapa .leaflet-marker-icon').first().click();
 const popup=page.locator('.leaflet-popup-content');
 await expect(popup.getByRole('link',{name:'Abrir a ficha'})).toHaveAttribute('href',/^\/plataforma\/projetos-carteira\/\?q=/);
 await expect(popup.getByRole('link',{name:'Editar localização'})).toBeVisible();
 await page.screenshot({path:'C:/Users/ANIEL_~1/AppData/Local/Temp/claude/4a02c2d203f7e454/dc8f7733-5c4f-49f8-90a6-ea4344865340/scratchpad/mapa-popup.png'});
 await page.keyboard.press('Escape');
 await page.locator('#mapa').getByRole('button',{name:'Em execução'}).click();
 await expect(page.locator('#mapa').getByRole('button',{name:'Em execução'})).toHaveAttribute('aria-pressed','false');
 expect(await numero()).toBeLessThan(antes);
 await page.locator('#mapa').getByRole('button',{name:'Em execução'}).click();
 expect(await numero()).toBe(antes);
 // lista alternativa
 await page.locator('#mapa summary').click();
 await expect(page.locator('#mapa [data-mp-lista-corpo] tr')).toHaveCount(antes);
 // toque (monitor touch): abrir o resumo tocando no ícone
 const touch=await browser.newContext({hasTouch:true,viewport:{width:390,height:844}});
 const tp=await touch.newPage();
 await tp.route('https://tile.openstreetmap.org/**',r=>r.abort());
 await tp.goto('/plataforma/gestao/');
 await tp.locator('#mapa').scrollIntoViewIfNeeded();
 await tp.locator('#mapa .leaflet-marker-icon').first().tap();
 await expect(tp.locator('.leaflet-popup-content').getByRole('link',{name:'Abrir a ficha'})).toBeVisible();
 await tp.screenshot({path:'C:/Users/ANIEL_~1/AppData/Local/Temp/claude/4a02c2d203f7e454/dc8f7733-5c4f-49f8-90a6-ea4344865340/scratchpad/mapa-390.png'});
 await touch.close();
 // tela de localização: trocar para ruas e trechos, desenhar 2 pontos e salvar (simulação)
 await page.goto('/plataforma/projetos-localizacao/?id=P-905');
 await expect(page.locator('h1')).toHaveText('Localização e fotos');
 await expect(page.locator('#lp-enviar-fotos')).toBeDisabled();
 await page.screenshot({path:'C:/Users/ANIEL_~1/AppData/Local/Temp/claude/4a02c2d203f7e454/dc8f7733-5c4f-49f8-90a6-ea4344865340/scratchpad/localizacao-1280.png'});
 await page.getByRole('radio',{name:/Ruas e trechos/}).check();
 await page.getByLabel('Rua (obrigatório)').fill('Avenida Exemplo');
 await page.getByRole('button',{name:/Desenhar no mapa/}).click();
 const areaMapa=page.locator('#lp-loc [data-ed-mapa]');
 await areaMapa.click({position:{x:120,y:120}});
 await areaMapa.click({position:{x:260,y:180}});
 await expect(page.locator('#lp-loc .mp-pontos')).toHaveText('2 pontos');
 await page.getByRole('button',{name:'Salvar localização (simulação)'}).click();
 await expect(page.locator('[data-lp-ok]')).toBeVisible();
 await expect(page.locator('[data-lp-ok]')).toContainText('Modo simulação');
 // trecho sem rua não salva
 await page.getByLabel('Rua (obrigatório)').fill('');
 await page.getByRole('button',{name:'Salvar localização (simulação)'}).click();
 await expect(page.locator('#lp-loc [data-ed-erros]')).toContainText('informe o nome da rua');
 // a simulação aparece no mapa do painel (mesma aba)
 await page.goto('/plataforma/gestao/');
 await expect(page.locator('#mapa [data-mp-contagem]')).toContainText('obra');
 // sem rolagem horizontal e axe, claro e escuro
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  for(const caminho of ['/plataforma/gestao/','/plataforma/projetos-localizacao/?id=P-905']){
   await page.goto(caminho);
   await expect(page.locator('.leaflet-container').first()).toBeVisible();
   expect(await semRolagem(),`${caminho} ${width}px`).toBeTruthy();
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto('/plataforma/projetos-localizacao/?id=P-905');
 await expect(page.locator('#lp-loc .leaflet-container')).toBeVisible();
 await page.screenshot({path:'C:/Users/ANIEL_~1/AppData/Local/Temp/claude/4a02c2d203f7e454/dc8f7733-5c4f-49f8-90a6-ea4344865340/scratchpad/localizacao-390.png'});
 await page.setViewportSize({width:1280,height:900});
 for(const caminho of ['/plataforma/gestao/','/plataforma/projetos-localizacao/?id=P-905']){
  await page.goto(caminho);
  await expect(page.locator('.leaflet-container').first()).toBeVisible();
  for(const theme of ['light','dark']){
   await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);
   const results=await new AxeBuilder({page}).exclude('.leaflet-tile-pane').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`${caminho} ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);
  }
 }
});

test('govnexa: arquivos do build com nome só hexadecimal (a Vercel não serviu simulacao.mqF-P3E_.js)',async({page})=>{
 const {readdirSync}=await import('node:fs');
 const nomes=readdirSync('dist/_astro').filter(n=>/\.(js|css)$/.test(n));
 expect(nomes.length).toBeGreaterThan(0);
 expect(nomes.filter(n=>!/\.[0-9a-f]{8}\.(js|css)$/.test(n))).toEqual([]);
 // todo script e folha de estilo da página do mapa responde 200
 const falhas:string[]=[];
 page.on('response',r=>{if(r.url().includes('/_astro/')&&r.status()>=400)falhas.push(`${r.status()} ${r.url()}`)});
 await page.route('https://tile.openstreetmap.org/**',r=>r.abort());
 await page.goto('/plataforma/gestao/');
 await expect(page.locator('#mapa .leaflet-container')).toBeVisible();
 await expect(page.locator('#mapa .mp-filtros [data-mp-situacoes] button').first()).toBeVisible();
 expect(falhas).toEqual([]);
});

test('govnexa: WhatsApp da Gestão (simulação): números, permissão, prévia e perguntas',async({page})=>{
 const semRolagem=()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
 await page.setViewportSize({width:1280,height:900});
 const resp=await page.goto('/plataforma/gestao-whatsapp/');
 expect(resp?.status()).toBe(200);
 await expect(page.locator('h1')).toHaveText('WhatsApp');
 await expect(page.locator('.sidebar a[href="/plataforma/gestao-whatsapp/"]')).toHaveAttribute('aria-current','page');
 const linhas=page.locator('[data-wa-lista] tr');
 await expect(linhas).toHaveCount(3);
 await expect(linhas.first()).toContainText('+55 62 9••••-0001');
 await expect(page.locator('[data-wa-lista]')).not.toContainText('900000001');
 // prévia do gabinete: relatório com valores
 const conversa=page.locator('[data-wa-conversa]');
 await expect(conversa.locator('.wa-balao').first()).toContainText('GovNexa · Projetos prioritários');
 await expect(conversa.locator('.wa-balao strong').first()).toHaveText('GovNexa · Projetos prioritários');
 // pergunta pronta e pergunta digitada
 await page.getByRole('button',{name:'ajuda',exact:true}).click();
 await expect(conversa.locator('.wa-balao-sistema').last()).toContainText('O que posso responder');
 await page.getByLabel('Mensagem').fill('P-905');
 await page.getByRole('button',{name:'Enviar',exact:true}).click();
 await expect(conversa.locator('.wa-balao-contato').last()).toHaveText(/P-905/);
 await expect(conversa.locator('.wa-balao-sistema').last()).toContainText('Código no GovNexa: P-905');
 // secretaria da SEINFRA não vê projeto de outro órgão (mesma resposta de inexistente)
 await page.getByLabel('Ver como').selectOption({label:'Secretaria de Infraestrutura (exemplo)'});
 await page.getByLabel('Mensagem').fill('P-901');
 await page.getByRole('button',{name:'Enviar',exact:true}).click();
 await expect(conversa.locator('.wa-balao-sistema').last()).toContainText('Não encontrei esse projeto entre os que você pode consultar');
 // captação sem permissão
 await page.getByRole('button',{name:'Como estão os convênios?',exact:true}).click();
 await expect(conversa.locator('.wa-balao-sistema').last()).toContainText('não tem permissão para consultar a captação');
 // cadastro: erro claro e depois sucesso
 await page.getByRole('button',{name:'Adicionar número'}).click();
 await page.getByLabel('Quem é (cargo ou equipe, sem nome de pessoa)').fill('Equipe da SME (teste)');
 await page.getByLabel('Número do WhatsApp (com DDD)').fill('(62) 3333-4444');
 await page.getByRole('button',{name:'Salvar (simulação)'}).click();
 await expect(page.locator('[data-wa-erros]')).toContainText('Número de celular inválido');
 await page.getByLabel('Número do WhatsApp (com DDD)').fill('(62) 9 9876-5432');
 await page.getByRole('button',{name:'Salvar (simulação)'}).click();
 await expect(page.locator('[data-wa-status]')).toContainText('Salvo em simulação');
 await expect(linhas).toHaveCount(4);
 await expect(linhas.nth(3)).toContainText('+55 62 9••••-5432');
 await expect(page.getByLabel('Ver como')).toHaveValue(/^num-/);
 // continua depois de recarregar (mesma aba)
 await page.reload();
 await expect(linhas).toHaveCount(4);
 // nada vai para fora: nenhuma requisição a outro domínio
 const externas:string[]=[];
 page.on('request',r=>{const u=new URL(r.url());if(!['127.0.0.1','localhost'].includes(u.hostname))externas.push(r.url())});
 await page.getByRole('button',{name:'Relatório',exact:true}).click();
 expect(externas).toEqual([]);
 // sem rolagem horizontal e acessibilidade, claro e escuro, 1280 e 390
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  await page.goto('/plataforma/gestao-whatsapp/');
  await expect(linhas.first()).toBeVisible();
  expect(await semRolagem(),`${width}px`).toBeTruthy();
  for(const theme of ['light','dark']){
   await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);
   const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`${width} ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);
  }
 }
});
