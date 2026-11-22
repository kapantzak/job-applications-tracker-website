# Violet Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Give the marketing site, its logo and its share images a violet brand palette while the journey demo keeps the app's zinc look.

**Architecture:** `:root` tokens in `src/styles/global.css` switch to violet values; a scoped `.app-theme` class re-declares the current zinc values and is applied to the app window root, so the mock inherits zinc. Site sections get a few class changes; brand assets are static HTML/SVG templates re-rendered with the existing scripts.

**Tech Stack:** Astro 7, React 19 island, Tailwind v4 (CSS variables + `@theme inline`), Playwright + axe, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-22-violet-theme-design.md`

## Global Constraints

- Hue 293; light `--primary` `oklch(0.541 0.281 293.009)` (`#7c3aed`), dark `--primary` `oklch(0.702 0.183 293.541)` (`#a78bfa`).
- Palette values exactly as in the spec's Palette table; contrast fixes change lightness only, same hue, and are reported.
- Sidebar, success, warning, destructive and status tokens do not change.
- Theme still follows `prefers-color-scheme`; no toggle.
- No copy, layout or animation changes.
- Nothing is committed until the user has reviewed screenshots.

## Review Focus

- Dark mode demo window: `.app-theme` must also re-declare the dark zinc values, or the mock turns purple-black in dark mode only. Pinned by Task 1's test in both schemes.
- Muted text on tinted surfaces (`text-muted-foreground` on `bg-primary/5` band and `bg-muted` tiles): most likely axe failure. Covered by the existing a11y tests in Task 2.
- Hero glow causing horizontal scroll at 390px or overlapping the CTA click target. Covered by the existing "no horizontal scroll at 390px" and hero visibility tests.
- Elements outside the window that use app-only tokens (`sidebar-*`) would stay zinc: none exist today; noted, no test.
- Stale share images: `public/og.png` and `marketing/covers/01-hero.png` must both come from the new `og.html`. Checked visually in Task 3.

---

### Task 1: Violet palette with a zinc-scoped app window

**Files:**
- Modify: `src/styles/global.css:7-95` (`:root` and dark `:root` values; add `.app-theme` blocks)
- Modify: `src/components/journey/AppWindow.tsx:79` (add `app-theme` to the window's root class list)
- Create: `tests/e2e/theme.spec.ts`

**Interfaces:**
- Produces: CSS class `app-theme` that restores the zinc values of every token the spec's Palette table changes, in light and dark.

- [x] **Step 1: Write the failing test** `tests/e2e/theme.spec.ts`

For each scheme in `['light', 'dark']`: emulate the scheme, open `/`, then read `getComputedStyle(...).getPropertyValue('--primary').trim()`:
- on `document.documentElement`: expect `oklch(0.541 0.281 293.009)` (light) / `oklch(0.702 0.183 293.541)` (dark);
- on `#journey [data-active-screen] > div`: expect `oklch(0.21 0.006 285.885)` (light) / `oklch(0.92 0.004 286.32)` (dark);
- also `--background` inside the window: `oklch(1 0 0)` (light) / `oklch(0.141 0.005 285.823)` (dark).

- [x] **Step 2: Run it and confirm it fails**

Run: `npx playwright test tests/e2e/theme.spec.ts`
Expected: FAIL on the `:root` `--primary` assertion (still zinc).

- [x] **Step 3: Implement the palette and the scope**

Replace the changed tokens with the spec values. Add `.app-theme { ... }` after `:root` with today's zinc values for those same tokens, and a matching `.app-theme` rule inside the existing dark media block. One comment on why the scope exists (the mock must look like the app).

- [x] **Step 4: Run the test and confirm it passes**

Run: `npx playwright test tests/e2e/theme.spec.ts`
Expected: 2 passed.

### Task 2: Site accents (hero glow, filled hero Copy, tinted band and tiles, violet links)

**Files:**
- Modify: `src/components/Hero.astro` (relative section; decorative glow element, `aria-hidden="true"`, `pointer-events-none`, clipped so it adds no overflow)
- Modify: `src/components/CopyCommand.tsx:66` (hero variant only: button `bg-primary text-primary-foreground border-primary hover:bg-primary/90`; other locations unchanged)
- Modify: `src/components/Agents.astro:7` (`bg-muted/40` → `bg-primary/5`)
- Modify: `src/components/Trust.astro:20` (tile `bg-muted` → `bg-primary/10 text-primary`)
- Modify: `src/components/Install.astro:66` (README link `text-foreground` → `text-primary`)
- Modify: `src/components/Footer.astro` (link hover `hover:text-foreground` → `hover:text-primary`, both the credit link and nav links)

- [x] **Step 1: Apply the class changes and the glow**

Glow: a radial gradient of `var(--primary)` at low opacity (start ~18% light, ~22% dark), centred above the headline; size and opacity are the builder's call.

- [x] **Step 2: Run the full e2e suite and unit tests**

Run: `npm run check && npm test && npm run e2e`
Expected: all pass, including the four axe tests. On an axe contrast failure, adjust the failing token's lightness only and record the final value in the spec's Palette table.

### Task 3: Brand assets

**Files:**
- Modify: `public/favicon.svg` (tile `#7c3aed`; comment says the site tile is violet on purpose, unlike the app's zinc tile)
- Modify: `scripts/og/og.html` (background `--background` light value, text `--foreground` light value, top border and logo tile `#7c3aed`, `.cmd` background/border/`$` from the light `--muted`/`--border`/`--muted-foreground` values, soft violet glow)
- Modify: `scripts/marketing/cover.html` (same changes; `.window` stays `#fff` with the new border value)
- Modify: `scripts/marketing/logo.html` (body and rect `#7c3aed`)
- Modify: `marketing/README.md` (logo row: `#7c3aed`)
- Regenerate: `public/og.png`, `marketing/logo.png`, `marketing/covers/*.png`

- [x] **Step 1: Edit the templates and favicon**
- [x] **Step 2: Regenerate**

Run: `npm run og && npm run marketing`
Expected: "Wrote …" lines for `public/og.png`, `marketing/logo.png`, four covers and `demo.mp4`, no size errors.

- [x] **Step 3: Inspect** each regenerated PNG visually; covers 2–4 show the zinc app screenshots inside the violet-tinted frame.

### Task 4: Final verification and user review

- [x] **Step 1:** `npm run check && npm test && npm run build && npm run e2e` — all pass.
- [x] **Step 2:** Full-page screenshots at 1280px in light and dark, a 390px light screenshot, and a close-up of the journey window, saved to the session scratchpad and shown to the user.
- [x] **Step 3:** Report changed files, any adjusted palette values, and wait for the user before committing.
