import { expect, test } from '@playwright/test';
import { INSTALL_NPX, LINKS, hero } from '../../src/content/site';

test('hero h1 is the headline and is the only h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(hero.headline);
});

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`install command visible without scrolling at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const command = page.locator('#hero').getByText(INSTALL_NPX, { exact: true });
    await expect(command).toBeVisible();
    await expect(command).toBeInViewport({ ratio: 1 });
  });
}

test('no horizontal scroll at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('page has the trust, agents and install sections', async ({ page }) => {
  await page.goto('/');
  for (const id of ['trust', 'agents', 'install']) {
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  }
});

test('footer links to GitHub, npm and the licence', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  for (const href of [LINKS.github, LINKS.npm, LINKS.license]) {
    await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
});
