# Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, single-page Astro site that persuades Claude Code users to install job-applications-tracker, centred on an animated mocked-app journey, deployed to Vercel.

**Architecture:**
- Astro renders every section to static HTML.
- Two React islands ship JavaScript: `CopyCommand` (copy button plus analytics event) and `Journey` (the mocked app driven by Motion).
- Each journey screen is a pure function of a `progress` motion value from 0 to 1:
  - On desktop, scroll position drives it.
  - On narrow screens, an autoplay timer drives it.
  - With reduced motion, it is fixed at 1.
  - So reversing the scroll and showing a static final state come for free.

**Tech Stack:** Astro 7.4, @astrojs/react 7.1, React 19.3, Tailwind 4.3 (`@tailwindcss/vite`), motion 14, lucide-react, `@fontsource-variable/manrope`, `@vercel/analytics` 2, Vitest 5 + Testing Library + jsdom, Playwright 1.65. npm.

**Spec:** `docs/superpowers/specs/2026-11-21-marketing-site-design.md`

## Global Constraints

- **Pinned app commit:** the app repo is `kapantzak/job-applications-tracker`, pinned at `13026cd918363d84aff433bd7e3417ae18e619ca`. Fetch app files with `gh api "repos/kapantzak/job-applications-tracker/contents/<path>?ref=<SHA>"`. Download into `.tmp/` (gitignored), never into `src/` directly.
- **Facts only from the README:** every factual claim must be traceable to the app README, and must describe behaviour in npm `0.2.0`.
- **Banned phrases** (case-insensitive, in any copy): `zero setup`, `nothing leaves your machine`, `offline`, `auto-apply`, `applies for you`, `applies to jobs for you`.
- **Pitch:** "no agent setup". The Claude Code section is "ready in two steps": run `npx`, then (optional) connect Gmail in claude.ai.
- **Mock data:** only invented companies (Acme Robotics, Umbrella Health, Northwind Studio, plus new invented names) and `@example.com` addresses.
- **Third parties:** no Google Fonts, no CDN scripts, no cookies. The only third-party code is `@vercel/analytics`.
- **No scroll-jacking:** never `preventDefault` on wheel or touch events, and never set `scroll-snap` on the page.
- **Themes:** light and dark follow `prefers-color-scheme`. There is no toggle.
- **Journey breakpoint:** scroll-driven at `min-width: 1024px`, autoplay with tabs below that.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no autoplay, no scroll-linked animation, and each step shows its final state.
- **Commit messages:** no AI or tool attribution of any kind (the user's rule). Always stage the specific files; never `git add -A` or `git add .`.
- **Account actions:** every Vercel action is confirmed with the user before it runs. Team: `kapantzaks-projects`.

## Review Focus

1. **Clipboard unavailable** (insecure context, denied permission, old browser). The copy button must still help: it selects the command text and says "Press Ctrl+C / ⌘C". Covered by a test in Task 3.
2. **Window resized across 1024 px** (tablet rotation, desktop window resize). The journey switches between scroll and tab modes without a stale active step or an empty mock. Covered by an e2e test in Task 7.
3. **Page loads mid-journey** (refresh while scrolled, back navigation restoring scroll). The active step and mock must match the scroll position, not reset to step 1. Covered by an e2e test in Task 7.
4. **JavaScript disabled or blocked.** The hero, the install command, all five step lines and the FAQ are still readable. Covered by an e2e test in Task 7.
5. **Reduced motion on narrow screens.** No autoplay: after 8 s the first tab is still selected. Covered by an e2e test in Task 7.

---

## File Structure

```
astro.config.mjs            site URL, React integration, Tailwind vite plugin
vitest.config.ts            jsdom, tests/unit
playwright.config.ts        runs against `astro preview` on :4321
public/favicon.svg          copied from app src/ui/favicon.svg
public/og.png               1200×630, rendered by scripts/og/render.mjs
public/media/demo.mp4, demo-poster.png   copied from app docs/video
scripts/og/og.html, render.mjs           OG image source + renderer
src/styles/global.css       Tailwind, app colour tokens (light/dark via media), Manrope
src/layouts/Base.astro      <head>: SEO, OG, favicon, Analytics
src/pages/index.astro       composes sections
src/content/site.ts         ALL page copy, commands, links (single source)
src/lib/analytics.ts        trackCopyInstall()
src/components/*.astro      Header, Hero, Trust, ClaudeCode, Video, Install, Footer
src/components/CopyCommand.tsx            island
src/components/journey/
  types.ts                  StepId, ScreenProps, mock data types
  timeline.ts               pure progress math
  useAutoplay.ts            autoplay controller hook
  useMediaQuery.ts          SSR-safe media query hook
  mockData.ts               invented data
  AppWindow.tsx             window chrome + sidebar, scaled to fit
  ui.tsx                    MockBadge, MockButton (app look)
  screens/{Cv,Jobs,Apply,Review,Dashboard}Screen.tsx, screens/index.ts
  Journey.tsx               island root: layout + mode orchestration
tests/unit/*.test.ts(x)     Vitest
tests/e2e/*.spec.ts         Playwright
```

---

### Task 1: Scaffold, theme tokens, base layout, test harness

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/pages/index.astro` (placeholder `<main>`), `public/favicon.svg`, `tests/e2e/head.spec.ts`, `tests/unit/sanity.test.ts`
- Modify: `.gitignore` (create if absent): `node_modules/`, `dist/`, `.astro/`, `.tmp/`, `.vercel/`, `test-results/`, `playwright-report/`

**Interfaces:**
- Produces:
  - `Base.astro` props `{ title: string; description: string }`. It renders `<slot />` inside `<body>`.
  - The colour tokens from the app (`--background`, `--foreground`, `--primary`, `--muted`, `--muted-foreground`, `--border`, `--card`, `--success`, `--warning`, `--destructive`, …) as Tailwind theme colours (`bg-background`, `text-muted-foreground`, …).
  - The Tailwind `dark:` variant bound to `@media (prefers-color-scheme: dark)`.
  - npm scripts: `dev`, `build`, `preview`, `check` (`astro check`), `test` (`vitest run`), `e2e` (`playwright test`).

- [ ] **Step 1: Scaffold.** Run `npm create astro@latest . -- --template minimal --no-git --install --typescript strict`. Then `npx astro add react --yes` and `npx astro add tailwind --yes`. Install the runtime dependencies (`motion lucide-react @fontsource-variable/manrope @vercel/analytics clsx tailwind-merge`) and the dev dependencies (`vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @playwright/test`). Set `"engines": { "node": ">=22" }`.
- [ ] **Step 2: `astro.config.mjs`.** Set `site` to `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` when that variable is set, otherwise `http://localhost:4321`.
- [ ] **Step 3: Tokens.** Fetch the app's `src/ui/styles.css` at the pinned SHA into `.tmp/app-styles.css`. In `global.css`:
  - Copy the `:root` tokens.
  - Copy the `.dark` tokens into `@media (prefers-color-scheme: dark) { :root { … } }`.
  - Declare `@custom-variant dark (@media (prefers-color-scheme: dark));`.
  - Copy the `@theme inline` mapping.
  - Import `@fontsource-variable/manrope` and set `font-family: 'Manrope Variable', sans-serif` on `body`.
  - Do not use `.dark` class selectors.
- [ ] **Step 4: Favicon.** Fetch the app's `src/ui/favicon.svg` at the pinned SHA into `public/favicon.svg`.
- [ ] **Step 5: Write the failing e2e test** `tests/e2e/head.spec.ts`:
  - `test('head has title, description, absolute og:image, favicon')`: `page.title()` is non-empty; `meta[name=description]` content is non-empty; `meta[property="og:image"]` content matches `/^https?:\/\//`; `link[rel=icon]` exists.
  - `test('no third-party requests')`: collect `page.on('request')` hosts during load and a full scroll to the bottom. Every host is `localhost`/`127.0.0.1`.
  - `playwright.config.ts`: `webServer: { command: 'npm run build && npm run preview -- --port 4321', port: 4321 }`. Projects are `chromium` only.
- [ ] **Step 6: Run** `npx playwright install chromium && npm run e2e -- head`. Expected: FAIL (no description or og:image yet).
- [ ] **Step 7: Implement `Base.astro`.**
  - `<html lang="en">`, `<meta charset>`, viewport, `<title>`, description.
  - Canonical `new URL('/', Astro.site)`.
  - `og:title`, `og:description`, `og:image` = `new URL('/og.png', Astro.site)`, `twitter:card=summary_large_image`, favicon.
  - `<meta name="color-scheme" content="light dark">`.
  - `import Analytics from '@vercel/analytics/astro'` and `<Analytics />`.
  - Import `global.css`.
  - `og.png` comes in Task 8; the meta tag can point at it now.
- [ ] **Step 8: Unit harness.** `vitest.config.ts`: `environment: 'jsdom'`, `include: ['tests/unit/**/*.test.{ts,tsx}']`, setup imports `@testing-library/jest-dom/vitest`. `tests/unit/sanity.test.ts` asserts `1 + 1 === 2` only to prove the harness runs.
- [ ] **Step 9: Run** `npm run check && npm test && npm run e2e`. Expected: all PASS. If `@vercel/analytics/astro` requests a non-local host in preview, record it and adjust the test to allow exactly `va.vercel-scripts.com`, then note this in the commit message body.
- [ ] **Step 10: Commit** the specific files: `git commit -m "Scaffold Astro site with app theme tokens, base layout and test harness"`.

### Task 2: Site copy and static sections

**Files:**
- Create: `src/content/site.ts`, `src/components/{Header,Hero,Trust,ClaudeCode,Install,Footer}.astro`, `tests/unit/copy-guard.test.ts`, `tests/e2e/sections.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces (`src/content/site.ts`):
  ```ts
  export type StepId = 'cv' | 'jobs' | 'apply' | 'review' | 'dashboard';
  export interface JourneyStep { id: StepId; title: string; line: string }
  export const INSTALL_NPX = 'npx job-applications-tracker';
  export const INSTALL_GLOBAL = 'npm i -g job-applications-tracker';
  export const RUN_GLOBAL = 'jobtrack';
  export const LINKS: { github: string; npm: string; readme: string; license: string };
  export const meta: { title: string; description: string };
  export const hero: { headline: string; subhead: string };
  export const journeySteps: JourneyStep[]; // exactly 5, in the order of StepId above
  export const trustPoints: { title: string; body: string }[];
  export const claudeCode: { title: string; intro: string; steps: { title: string; body: string; command?: string }[] };
  export const faq: { q: string; a: string }[];
  export const ALL_COPY: string[]; // every string above, flattened, for the guard test
  ```
  `StepId` and `JourneyStep` are re-exported by `journey/types.ts` (Task 4).
- Consumes: `Base.astro` (Task 1).

- [ ] **Step 1: Write the failing guard test** `tests/unit/copy-guard.test.ts`:
  - `no banned phrases`: no string in `ALL_COPY` matches (case-insensitive) any phrase in Global Constraints.
  - `five journey steps in order`: `journeySteps.map(s => s.id)` equals `['cv','jobs','apply','review','dashboard']`.
  - `install command exact`: `INSTALL_NPX === 'npx job-applications-tracker'`.
  - `requirements stated`: some FAQ answer contains `Node 22`.
  - `two-step Claude Code section`: `claudeCode.steps.length === 2`, `steps[0].command === INSTALL_NPX`, and `steps[1]` mentions `Gmail` and `claude.ai`.
- [ ] **Step 2: Run** `npm test -- copy-guard`. Expected: FAIL (module missing).
- [ ] **Step 3: Draft the copy in `site.ts`.**
  - **Trust points (four):**
    - data stored locally in SQLite
    - your own agent
    - nothing changes until you accept
    - never applies to jobs, sends mail, or changes your mail
  - **Trust wording:** the trust body must say that your profile, CV text and mail content go to your agent. Wording for that is the builder's.
  - **FAQ:**
    - other agents (Codex, custom command)
    - what is sent to the agent
    - where data lives (`~/.job-applications-tracker/`)
    - desktop browsers only
    - cost: uses your Claude Code plan; Max effort uses more
    - requirements: Node 22 or newer
  - **Source:** every claim comes from the README sections cited in the spec.
- [ ] **Step 4: Run** `npm test -- copy-guard`. Expected: PASS.
- [ ] **Step 5: Write the failing e2e test** `tests/e2e/sections.spec.ts`:
  - The hero `h1` equals `hero.headline`.
  - The text `npx job-applications-tracker` is visible without scrolling at 1280×800 and at 390×844.
  - There are sections with ids `trust`, `claude-code`, `install`.
  - The footer links to GitHub, npm and the licence.
  - Exactly one `h1`.
- [ ] **Step 6: Implement the sections** and compose them in `index.astro` in spec order: Header, Hero, `#journey` placeholder, Trust, ClaudeCode, `#video` placeholder, Install (with FAQ as `<details>` elements), Footer.
  - The hero shows the command as plain `<code>` for now; Task 3 swaps in the island.
  - Visual design is the builder's call, but must be consistent with the app's look (tokens, Manrope, lucide icons, `rounded-xl` cards with `border-border`).
- [ ] **Step 7: Run** `npm run check && npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 8: Commit** with `"Add site copy and static sections"`.

### Task 3: Copy-command island with analytics event

**Files:**
- Create: `src/components/CopyCommand.tsx`, `src/lib/analytics.ts`, `tests/unit/CopyCommand.test.tsx`
- Modify: `src/components/Hero.astro`, `src/components/Install.astro`, `src/components/ClaudeCode.astro`

**Interfaces:**
- Produces:
  - `src/lib/analytics.ts`: `export type CopyLocation = 'hero' | 'claude-code' | 'install'; export function trackCopyInstall(location: CopyLocation): void`. It calls `track('copy_install', { location })` from `@vercel/analytics` and never throws.
  - `CopyCommand.tsx`: `export default function CopyCommand(props: { command: string; location: CopyLocation }): JSX.Element`.
  - Used in Astro with `client:visible` (`client:load` in the hero).

- [ ] **Step 1: Verify the plan feature.**
  - Read `https://vercel.com/docs/analytics/custom-events` (via the Vercel docs MCP or WebFetch) and confirm custom events are available on the Pro plan.
  - If they are not, or this can't be confirmed, STOP and report to the user before continuing (spec decision 13).
- [ ] **Step 2: Write the failing tests** `tests/unit/CopyCommand.test.tsx` (mock `@vercel/analytics`):
  - `copies and confirms`: with `navigator.clipboard.writeText` resolving, clicking the button calls `writeText('npx job-applications-tracker')`, shows the text `Copied`, and calls `track('copy_install', { location: 'hero' })` once.
  - `confirmation resets`: with fake timers, `Copied` disappears after 2000 ms.
  - `fallback when clipboard missing` (Review Focus 1): with `navigator.clipboard` undefined, a click selects the command text (`window.getSelection().toString() === command`), shows `Press Ctrl+C / ⌘C`, and still calls `track` once.
  - `fallback when writeText rejects`: same expectations as the previous test.
  - `accessible name`: the button's accessible name is `Copy install command`, and the command is rendered in a `<code>`.
- [ ] **Step 3: Run** `npm test -- CopyCommand`. Expected: FAIL.
- [ ] **Step 4: Implement** `CopyCommand` and `trackCopyInstall`. Use a `role="status"` live region for the confirmation text.
- [ ] **Step 5: Run** `npm test -- CopyCommand`. Expected: PASS.
- [ ] **Step 6: Wire into the pages.** Hero (`location="hero"`, `client:load`), Claude Code step 1 (`"claude-code"`), Install (`"install"`, `client:visible`). The Install section also shows `INSTALL_GLOBAL` and `RUN_GLOBAL` as plain code.
- [ ] **Step 7: Run** `npm run check && npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 8: Commit** with `"Add copy-to-clipboard install command with analytics event"`.

### Task 4: Journey foundations: types, timeline math, hooks, mock data

**Files:**
- Create: `src/components/journey/{types.ts,timeline.ts,useAutoplay.ts,useMediaQuery.ts,mockData.ts}`, `tests/unit/{timeline,useAutoplay,mockData}.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // types.ts
  export type { StepId, JourneyStep } from '../../content/site';
  import type { MotionValue } from 'motion/react';
  export interface ScreenProps { progress: MotionValue<number> } // 0..1 within the step
  export type Verification = 'verified' | 'redirected' | 'could-not-verify';
  export type Fit = 'match' | 'mismatch' | 'unknown';
  export type AppStatus = 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  // timeline.ts
  export function stepAt(progress: number, count: number): { index: number; local: number };
  export function segment(local: number, start: number, end: number): number;
  export function fitScale(containerWidth: number, designWidth: number): number;
  // useMediaQuery.ts
  export function useMediaQuery(query: string, serverDefault: boolean): boolean;
  // useAutoplay.ts
  export function useAutoplay(opts: { count: number; stepMs: number; enabled: boolean; rootRef: React.RefObject<Element | null> }):
    { index: number; progress: MotionValue<number>; select(i: number): void; stopped: boolean };
  // mockData.ts
  export const profile: { name: 'Frontend Platform'; targetRoles: string[]; locations: string[]; remote: string; seniority: string[] };
  export const cvFileName: string;
  export const jobs: { company: string; title: string; location: string; verification: Verification; fit: { location: Fit; remote: Fit; seniority: Fit } }[];
  export const runLog: string[];
  export const proposal: { company: string; role: string; from: string; date: string; subject: string; snippet: string; fromStatus: AppStatus; toStatus: AppStatus };
  export const dashboard: { tiles: { label: string; value: number }[]; statusBar: { status: AppStatus | 'withdrawn' | 'no-response'; count: number }[]; funnel: { stage: string; count: number }[] };
  export const STATUS_LABEL: Record<AppStatus, string>;
  export const VERIFICATION_LABEL: Record<Verification, string>; // 'Verified' | 'Redirected' | 'Could not verify'
  ```

- [ ] **Step 1: Write the failing tests.**
  - **`timeline.test.ts`:**
    - `stepAt(0,5)` → `{index:0, local:0}`
    - `stepAt(0.5,5)` → `{index:2, local:0.5}`
    - `stepAt(1,5)` → `{index:4, local:1}`
    - `stepAt(-0.2,5)` → `{index:0, local:0}`
    - `stepAt(1.3,5)` → `{index:4, local:1}`
    - `stepAt(0.4,5)` → `{index:2, local:0}` (a boundary belongs to the next step)
    - `segment(0.5,0.25,0.75)` → `0.5`
    - `segment(0.1,0.25,0.75)` → `0`
    - `segment(0.9,0.25,0.75)` → `1`
    - `fitScale(520,1040)` → `0.5`
    - `fitScale(2000,1040)` → `1` (never upscale)
  - **`useAutoplay.test.ts`** (fake timers; stub `IntersectionObserver` as intersecting):
    - With `enabled`, `index` advances 0→1 after `stepMs` and wraps 4→0.
    - `select(3)` sets `index=3`, `progress.get()===1` and `stopped===true`, and the index no longer advances.
    - With `enabled:false`, the index stays 0 and `progress.get()===1`.
    - When the observer reports not intersecting, or `document.visibilityState==='hidden'`, the index does not advance.
  - **`mockData.test.ts`:**
    - Every email-like string in `proposal` ends with `@example.com`.
    - `jobs` includes all three `Verification` values and at least one each of `match`, `mismatch` and `unknown`.
    - No company name is outside the allowed invented list declared in the test.
- [ ] **Step 2: Run** `npm test -- timeline useAutoplay mockData`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **`stepAt`:** `index = min(count-1, floor(clamp(p)*count))`, `local = clamp(p)*count - index` (clamp to 1 at the end).
  - **`useAutoplay`:** advances `progress` with `requestAnimationFrame` (Motion's `animate(progress, 1, { duration: stepMs/1000, ease: 'linear' })`, then the next index).
  - **`useMediaQuery`:** returns `serverDefault` until mounted, then the live `matchMedia` value with a change listener.
  - **`mockData`:**
    - The proposal uses Northwind Studio, `no-reply@ats.example.com`, Applied → Interview, as in the app's sample data.
    - The profile uses target roles `Senior Frontend Engineer` and `Staff Frontend Engineer`, and locations `Berlin` and `Remote (EU)`.
    - Seniority: `Senior, Staff`.
    - 6 jobs.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** with `"Add journey timeline math, autoplay and mock data"`.

### Task 5: App window and first two screens (CV → profile, Find jobs)

**Files:**
- Create: `src/components/journey/{ui.tsx,AppWindow.tsx}`, `src/components/journey/screens/{CvScreen,JobsScreen}.tsx`, `tests/unit/screens-1.test.tsx`

**Interfaces:**
- Consumes: `ScreenProps`, `fitScale`, `segment`, `mockData` (Task 4).
- Produces:
  - **`AppWindow`:** `AppWindow(props: { active: StepId; children: React.ReactNode }): JSX.Element`.
    - Renders at design size 1040×660 px, scaled with `transform: scale(fitScale(containerWidth, 1040))` through a `ResizeObserver`. The outer box reserves `aspect-ratio: 1040/660` so there is no layout shift.
    - Sidebar items: Dashboard, Jobs, Applications, Review (with badge), Runs, Profile, Settings.
    - Active item per step: `cv→Profile`, `jobs→Jobs`, `apply→Applications`, `review→Review`, `dashboard→Dashboard`.
    - Root has `aria-hidden="true"` and `data-active-screen={active}`.
  - **`ui.tsx`:** `MockBadge({ tone: 'success'|'warning'|'muted'|'destructive'|'info', children })`, `MockButton({ variant: 'primary'|'outline', children })`.
  - **`CvScreen`, `JobsScreen`:** `(props: ScreenProps) => JSX.Element`.

- [ ] **Step 1: Write the failing tests** `tests/unit/screens-1.test.tsx`. Render with `motionValue(1)` and with `motionValue(0)`.
  - `CvScreen at 1`: shows `Frontend Platform`, both target roles, `Berlin`, `Senior` and `Staff`.
  - `CvScreen at 0`: shows `cvFileName` and does not show `Staff Frontend Engineer`.
  - `JobsScreen at 1`: shows all 6 job titles, plus `Verified`, `Redirected` and `Could not verify`.
  - `JobsScreen at 0`: shows the `Find jobs` button and no job titles.
  - `AppWindow`: `data-active-screen="jobs"` marks `Jobs` with `aria-current="page"` and has `aria-hidden="true"`.
  - Note: with Motion, "not shown" means unmounted or `opacity: 0` with `visibility: hidden`. Pick one and assert it consistently (`toBeVisible` with jest-dom).
- [ ] **Step 2: Run** `npm test -- screens-1`. Expected: FAIL.
- [ ] **Step 3: Implement.** Each screen derives sub-phases with `useTransform(progress, v => segment(v, a, b))`.
  - **CV screen:**
    - 0–0.25: the file card drops in.
    - 0.25–0.55: the "Analysing CV" bar fills.
    - 0.55–1: the form fields fill in one after another.
  - **Jobs screen:**
    - 0–0.15: "Find jobs" is pressed.
    - 0.15–0.45: run log lines stream in.
    - 0.45–0.85: rows appear.
    - 0.85–1: badges and Fit marks (✓ ✗ ?) pop in.
  - **Styling and timings:** visual details and easing are the builder's call; match the app's screenshots (`docs/images/*.png` at the pinned SHA).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** with `"Add mocked app window, CV and Jobs screens"`.

### Task 6: Remaining screens (Apply, Review, Dashboard)

**Files:**
- Create: `src/components/journey/screens/{ApplyScreen,ReviewScreen,DashboardScreen,index}.ts(x)`, `tests/unit/screens-2.test.tsx`

**Interfaces:**
- Consumes: Task 4 and Task 5 interfaces.
- Produces: `screens/index.ts`: `export const SCREENS: Record<StepId, React.ComponentType<ScreenProps>>`.

- [ ] **Step 1: Write the failing tests** `tests/unit/screens-2.test.tsx`:
  - `ApplyScreen at 1`: the chosen job row shows `Applied`; the same row at 0 shows `Saved`.
  - `ReviewScreen at 1`: shows `Interview` as the resulting status and the `no-reply@ats.example.com` sender.
  - `ReviewScreen at 0`: shows `Sync from Gmail` and no proposal card.
  - `DashboardScreen at 1`: every `dashboard.tiles[i].value` is rendered as its final number.
  - `DashboardScreen at 0`: tiles show `0`.
  - `SCREENS`: has exactly the keys `cv, jobs, apply, review, dashboard`.
- [ ] **Step 2: Run** `npm test -- screens-2`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Apply:** status select animates Saved → Applied, then an Applications list gains the row.
  - **Review:**
    - 0–0.2: "Sync from Gmail" is pressed.
    - 0.2–0.6: the evidence card slides in (From / Date / Subject / snippet).
    - 0.6–0.8: Accept is pressed.
    - 0.8–1: the status badge becomes Interview.
  - **Dashboard:** tiles count up (rounded `useTransform`), the status bar segments grow, and the funnel bars grow. Use colours from the app's `StatusBarCard`/`FunnelCard` (fetch at the pinned SHA).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** with `"Add Apply, Review and Dashboard screens"`.

### Task 7: Journey orchestration and page integration

**Files:**
- Create: `src/components/journey/Journey.tsx`, `tests/e2e/journey.spec.ts`
- Modify: `src/pages/index.astro` (replace the `#journey` placeholder with `<Journey steps={journeySteps} client:visible />` inside `<section id="journey">`)

**Interfaces:**
- Consumes: `SCREENS`, `AppWindow`, `stepAt`, `useAutoplay`, `useMediaQuery`, `JourneyStep` (Tasks 2, 4–6).
- Produces: `Journey(props: { steps: JourneyStep[] }): JSX.Element` with this DOM contract, used by e2e:
  - Each desktop step block has `data-journey-step={id}`, and `aria-current="step"` when active.
  - Narrow tabs have `role="tablist"`, `role="tab"` and `aria-selected`.
  - The mock root has `data-active-screen`.

Behaviour (all from the spec):
- **One markup for all modes; CSS decides the layout.**
  - Both the desktop step list (`hidden lg:block`) and the narrow tab strip (`lg:hidden`) are in the server-rendered HTML.
  - The server render shows step `cv` at progress 1, so no-JS visitors and the pre-hydration state show a complete screen.
- **Desktop (`useMediaQuery('(min-width: 1024px)', true)`):**
  - Two columns. Each step block is `min-height: 80vh`, and the mock is `position: sticky; top: calc(50vh - <half mock height>)`.
  - `useScroll({ target: stepsRef, offset: ['start center', 'end center'] })`, then `stepAt` gives the active index and local progress. Local progress is fed to the active screen as a `MotionValue`.
  - Screen swaps cross-fade (`AnimatePresence`, 200 ms).
- **Narrow:** `useAutoplay({ count: 5, stepMs: 6000, enabled: !reduced && !isDesktop, rootRef })`. Tabs call `select(i)`.
- **Reduced motion (`useReducedMotion()`):**
  - Screens get a constant `motionValue(1)`. No `AnimatePresence` transition, no autoplay.
  - Desktop still switches the screen by scroll position (a discrete swap).

- [ ] **Step 1: Write the failing e2e tests** `tests/e2e/journey.spec.ts`. Wait for hydration with `page.locator('#journey astro-island:not([ssr])')`.
  - `desktop scroll advances steps` (1280×800): scroll `[data-journey-step=review]` to the viewport centre. `data-active-screen` becomes `review`, and that block has `aria-current="step"`.
  - `reverse scroll goes back`: then scroll to `[data-journey-step=jobs]`; the screen becomes `jobs`.
  - `load mid-journey` (Review Focus 3): `page.goto('/')`, scroll to `dashboard`, `page.reload()`. After hydration the screen is `dashboard`, not `cv`.
  - `narrow autoplay` (390×844): after 6.5 s the selected tab is no longer the first.
  - `narrow tab tap stops autoplay`: tap tab 4. The screen is `review` and is still `review` after 7 s.
  - `reduced motion narrow` (Review Focus 5): `page.emulateMedia({ reducedMotion: 'reduce' })`. After 8 s the first tab is still selected.
  - `crossing the breakpoint` (Review Focus 2): start at 1280×800, scroll to `apply`, resize to 390×844. The tablist is visible, exactly one tab has `aria-selected="true"`, and `data-active-screen` equals that tab's step. Resize back to 1280×800: the step list is visible and the screen matches the step at the viewport centre.
  - `no JavaScript` (Review Focus 4): a new context with `javaScriptEnabled: false`. The hero `h1`, `npx job-applications-tracker`, all five `journeySteps[].line` texts and all FAQ questions are visible or present in the DOM.
  - `no layout shift`: on 1280×800, `PerformanceObserver` `layout-shift` entries summed over load plus 1 s are `< 0.1`.
- [ ] **Step 2: Run** `npm run e2e -- journey`. Expected: FAIL.
- [ ] **Step 3: Implement `Journey.tsx`** and integrate it into `index.astro`.
- [ ] **Step 4: Run** `npm run check && npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 5: Manual look check.** Run `npm run dev` and view at 1440×900, 1024×768 and 390×844, in light and dark, and with reduced motion. Capture screenshots into `.tmp/` for the user. Fix anything visually broken.
- [ ] **Step 6: Commit** with `"Add scroll-driven journey with narrow-screen autoplay and reduced-motion fallback"`.

### Task 8: Demo video, OG image

**Files:**
- Create: `public/media/demo.mp4`, `public/media/demo-poster.png`, `src/components/Video.astro`, `scripts/og/og.html`, `scripts/og/render.mjs`, `public/og.png`, `tests/e2e/video.spec.ts`
- Modify: `src/pages/index.astro` (replace the `#video` placeholder), `package.json` (script `og`: `node scripts/og/render.mjs`)

**Interfaces:**
- Consumes: `Base.astro` (it already references `/og.png`).

- [ ] **Step 1: Copy the assets.** Fetch `docs/video/demo.mp4` (2,162,101 bytes) and `docs/video/demo-poster.png` (1440×900) at the pinned SHA into `.tmp/`, check the byte sizes, then copy them into `public/media/`.
- [ ] **Step 2: Write the failing e2e test** `tests/e2e/video.spec.ts`:
  - `video` inside `#video` has `preload="none"`, `controls`, `muted`, `playsinline`, `poster="/media/demo-poster.png"`, `width="1440"` and `height="900"`.
  - No request to `/media/demo.mp4` is made during page load and a scroll to the bottom.
  - `GET /og.png` returns 200 with `content-type` `image/png`.
- [ ] **Step 3: Run** `npm run e2e -- video`. Expected: FAIL.
- [ ] **Step 4: Implement** `Video.astro` (a heading plus a one-line caption saying the recording uses invented data and a stand-in agent, as the README says).
- [ ] **Step 5: Make the OG image.**
  - `scripts/og/og.html` is a 1200×630 card: logo mark, headline, `npx job-applications-tracker`, and Manrope loaded from `node_modules/@fontsource-variable/manrope` with a relative `@font-face` URL.
  - `render.mjs` uses `@playwright/test`'s `chromium` to screenshot it to `public/og.png`.
- [ ] **Step 6: Run** `npm run og && npm run e2e`. Expected: PASS.
- [ ] **Step 7: Commit** the assets, components, scripts and `og.png` with `"Add demo video section and Open Graph image"`.

### Task 9: Quality pass and copy review

**Files:**
- Modify: only what the checks below require.

- [ ] **Step 1: Lighthouse, mobile.** Run `npm run build && npm run preview -- --port 4321 &` (capture the PID in `.tmp/preview.pid`), then `npx lighthouse http://localhost:4321 --only-categories=performance,accessibility --form-factor=mobile --output=json --output-path=.tmp/lh-mobile.json --chrome-flags=--headless`. Targets: performance ≥ 90, accessibility ≥ 95.
  - Fix accessibility failures.
  - If performance is below target, report the numbers and the main cause to the user rather than trade away spec features.
  - Kill the preview by its saved PID only.
- [ ] **Step 2: Contrast in both themes.**
  - Add `@axe-core/playwright` as a dev dependency.
  - Add `tests/e2e/a11y.spec.ts`: for `colorScheme` `light` and `dark` (`page.emulateMedia`), run AxeBuilder on `/` with `#journey [aria-hidden=true]` excluded.
  - Expected: zero violations.
- [ ] **Step 3: Copy review checkpoint (user).** Present the headline, subhead, five step lines, trust points, the Claude Code section and the FAQ to the user, quoted from `site.ts`, with the README section each claim comes from. Apply their edits. **Do not deploy to production before the user approves the copy.**
- [ ] **Step 4: Run** `npm run check && npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 5: Commit** with `"Polish accessibility and performance; apply copy review"`.

### Task 10: Vercel project, Git integration, analytics, verification

**Files:**
- Create: none (`.vercel/` is gitignored).

Every step marked **(confirm)** is an account action: describe it to the user and wait for an explicit yes.

- [ ] **Step 1: Check the CLI session.** Run `vercel whoami` and `vercel teams ls`. Expected: logged in, team `kapantzaks-projects` listed. If it is not logged in, STOP: ask the user to run `! vercel login`.
- [ ] **Step 2 (confirm): Link and create the project.** `vercel link --yes --project job-applications-tracker-website --scope kapantzaks-projects`. This creates the project, and Vercel auto-detects the Astro framework preset.
- [ ] **Step 3 (confirm): Connect Git.** `vercel git connect https://github.com/kapantzak/job-applications-tracker-website --scope kapantzaks-projects`. Production branch: `main`.
- [ ] **Step 4 (confirm): Enable Web Analytics** for the project. Use the Vercel MCP or API if a tool exists for it; otherwise give the user the dashboard path (Project → Analytics → Enable) and wait.
- [ ] **Step 5 (confirm): Push the branch.** `git push -u origin Initial-implementation`. The GitHub integration builds a preview.
- [ ] **Step 6: Verify the preview.**
  - Get the preview URL (`vercel ls job-applications-tracker-website --scope kapantzaks-projects`).
  - If it is protected by Vercel Authentication, use the `vercel:access-protected-vercel-deployment` skill (`vercel curl`).
  - Run the Playwright suite against it with `PLAYWRIGHT_BASE_URL=<url>`, which `playwright.config.ts` must honour by skipping `webServer` when it is set.
  - Expected: all pass, except `no third-party requests`, which must allow the Vercel analytics host only.
- [ ] **Step 7: Hand off for production.** Production deploys when `Initial-implementation` is merged into `main`. Ask the user whether to open a PR (`gh pr create`) and who merges. After merge:
  - Confirm the production deployment is `READY`.
  - Check the live `*.vercel.app` URL: hero, copy button, journey on desktop and phone, video.
  - Confirm `og:image` is an absolute URL on the production host.
  - Confirm a `copy_install` event appears in Web Analytics after one test click. Events can take minutes; report if it is not visible yet rather than retrying in a loop.

---

## Self-review notes

- **Spec coverage:**
  - Every page section: Tasks 2, 3, 7, 8.
  - Five-step journey and its three modes: Tasks 4–7.
  - Anti-goals: the copy guard (Task 2), the mock-data test (Task 4), the third-party request test (Task 1), no scroll-jacking (Global Constraints).
  - Decisions 8, 10, 12, 13: Tasks 1, 3, 10.
  - The quality bar: Task 9.
  - The copy-review requirement: Task 9 Step 3.
- **Out of scope** (spec follow-ups): updating the app's `homepage`, a custom domain.
