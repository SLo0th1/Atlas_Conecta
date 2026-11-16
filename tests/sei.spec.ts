import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const URL_TELA='/plataforma/projetos-sei/';
const LINK='https://sei.goiania.go.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?AbCdEfGhIjKlMnOpQrSt_uv-WX0123456789';
const semRolagem=(page:import('@playwright/test').Page)=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);

test('sei: exemplo fictício mostra marcos, onde está e a proposta de etapa',async({page})=>{
 await page.goto(URL_TELA);
 const ex=page.locator('[data-sei-exemplo]');
 await expect(ex.getByRole('heading',{name:'Exemplo de leitura (processo fictício)'})).toBeVisible();
 await expect(ex.locator('[data-sei-marco="edital"]')).toBeVisible();
 await expect(ex.locator('[data-sei-marco="contrato"]')).toHaveCount(0);
 await expect(ex.locator('[data-sei-sugestao]')).toContainText('avançar para 03 – Contratação');
 await expect(ex.locator('[data-sei-dias]')).toHaveText(/^\d+$/);
 await expect(ex).not.toContainText('Pessoa Fictícia');
});

test('sei: guardar link válido, recusar inválido e remover',async({page})=>{
 await page.goto(URL_TELA);
 const form=page.locator('[data-sei-form]');
 const primeiro=await form.locator('select[name=projeto] option').nth(1).getAttribute('value');
 expect(primeiro).toMatch(/^P-/);
 await form.locator('select[name=projeto]').selectOption(primeiro!);
 await form.locator('input[name=link]').fill('https://outro.site/sei/modulos/pesquisa/md_pesq_processo_exibir.php?AbCdEfGhIjKlMnOpQrSt');
 await form.getByRole('button',{name:'Guardar link'}).click();
 await expect(page.locator('[data-sei-erro]')).toContainText('SEI da prefeitura');
 await form.locator('select[name=projeto]').selectOption(primeiro!);
 await form.locator('input[name=link]').fill(LINK);
 await form.getByRole('button',{name:'Guardar link'}).click();
 await expect(page.locator('[data-sei-status]')).toContainText('Link guardado');
 const linha=page.locator(`[data-sei-projeto="${primeiro}"]`);
 await expect(linha).toContainText('processo AbCdEf…');
 await expect(linha).not.toContainText('0123456789');
 await expect(page.locator('[data-sei-contagem]')).toHaveText('1 link colado nesta aba.');
 await page.reload();
 await expect(linha).toContainText('processo AbCdEf…');
 await linha.getByRole('button',{name:/Remover o link/}).click();
 await expect(linha).toContainText('Sem link');
 await expect(page.locator('[data-sei-contagem]')).toHaveText('Nenhum link colado nesta aba.');
});

test('sei: link adulterado no navegador é descartado ao ler',async({page})=>{
 await page.goto(URL_TELA);
 const id=await page.locator('[data-sei-projeto]').first().getAttribute('data-sei-projeto');
 await page.evaluate(([i])=>sessionStorage.setItem('govnexa-sei-simulacao','{"'+i+'":"javascript:alert(1)","__proto__":{"P-1":"x"},"P-naoexiste":"https://sei.goiania.go.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?AbCdEfGhIjKlMnOpQrSt_uv-WX0123456789"}'),[id]);
 await page.reload();
 await expect(page.locator(`[data-sei-projeto="${id}"]`)).toContainText('Sem link');
 await expect(page.locator('[data-sei-contagem]')).toHaveText('Nenhum link colado nesta aba.');
});

test('sei: filtro, sem rolagem horizontal e axe nos temas claro e escuro',async({page})=>{
 await page.goto(URL_TELA);
 const linhas=page.locator('[data-sei-projeto]');
 const total=await linhas.count();
 expect(total).toBeGreaterThan(0);
 await page.locator('[data-sei-filtro]').fill('zzzz-nada-casa');
 await expect(page.locator('[data-sei-projeto]:visible')).toHaveCount(0);
 await page.locator('[data-sei-filtro]').fill('');
 await expect(page.locator('[data-sei-projeto]:visible')).toHaveCount(total);
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  await page.goto(URL_TELA);
  await page.locator('details.sei-bloco summary').click();
  expect(await semRolagem(page),`${width}px`).toBeTruthy();
 }
 await page.setViewportSize({width:1280,height:900});
 await page.goto(URL_TELA);
 await page.locator('details.sei-bloco summary').click();
 for(const theme of ['light','dark']){
  await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);
 }
});
