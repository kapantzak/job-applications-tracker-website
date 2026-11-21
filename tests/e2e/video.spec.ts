import { expect, test } from '@playwright/test';

test('demo video is lazy, muted, has controls and reserves its box', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (req) => requested.push(new URL(req.url()).pathname));
  const posterResponse = page.waitForResponse((r) => new URL(r.url()).pathname === '/media/demo-poster.png');
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');

  const poster = await posterResponse;
  expect(poster.status()).toBe(200);
  expect(poster.headers()['content-type']).toBe('image/png');

  const video = page.locator('#video video');
  await expect(video).toHaveAttribute('aria-label', /walk-through/);
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).toHaveAttribute('poster', '/media/demo-poster.png');
  await expect(video).toHaveAttribute('width', '1440');
  await expect(video).toHaveAttribute('height', '900');
  for (const attr of ['controls', 'muted', 'playsinline']) {
    expect(await video.evaluate((el, a) => el.hasAttribute(a), attr)).toBe(true);
  }
  expect(requested).not.toContain('/media/demo.mp4');
});

test('og.png is served as an image', async ({ request }) => {
  const res = await request.get('/og.png');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('image/png');
});
