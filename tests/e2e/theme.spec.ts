import { expect, test } from '@playwright/test';

// The site is violet, but the journey's app window must keep the app's zinc palette so the mock
// still looks like the real product.
const expected = {
  light: {
    sitePrimary: 'oklch(0.541 0.281 293.009)',
    appPrimary: 'oklch(0.21 0.006 285.885)',
    appBackground: 'oklch(1 0 0)',
  },
  dark: {
    sitePrimary: 'oklch(0.702 0.183 293.541)',
    appPrimary: 'oklch(0.92 0.004 286.32)',
    appBackground: 'oklch(0.141 0.005 285.823)',
  },
} as const;

// The build minifies colours ("oklch(21% .006 285.885)"), so compare the channel numbers, not the text.
function channels(value: string): number[] {
  const inner = value.trim().replace(/^oklch\(/, '').replace(/\)$/, '');
  return inner
    .split(/\s+/)
    .map((part) => (part.endsWith('%') ? parseFloat(part) / 100 : parseFloat(part)))
    .map((n) => Math.round(n * 10000) / 10000);
}

for (const scheme of ['light', 'dark'] as const) {
  test(`site is violet and the app window stays zinc in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const token = async (selector: string, name: string) =>
      channels(
        await page.locator(selector).first().evaluate((el, n) => getComputedStyle(el).getPropertyValue(n), name),
      );

    expect(await token('html', '--primary')).toEqual(channels(expected[scheme].sitePrimary));
    const appWindow = '#journey [data-active-screen] > div';
    expect(await token(appWindow, '--primary')).toEqual(channels(expected[scheme].appPrimary));
    expect(await token(appWindow, '--background')).toEqual(channels(expected[scheme].appBackground));
  });
}
