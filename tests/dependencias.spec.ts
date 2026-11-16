// Tela: dependências entre etapas e atraso em cascata na página do cronograma (dados fictícios de data/exemplo).
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import cronogramasExemplo from '../data/exemplo/cronogramas/cronogramas.json' with { type: 'json' };

const id = cronogramasExemplo.cronogramas[0].id;
const pagina = `/plataforma/cronograma/${id}/`;

test('cronograma: resumo do atraso em cascata e aba Dependências', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const resposta = await page.goto(pagina);
  expect(resposta?.status()).toBe(200);
  await expect(page.locator('[data-cr-cascata]')).toContainText('Atraso em cascata');
  const aba = page.getByRole('button', { name: 'Dependências', exact: true });
  await aba.click();
  await expect(aba).toHaveAttribute('aria-pressed', 'true');
  const painel = page.locator('[data-cr-painel="dependencias"]');
  await expect(painel).toBeVisible();
  await expect(page.locator('[data-cr-painel="tempo"]')).toBeHidden();
  // Toda etapa do cronograma aparece, e todas menos a primeira dizem de quem dependem.
  const total = cronogramasExemplo.cronogramas[0].fases.reduce((s, f) => s + f.etapas.length, 0);
  await expect(painel.locator('.dp-item')).toHaveCount(total);
  await expect(painel.locator('.dp-item').first()).toContainText('Não depende de outra etapa');
  await expect(painel.getByText(/^Depende de:/)).toHaveCount(total - 1);
  // Exemplo A tem etapas abertas: há selo de "Aguardando" com texto (não só cor).
  expect(await painel.locator('[data-dp-aguardando]').count()).toBeGreaterThan(0);
  await expect(painel.locator('[data-dp-aguardando]').first()).toContainText(/aguardando: \S/i);
});

test('onde está parado continua abrindo com a contagem de etapas seguintes', async ({ page }) => {
  const resposta = await page.goto('/plataforma/projetos-parado/');
  expect(resposta?.status()).toBe(200);
  await expect(page.locator('[data-pr-travadas]').first()).toContainText(/seguram \d+ etapas? seguintes?/);
});

for (const largura of [1280, 390]) {
  test(`cronograma sem rolagem horizontal em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 });
    for (const caminho of [pagina, '/plataforma/projetos-parado/']) {
      await page.goto(caminho);
      if (caminho === pagina) await page.getByRole('button', { name: 'Dependências', exact: true }).click();
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(sobra, `${caminho} em ${largura}px`).toBeLessThanOrEqual(0);
    }
  });
}

for (const tema of ['light', 'dark']) {
  test(`axe na aba Dependências, tema ${tema}`, async ({ page }) => {
    await page.goto(pagina);
    await page.getByRole('button', { name: 'Dependências', exact: true }).click();
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.filter((v) => ['serious', 'critical'].includes(v.impact || '')), JSON.stringify(r.violations)).toEqual([]);
  });
}
