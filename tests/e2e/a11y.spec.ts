import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`no axe violations in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Decorative mock screens inside the journey are aria-hidden by design.
    const results = await new AxeBuilder({ page }).exclude('#journey [aria-hidden=true]').analyze();
    expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
  });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`no axe violations at 390px after the journey hydrates in ${scheme} mode`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    await page.locator('#journey').evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await expect(page.locator('#journey astro-island:not([ssr])')).toHaveCount(1);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).exclude('#journey [aria-hidden=true]').analyze();
    expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
  });
}
