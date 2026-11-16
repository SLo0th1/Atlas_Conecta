import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import carteiraExemplo from '../data/exemplo/carteira/carteira.json' with {type:'json'};
import cronogramasExemplo from '../data/exemplo/cronogramas/cronogramas.json' with {type:'json'};

const URL_ALERTAS='/plataforma/gestao-alertas/';

test('govnexa: Gestão › Alertas: resumo, filtros sem recarregar, sem fonte e sem nomes de pessoas',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 const resp=await page.goto(URL_ALERTAS);
 expect(resp?.status()).toBe(200);
 await expect(page.locator('h1')).toHaveText('Alertas');
 await expect(page.locator(`.sidebar a[href="${URL_ALERTAS}"]`)).toHaveAttribute('aria-current','page');
 const itens=page.locator('[data-al-item]');
 const visiveis=page.locator('[data-al-item]:visible');
 const total=await itens.count();
 expect(total).toBeGreaterThan(0);
 const contagem=page.locator('[data-al-contagem]');
 await expect(contagem).toHaveText(`Mostrando ${total} de ${total}.`);
 // vermelho vem antes de amarelo
 const gravidades=await itens.evaluateAll(l=>l.map(e=>(e as HTMLElement).dataset.gravidade));
 const primeiroAmarelo=gravidades.indexOf('amarelo');
 if(primeiroAmarelo>=0)expect(gravidades.slice(primeiroAmarelo).every(g=>g==='amarelo')).toBeTruthy();
 // cada alerta tem gravidade escrita, ação recomendada e link para a tela de origem
 const primeiro=itens.first();
 await expect(primeiro.locator('.al-grav')).toHaveText(/Vermelho|Amarelo/);
 await expect(primeiro.locator('.al-acao')).toContainText('O que fazer:');
 await expect(primeiro.locator('.al-link a')).toHaveAttribute('href',/^\/plataforma\//);
 // marcador para garantir que os filtros não recarregam a página
 await page.evaluate(()=>{(window as unknown as {semRecarregar:boolean}).semRecarregar=true});
 // filtro de gravidade
 const gravidade=page.locator('[data-al-filtros]').getByLabel('Gravidade',{exact:true});
 await gravidade.selectOption('vermelho');
 const nVermelho=await visiveis.count();
 for(const li of await visiveis.all())await expect(li).toHaveAttribute('data-gravidade','vermelho');
 await expect(contagem).toHaveText(`Mostrando ${nVermelho} de ${total}.`);
 await gravidade.selectOption('');
 // filtro de tipo
 const tipo=page.locator('[data-al-filtros]').getByLabel('Tipo',{exact:true});
 const tipos=await tipo.locator('option').evaluateAll(l=>l.map(o=>(o as HTMLOptionElement).value).filter(Boolean));
 expect(tipos.length).toBeGreaterThan(0);
 await tipo.selectOption(tipos[0]);
 for(const li of await visiveis.all())await expect(li).toHaveAttribute('data-tipo',tipos[0]);
 expect(await visiveis.count()).toBeGreaterThan(0);
 // filtro de órgão (combinado com o tipo); depois limpar
 await tipo.selectOption('');
 const orgao=page.locator('[data-al-filtros]').getByLabel('Órgão',{exact:true});
 const orgaos=await orgao.locator('option').evaluateAll(l=>l.map(o=>(o as HTMLOptionElement).value).filter(Boolean));
 await orgao.selectOption(orgaos[0]);
 expect(await visiveis.count()).toBeGreaterThan(0);
 for(const li of await visiveis.all())await expect(li).toHaveAttribute('data-orgao',orgaos[0]);
 await page.getByRole('button',{name:'Limpar filtros'}).click();
 await expect(contagem).toHaveText(`Mostrando ${total} de ${total}.`);
 // cartão do resumo filtra por tipo e marca o botão; clicar de novo desfaz
 const cartao=page.locator(`[data-al-cartao="${tipos[0]}"]`);
 await cartao.click();
 await expect(cartao).toHaveAttribute('aria-pressed','true');
 await expect(tipo).toHaveValue(tipos[0]);
 for(const li of await visiveis.all())await expect(li).toHaveAttribute('data-tipo',tipos[0]);
 await cartao.click();
 await expect(cartao).toHaveAttribute('aria-pressed','false');
 await expect(contagem).toHaveText(`Mostrando ${total} de ${total}.`);
 expect(await page.evaluate(()=>(window as unknown as {semRecarregar?:boolean}).semRecarregar)).toBe(true);
 // seção do que ainda não tem fonte
 const semFonte=page.locator('[data-al-semfonte]');
 await expect(page.getByRole('heading',{name:'Ainda sem fonte de dados'})).toBeVisible();
 await expect(semFonte).toContainText('Edital na praça');
 await expect(semFonte).toContainText('Prazos da Lei 14.133 por licitação');
 // nenhum nome de pessoa (responsáveis dos dados de exemplo)
 const nomes=new Set<string>();
 for(const p of carteiraExemplo.projetos as {responsavel:string|null;atualizacao:{responsavel:string|null}}[]){if(p.responsavel)nomes.add(p.responsavel);if(p.atualizacao.responsavel)nomes.add(p.atualizacao.responsavel);}
 for(const c of cronogramasExemplo.cronogramas as {fases:{etapas:{responsavel:string|null}[]}[]}[])for(const f of c.fases)for(const e of f.etapas)if(e.responsavel)nomes.add(e.responsavel);
 const texto=await page.locator('[data-alertas]').innerText();
 for(const n of nomes)expect(texto,`nome apareceu: ${n}`).not.toContain(n);
});

test('govnexa: Gestão › Alertas sem rolagem horizontal e acessível (claro e escuro, 1280 e 390)',async({page})=>{
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  await page.goto(URL_ALERTAS);
  await expect(page.locator('[data-al-item]').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px`).toBeTruthy();
  for(const theme of ['light','dark']){
   await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);
   const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   expect(results.violations.filter(v=>['serious','critical'].includes(v.impact||'')),`${width} ${theme}: ${JSON.stringify(results.violations)}`).toEqual([]);
  }
 }
});
