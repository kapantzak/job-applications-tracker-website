// Builds the marketing kit in marketing/: logo, four 1200x630 covers and the demo video.
// Screenshots are frames of public/media/demo.mp4, so the system ffmpeg must be on PATH.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { INSTALL_NPX, journeySteps, sections } from '../../src/content/site.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const here = fileURLToPath(new URL('./', import.meta.url));
const video = join(root, 'public/media/demo.mp4');
const outDir = join(root, 'marketing');
const coversDir = join(outDir, 'covers');

const MB = 1024 * 1024;
const LIMITS = { image: 15 * MB, video: 100 * MB };

// Frame times and crops (x, y, width, height in the 1440x900 video) are picked so the burned-in
// captions (from y≈770) and the cursor (in the sidebar at these moments) stay out of the shot.
const COVERS = [
  { file: '02-jobs.png', step: 'jobs', at: 42.3, crop: [270, 0, 950, 779] },
  { file: '03-review.png', step: 'review', at: 65, crop: [290, 0, 830, 667] },
  { file: '04-dashboard.png', step: 'dashboard', at: 75, crop: [285, 20, 1000, 785] },
];

function stepTitle(id) {
  const step = journeySteps.find((s) => s.id === id);
  if (!step) throw new Error(`Unknown journey step: ${id}`);
  return step.title;
}

function extractFrame(at, [x, y, w, h], out) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(at), '-i', video, '-frames:v', '1', '-vf', `crop=${w}:${h}:${x}:${y}`, out]);
}

function assertSize(file, limit) {
  const { size } = statSync(file);
  if (size > limit) throw new Error(`${file} is ${(size / MB).toFixed(1)} MB, over the ${limit / MB} MB limit`);
  console.log(`Wrote ${file} (${(size / 1024).toFixed(0)} KB)`);
}

try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
} catch {
  throw new Error('ffmpeg is required to extract screenshots from the demo video (brew install ffmpeg)');
}

mkdirSync(coversDir, { recursive: true });
mkdirSync(join(root, '.tmp'), { recursive: true });
const tmp = mkdtempSync(join(root, '.tmp', 'marketing-'));

const browser = await chromium.launch();
try {
  const shoot = async (html, size, out, fill) => {
    const page = await browser.newPage({ viewport: size });
    await page.goto(pathToFileURL(html).href);
    if (fill) await page.evaluate(fill.fn, fill.arg);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode()));
    });
    await page.screenshot({ path: out, type: 'png' });
    await page.close();
    assertSize(out, LIMITS.image);
  };

  await shoot(join(here, 'logo.html'), { width: 500, height: 500 }, join(outDir, 'logo.png'));

  // Cover 1 is the site's Open Graph image, rendered from the same template.
  await shoot(join(root, 'scripts/og/og.html'), { width: 1200, height: 630 }, join(coversDir, '01-hero.png'));

  for (const cover of COVERS) {
    const frame = join(tmp, cover.file);
    extractFrame(cover.at, cover.crop, frame);
    await shoot(join(here, 'cover.html'), { width: 1200, height: 630 }, join(coversDir, cover.file), {
      fn: ({ brand, headline, cmd, src }) => {
        document.getElementById('brand').textContent = brand;
        document.getElementById('headline').textContent = headline;
        document.getElementById('cmd').textContent = cmd;
        document.getElementById('shot').src = src;
      },
      arg: { brand: sections.brand, headline: stepTitle(cover.step), cmd: INSTALL_NPX, src: pathToFileURL(frame).href },
    });
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}

const videoOut = join(outDir, 'demo.mp4');
copyFileSync(video, videoOut);
assertSize(videoOut, LIMITS.video);
