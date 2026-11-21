import { expect, test, type Page } from '@playwright/test';
import { INSTALL_NPX, faq, hero, journeySteps } from '../../src/content/site';

const DESKTOP = { width: 1280, height: 800 };
const NARROW = { width: 390, height: 844 };

const mock = (page: Page) => page.locator('#journey [data-active-screen]');
const tabs = (page: Page) => page.locator('#journey [role="tab"]');

/** client:visible hydrates once the island is on screen; Astro drops `ssr` when it has. */
async function hydrate(page: Page) {
  await page.locator('#journey').evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await expect(page.locator('#journey astro-island:not([ssr])')).toHaveCount(1);
}

async function centreStep(page: Page, id: string) {
  await page
    .locator(`[data-journey-step="${id}"]`)
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}

/** The desktop step block that contains the vertical centre of the viewport. */
function stepAtViewportCentre(page: Page) {
  return page.evaluate(() => {
    const y = window.innerHeight / 2;
    const block = [...document.querySelectorAll<HTMLElement>('[data-journey-step]')].find((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= y && r.bottom > y;
    });
    return block?.dataset.journeyStep ?? null;
  });
}

test.describe('desktop', () => {
  test.use({ viewport: DESKTOP });

  test('desktop scroll advances steps', async ({ page }) => {
    await page.goto('/');
    await hydrate(page);
    await centreStep(page, 'review');
    await expect(mock(page)).toHaveAttribute('data-active-screen', 'review');
    await expect(page.locator('[data-journey-step="review"]')).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('[data-journey-step][aria-current="step"]')).toHaveCount(1);
  });

  test('reverse scroll goes back', async ({ page }) => {
    await page.goto('/');
    await hydrate(page);
    await centreStep(page, 'review');
    await expect(mock(page)).toHaveAttribute('data-active-screen', 'review');
    await centreStep(page, 'jobs');
    await expect(mock(page)).toHaveAttribute('data-active-screen', 'jobs');
    await expect(page.locator('[data-journey-step="jobs"]')).toHaveAttribute('aria-current', 'step');
  });

  test('load mid-journey', async ({ page }) => {
    await page.goto('/');
    await hydrate(page);
    await centreStep(page, 'dashboard');
    await expect(mock(page)).toHaveAttribute('data-active-screen', 'dashboard');
    await page.reload();
    await expect(page.locator('#journey astro-island:not([ssr])')).toHaveCount(1);
    expect(await stepAtViewportCentre(page)).toBe('dashboard');
    await expect(mock(page)).toHaveAttribute('data-active-screen', 'dashboard');
  });
});

test.describe('narrow', () => {
  test.use({ viewport: NARROW });

  test('narrow autoplay', async ({ page }) => {
    await page.goto('/');
    await hydrate(page);
    await expect(tabs(page).first()).toHaveAttribute('aria-selected', 'true');
    await page.waitForTimeout(6500);
    await expect(tabs(page).first()).toHaveAttribute('aria-selected', 'false', { timeout: 1000 });
  });

  test('narrow tab tap stops autoplay', async ({ page }) => {
    await page.goto('/');
    await hydrate(page);
    await tabs(page).nth(3).click();
    await expect(mock(page)).toHaveAttribute('data-active-screen', 'review');
    await expect(tabs(page).nth(3)).toHaveAttribute('aria-selected', 'true');
    await page.waitForTimeout(7000);
    await expect(mock(page)).toHaveAttribute('data-active-screen', 'review');
    await expect(tabs(page).nth(3)).toHaveAttribute('aria-selected', 'true');
  });

  test('reduced motion narrow', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await hydrate(page);
    await page.waitForTimeout(8000);
    await expect(tabs(page).first()).toHaveAttribute('aria-selected', 'true');
    await expect(mock(page)).toHaveAttribute('data-active-screen', 'cv');
  });
});

for (const viewport of [DESKTOP, NARROW]) {
  test(`no layout shift across hydration at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    // Registered before any page script, so shifts from the island's hydration are counted.
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!entry.hadRecentInput) w.__cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('/');
    await page.waitForLoadState('load');
    // Scrolling moves content without producing layout-shift entries; it only triggers client:visible.
    await hydrate(page);
    await page.waitForTimeout(1000);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThan(0.1);
  });
}

test('crossing the breakpoint', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  await hydrate(page);
  await centreStep(page, 'apply');
  await expect(mock(page)).toHaveAttribute('data-active-screen', 'apply');

  await page.setViewportSize(NARROW);
  await expect(page.locator('#journey [role="tablist"]')).toBeVisible();
  await expect(page.locator('#journey [role="tab"][aria-selected="true"]')).toHaveCount(1);
  await expect
    .poll(async () => {
      const selected = await tabs(page).evaluateAll((els) =>
        els.findIndex((el) => el.getAttribute('aria-selected') === 'true'),
      );
      return (await mock(page).getAttribute('data-active-screen')) === journeySteps[selected]?.id;
    })
    .toBe(true);

  await page.setViewportSize(DESKTOP);
  await expect(page.locator('[data-journey-step]').first()).toBeVisible();
  await expect(page.locator('#journey [role="tablist"]')).toBeHidden();
  await expect
    .poll(async () => {
      const centre = await stepAtViewportCentre(page);
      return centre !== null && centre === (await mock(page).getAttribute('data-active-screen'));
    })
    .toBe(true);
});

test('no JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: DESKTOP });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(hero.headline);
  await expect(page.locator('#hero').getByText(INSTALL_NPX, { exact: true })).toBeVisible();
  for (const step of journeySteps) {
    await expect(page.locator('#journey').getByText(step.line, { exact: true }).first()).toBeVisible();
  }
  for (const item of faq) {
    await expect(page.getByText(item.q, { exact: true })).toBeVisible();
  }
  // The mock shows a finished first screen rather than an empty window.
  await expect(mock(page)).toHaveAttribute('data-active-screen', 'cv');
  // Narrow screens fall back to the full step list, since the tabs need JavaScript.
  await page.setViewportSize(NARROW);
  for (const step of journeySteps) {
    await expect(page.locator('#journey').getByText(step.line, { exact: true }).first()).toBeVisible();
  }
  await context.close();
});
