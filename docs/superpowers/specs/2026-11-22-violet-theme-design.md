# Violet theme for the marketing site: design

Status: approved by the user (2026-11-22)
Date: 2026-11-22
Builds on: `2026-11-21-marketing-site-design.md`

## Intent

The site uses the stock shadcn zinc palette, so it reads as plain and grey. The user wants colour: a violet brand
tone across the site, its logo and its share images, while the journey demo keeps looking like the real app.

## Goals

- Violet becomes the site's brand colour in light and dark themes (both still follow the OS setting).
- The journey's app window keeps the app's own zinc palette, unchanged.
- Favicon, header/footer logo, Open Graph image and the marketing kit carry the same violet.
- All existing tests pass, including the axe contrast checks in both themes.

## Non-goals

- Layout, copy, typography or animation changes.
- Changing the app itself or its logo (the site's mark will differ from the app's zinc tile on purpose).
- A theme toggle.
- Re-recording the demo video or changing the app screenshots in covers 2–4 (they show the real, zinc app).

## Anti-goals

- The demo window turning violet, which would misrepresent the product.
- Any text or control falling below WCAG AA contrast in either theme.

## Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Direction | Violet site theme (tinted surfaces, violet primary), not just accents or a loud gradient |
| 2 | Demo window colours | Keep the app's zinc palette |
| 3 | Brand assets | Update favicon, logo, OG image and marketing kit now |
| 4 | Keeping the demo zinc | The app window gets its own scoped copy of the zinc tokens |
| 5 | Hue | Violet: `#7c3aed` (light), `#a78bfa` (dark) |
| 6 | Tint strength | Faint background tint, white cards, violet-tinted Agents band, soft hero glow |
| 7 | Logo tile | Solid violet tile with the white Lens mark |

## Approaches

**Keeping the demo zinc (decision 4):**

- **A. Scoped app tokens (chosen).** `:root` gets the violet palette; the app window root gets a class that
  re-declares the zinc tokens, so everything inside inherits them. A few lines of CSS, no changes to the mock's
  markup. Trade-off: the zinc values exist twice (`:root` sidebar/status values plus the scope), which the
  2026-11-21 spec already treats as a copy of the app's `src/ui/styles.css`.
- **B. Separate brand tokens.** Keep `:root` zinc and add `--brand-*` tokens that every site section opts into.
  Rejected: about ten files change, and a tinted page background is awkward because the window and the page
  share `--background`.

**Overall direction (decision 1):** accents only (a glow plus a few violet details) was lower risk; a full-bleed
gradient hero was louder but generic and fights the demo for attention. The user chose the full theme.

## Palette

OKLCH, hue 293 (Tailwind violet). Tokens not listed (sidebar, success, warning, destructive, status ramp) stay as
they are: they are app colours, used only inside the demo or for status badges.

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(0.985 0.006 293)` | `oklch(0.15 0.02 293)` |
| `--foreground`, `--card-foreground`, `--popover-foreground` | `oklch(0.17 0.02 293)` | `oklch(0.985 0 0)` |
| `--card`, `--popover` | `oklch(1 0 0)` | `oklch(0.2 0.03 293)` |
| `--primary` | `oklch(0.541 0.281 293.009)` (`#7c3aed`) | `oklch(0.702 0.183 293.541)` (`#a78bfa`) |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.17 0.02 293)` |
| `--secondary`, `--muted`, `--accent` | `oklch(0.955 0.015 293)` | `oklch(0.26 0.03 293)` |
| `--secondary-foreground`, `--accent-foreground` | `oklch(0.21 0.03 293)` | `oklch(0.985 0 0)` |
| `--muted-foreground` | `oklch(0.52 0.03 293)` | `oklch(0.72 0.03 293)` |
| `--border`, `--input` | `oklch(0.91 0.02 293)` | unchanged (`10%` / `15%` white) |
| `--ring` | `oklch(0.70 0.10 293)` | `oklch(0.60 0.12 293)` |

These are starting values. If axe flags a pair, the builder adjusts lightness only (same hue) until it passes,
and reports the final values.

## Where violet appears

- **Filled violet:** the hero Copy button, the Agents step numbers, the journey step markers and progress bars
  (these already use `primary`, so they follow automatically).
- **Violet text:** the README link in Install and the footer link hover state.
- **Tinted surfaces:** page background, Agents band (`bg-primary/5` in place of `bg-muted/40`), Trust icon tiles
  (`bg-primary/10` with a `text-primary` icon).
- **Hero glow:** a decorative radial gradient of `primary` at low opacity behind the hero; `aria-hidden`, no
  pointer events, no layout shift.
- **Unchanged:** the outlined GitHub and npm buttons, the other Copy buttons, the focus ring (`--foreground`,
  already full-strength in both themes).

## App window scope

- The app window root in `src/components/journey/AppWindow.tsx` gets an `app-theme` class.
- `src/styles/global.css` defines `.app-theme` with the current zinc values of every token changed above, for
  light and for dark (inside the existing `prefers-color-scheme: dark` block).
- Result: the mock's window, sidebar, logo tile, buttons and badges render exactly as today.

## Brand assets

- `public/favicon.svg`: tile fill `#18181b` becomes `#7c3aed`; the mark stays `#fafafa`; update the comment
  (it now differs from the app's zinc tile on purpose).
- `scripts/og/og.html` and `scripts/marketing/cover.html`: faint lavender background, violet top border and logo
  tile, lavender command box; a soft violet glow echoing the hero (builder's call on size and opacity). The
  screenshot frame in covers keeps its white background.
- `scripts/marketing/logo.html`: full-bleed `#7c3aed` square.
- Regenerate `public/og.png` (`npm run og`) and the kit (`npm run marketing`; `ffmpeg` is on PATH).
- `marketing/README.md`: the logo row says `#7c3aed` instead of `#18181b`.

## Verification

- `npm run check`, `npm test`, `npm run build`, `npm run e2e` (includes axe in light and dark).
- Screenshots of the full page in light and dark for the user, plus a close-up showing the demo window still zinc.
- Visual check of the regenerated OG image, logo and covers.

## Left to the builder

- Glow size, position and opacity on the site and share images.
- Lightness tweaks needed to pass contrast, within hue 293.

## Amendment 1 (2026-11-22): bolder hero

The first hero glow was too concentrated behind the text. Three full-width options were previewed (aurora blobs,
violet spotlight with a grid, full gradient band); the user chose a mix.

| # | Decision | Choice |
|---|---|---|
| 8 | Hero background | Full-bleed gradient band (lavender → violet → pink, hue 270 → 293 → 315 → 335) with a faint 48px grid on top; the layer starts behind the header and fades out below the hero buttons |
| 9 | Header separator | Removed, so the background flows from the top of the page |
| 10 | Share images | OG image and marketing covers use the same band and grid |

- The background is a layer inside the hero that extends up by the header's height (`h-16`), so the hero section
  becomes full width with the existing container inside it. No `100vw` tricks, no page-wide overflow setting.
- Light: gradient `oklch(0.94 0.05 270)`, `oklch(0.89 0.09 293) 35%`, `oklch(0.90 0.08 315) 65%`,
  `oklch(0.94 0.05 335)` at 160deg; grid lines `oklch(0.541 0.281 293 / 0.10)`.
- Dark: gradient `oklch(0.22 0.08 270)`, `oklch(0.28 0.13 293) 35%`, `oklch(0.26 0.12 315) 65%`,
  `oklch(0.21 0.07 335)`; grid lines `oklch(1 0 0 / 0.06)`.
- Fade: mask from opaque at 65% to transparent at the bottom of the hero.
- This replaces the soft hero glow and the soft glow on the share images described above.
