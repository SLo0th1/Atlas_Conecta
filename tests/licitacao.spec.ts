import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {paginaExemplo} from '../src/lib/sei/exemplo.ts';

const TELA='/plataforma/licitacoes-detalhe/';
const semRolagem=(page:import('@playwright/test').Page)=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
// Página salva do SEI (ISO-8859-1), com o número de um projeto da carteira de exemplo
const arquivoSei=(numero='26.18.000001001-1')=>Buffer.from(paginaExemplo().replace('99.9.000000123-4',numero),'latin1');

test('licitação em detalhe: exemplo fictício com fases, fase atual e prazos',async({page})=>{
 await page.goto(TELA);
 const r=page.locator('[data-ld-resultado]');
 await expect(r.getByRole('heading',{name:'Processo 99.9.000000123-4'})).toBeVisible();
 await expect(r.locator('[data-ld-fase="demanda"]')).toContainText('em 01/07/2026');
 await expect(r.locator('[data-ld-fase="homologacao"]')).toContainText('Fase atual');
 await expect(r.locator('[data-ld-fase="contrato"]')).toContainText('A fazer');
 await expect(r.locator('[data-ld-prazo="publicidade"]')).toContainText('Dentro do prazo');
 await page.locator('[data-ld-piso]').selectOption('publicidade_integrada');
 await expect(r.locator('[data-ld-prazo="publicidade"]')).toContainText('Alerta');
 await expect(page.locator('[data-ld-remover]')).toBeDisabled();
});

test('licitação em detalhe: carregar a página salva, ligar ao projeto, lembrar e remover',async({page})=>{
 await page.goto(TELA);
 await page.locator('[data-ld-arquivo]').setInputFiles({name:'processo.html',mimeType:'text/html',buffer:arquivoSei()});
 await expect(page.locator('[data-ld-status]')).toContainText('Processo 26.18.000001001-1 carregado');
 const r=page.locator('[data-ld-resultado]');
 await expect(r.getByRole('heading',{name:'Processo 26.18.000001001-1'})).toBeVisible();
 await expect(r.getByRole('link',{name:'Ponte Exemplo B'})).toHaveAttribute('href','/plataforma/projetos-carteira/?q=P-901');
 await expect(r).not.toContainText('Pessoa Fictícia');
 await page.reload();
 await expect(page.locator('[data-ld-lista]')).toHaveValue('0');
 await expect(r.getByRole('heading',{name:'Processo 26.18.000001001-1'})).toBeVisible();
 // o mesmo processo de novo substitui, não duplica
 await page.locator('[data-ld-arquivo]').setInputFiles({name:'processo.html',mimeType:'text/html',buffer:arquivoSei()});
 await expect(page.locator('[data-ld-lista] option')).toHaveCount(2);
 await page.getByRole('button',{name:'Remover esta licitação'}).click();
 await expect(page.locator('[data-ld-lista] option')).toHaveCount(1);
 await expect(r.getByRole('heading',{name:'Processo 99.9.000000123-4'})).toBeVisible();
});

test('licitação em detalhe: arquivo errado é recusado com explicação',async({page})=>{
 await page.goto(TELA);
 await page.locator('[data-ld-arquivo]').setInputFiles({name:'x.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7 teste')});
 await expect(page.locator('[data-ld-erro]')).toContainText('PDF');
 await page.locator('[data-ld-arquivo]').setInputFiles({name:'pesquisa.html',mimeType:'text/html',buffer:Buffer.from('<html><body><form>captcha</form></body></html>')});
 await expect(page.locator('[data-ld-erro]')).toContainText('não traz a página de um processo');
 await expect(page.locator('[data-ld-lista] option')).toHaveCount(1);
});

test('licitação em detalhe: dado adulterado na aba é descartado',async({page})=>{
 await page.goto(TELA);
 await page.evaluate(()=>sessionStorage.setItem('govnexa-licitacoes-simulacao',JSON.stringify([{numero:'<img src=x onerror=alert(1)>',tipo:null,geradoEm:null,totalDocumentos:null,totalAndamentos:null,documentos:[{numero:'1',tipo:'a',data:null,unidade:'u',publico:true}],andamentos:[]},'lixo'])));
 await page.reload();
 await expect(page.locator('[data-ld-lista] option')).toHaveCount(1);
});

test('licitação em detalhe: sem rolagem horizontal e axe nos temas claro e escuro',async({page})=>{
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  await page.goto(TELA);
  await expect(page.locator('[data-ld-fase="demanda"]')).toBeVisible();
  expect(await semRolagem(page),`${width}px`).toBeTruthy();
 }
 await page.setViewportSize({width:1280,height:900});
 await page.goto(TELA);
 await expect(page.locator('[data-ld-fase="demanda"]')).toBeVisible();
 for(const theme of ['light','dark']){
  await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);
  const res=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(res.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`${theme}: ${JSON.stringify(res.violations)}`).toEqual([]);
 }
});
