import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TELA='/plataforma/projetos-fluxo/';
const larguraSvg=(page:import('@playwright/test').Page)=>page.locator('.fx-svg').first().evaluate(e=>Math.round(e.getBoundingClientRect().width));
const semRolagem=(page:import('@playwright/test').Page)=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);

test('fluxo: zoom começa em 100%, aumenta, diminui, ajusta e é lembrado',async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 await page.goto(TELA);
 const valor=page.locator('[data-fx-zoom-valor]');
 await expect(valor).toHaveText('100%');
 expect(await larguraSvg(page)).toBe(1000);
 await page.getByRole('button',{name:'Aumentar o zoom'}).click();
 await expect(valor).toHaveText('110%');
 expect(await larguraSvg(page)).toBe(1100);
 expect(await semRolagem(page)).toBeTruthy(); // rola dentro do quadro, não a página
 await page.reload();
 await expect(valor).toHaveText('110%');
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Diminuir o zoom'}).click();
 await expect(valor).toHaveText('80%');
 expect(await larguraSvg(page)).toBe(800);
 await page.getByRole('button',{name:'Ajustar à tela'}).click();
 const caixa=await page.locator('[data-fx-quadro]').evaluate(e=>e.clientWidth);
 expect(Math.abs(await larguraSvg(page)-caixa)).toBeLessThanOrEqual(1);
 await page.getByRole('button',{name:'Tamanho padrão'}).click();
 await expect(valor).toHaveText('100%');
 for(let i=0;i<10;i++)await page.getByRole('button',{name:'Diminuir o zoom'}).click({force:true});
 await expect(valor).toHaveText('50%');
 await expect(page.getByRole('button',{name:'Diminuir o zoom'})).toBeDisabled();
});

test('fluxo: no celular começa ajustado à tela e o zoom não cria rolagem lateral da página',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto(TELA);
 const caixa=await page.locator('[data-fx-quadro]').evaluate(e=>e.clientWidth);
 expect(Math.abs(await larguraSvg(page)-caixa)).toBeLessThanOrEqual(1);
 expect(await semRolagem(page)).toBeTruthy();
 await page.getByRole('button',{name:'Aumentar o zoom'}).click();
 expect(await larguraSvg(page)).toBeGreaterThan(caixa);
 expect(await semRolagem(page)).toBeTruthy();
});

test('fluxo: barra de zoom acessível nos temas claro e escuro',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 await page.goto(TELA);
 for(const theme of ['light','dark']){
  await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);
  const r=await new AxeBuilder({page}).include('[data-fx-zoom]').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(r.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`${theme}: ${JSON.stringify(r.violations)}`).toEqual([]);
 }
});

test('fluxo: legenda e fluxos detalhados começam recolhidos e abrem com um clique',async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 await page.goto(TELA);
 const leg=page.locator('details.fx-legenda');
 await expect(leg).not.toHaveAttribute('open','');
 await expect(page.getByText('Borda contínua verde: disponível')).toBeHidden();
 await leg.locator('summary').click();
 await expect(page.getByText('Borda contínua verde: disponível')).toBeVisible();
 // o diagrama aparece sem rolar a página numa tela comum
 const topo=await page.locator('[data-fx-quadro]').evaluate(e=>e.getBoundingClientRect().top);
 expect(topo).toBeLessThan(900);
});

test('fluxo: zoom alto rola dentro do quadro; preferência adulterada é ignorada; impressão abre as seções',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 await page.goto(TELA);
 await page.evaluate(()=>localStorage.setItem('govnexa-fluxo-zoom','0.3'));
 await page.reload();
 const caixa=await page.locator('[data-fx-quadro]').evaluate(e=>e.clientWidth);
 expect(Math.abs(await larguraSvg(page)-caixa)).toBeLessThanOrEqual(1); // valor inválido: volta ao padrão (ajustar, pois o quadro tem menos de 1000 px)
 for(let i=0;i<12;i++)await page.getByRole('button',{name:'Aumentar o zoom'}).click({force:true});
 await expect(page.locator('[data-fx-zoom-valor]')).toHaveText('200%');
 const q=await page.locator('[data-fx-quadro]').evaluate(e=>({sw:e.scrollWidth,cw:e.clientWidth}));
 expect(q.sw).toBeGreaterThan(q.cw);
 expect(await semRolagem(page)).toBeTruthy();
 await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
 await expect(page.locator('details.fx-legenda')).toHaveAttribute('open','');
 await expect(page.locator('details.fx-subs')).toHaveAttribute('open','');
 await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 await expect(page.locator('details.fx-legenda')).not.toHaveAttribute('open','');
});

test('fluxo detalhado também tem zoom',async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 await page.goto(TELA);
 const link=await page.locator('.fx-subs a').first().getAttribute('href');
 await page.goto(link!);
 await expect(page.locator('[data-fx-zoom-valor]')).toHaveText(/^\d+%$/);
 const antes=await larguraSvg(page);
 await page.getByRole('button',{name:'Aumentar o zoom'}).click();
 expect(await larguraSvg(page)).toBeGreaterThan(antes);
});
