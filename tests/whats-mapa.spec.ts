import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const semRolagem=(page:import('@playwright/test').Page)=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
const TELAS=['/plataforma/gestao-whatsapp/','/plataforma/projetos-localizacao/'];

test('whatsapp: modelos para aprovação da Meta com prévia preenchida',async({page})=>{
 await page.goto('/plataforma/gestao-whatsapp/');
 const secao=page.locator('[data-wa-modelos]');
 await expect(secao.getByRole('heading',{name:'Modelos para aprovação da Meta'})).toBeVisible();
 await expect(secao.locator('[data-wa-modelo]')).toHaveCount(3);
 await expect(secao.locator('.wa-modelo-previa').first()).toContainText('relatório semanal do GovNexa (16/11/2026)');
 for(const t of await secao.locator('.wa-modelo-previa').allTextContents())expect(t).not.toMatch(/\{\{/);
 await expect(secao.getByRole('button',{name:/Copiar texto/})).toHaveCount(3);
});

test('mapa: obras sem localização abrem e levam ao cadastro com ?id=',async({page})=>{
 await page.goto('/plataforma/projetos-localizacao/');
 const det=page.locator('[data-lp-pendentes]');
 await expect(det.locator('summary')).toContainText('Obras que ainda não aparecem no mapa (');
 await det.locator('summary').click();
 const link=det.getByRole('link',{name:/Cadastrar localização de/}).first();
 await expect(link).toBeVisible();
 await expect(link).toHaveAttribute('href',/\/plataforma\/projetos-localizacao\/\?id=P-/);
});

test('whatsapp e mapa: sem rolagem horizontal e axe nos temas claro e escuro',async({page})=>{
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  for(const caminho of TELAS){
   await page.goto(caminho);
   if(caminho.includes('localizacao'))await page.locator('[data-lp-pendentes] summary').click();
   expect(await semRolagem(page),`${caminho} ${width}px`).toBeTruthy();
  }
 }
 await page.setViewportSize({width:1280,height:900});
 for(const caminho of TELAS){
  await page.goto(caminho);
  if(caminho.includes('localizacao'))await page.locator('[data-lp-pendentes] summary').click();
  for(const theme of ['light','dark']){
   await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);
   const results=await new AxeBuilder({page}).exclude('.leaflet-tile-pane').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`${caminho} ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);
  }
 }
});
