import { expect, test } from '@playwright/test';

test('head has title, description, absolute og:image, favicon', async ({ page }) => {
  await page.goto('/');
  expect((await page.title()).length).toBeGreaterThan(0);
  const description = await page.locator('meta[name=description]').getAttribute('content');
  expect(description?.length ?? 0).toBeGreaterThan(0);
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(ogImage).toMatch(/^https?:\/\//);
  await expect(page.locator('link[rel=icon]')).toHaveCount(1);
});

test('no third-party requests', async ({ page, baseURL }) => {
  const hosts = new Set<string>();
  // The deployment under test (preview host when PLAYWRIGHT_BASE_URL is set) is first-party.
  const allowed = ['localhost', '127.0.0.1', ...(baseURL ? [new URL(baseURL).hostname] : [])];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.protocol.startsWith('http')) hosts.add(url.hostname);
  });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');
  for (const host of hosts) expect(allowed).toContain(host);
});
