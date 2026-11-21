# Marketing site for job-applications-tracker: design

Status: approved by the user (2026-11-21)
Date: 2026-11-21

## Intent

A static promotional site for [job-applications-tracker](https://github.com/kapantzak/job-applications-tracker) (the "app"), deployed on Vercel.

- **Audience:** developers who already use an AI coding agent (Claude Code, Codex or their own). Amended 2026-11-21 (decision 14): the site is agent-neutral; Claude Code is named as the default agent.
- **Goal:** the visitor installs the app (`npx job-applications-tracker`).
- **Centrepiece:** a "journey" that explains simply how the app works, built as a mocked app UI with polished animations (not screenshots).

Why this audience matters to the content: Claude Code is the app's default agent. With it installed, the app skips agent Setup (app README, "First run" step 2). Gmail sync uses the claude.ai Gmail connector, which the user connects once in their claude.ai account (README, "Gmail access for other agents"). The first start also asks where to keep data (README, "First run" step 1).

For this visitor, the pitch is **"no agent setup"** (decision 11). It is not "zero setup", which would overclaim. Since decision 14 it is qualified: "no agent setup with Claude Code", because Codex and custom commands are chosen in Setup and need their own Gmail MCP server.

## Goals

- A visitor understands what the app does within one scroll, and can copy the install command from the hero without scrolling.
- The journey shows the whole loop in five steps, each with one short line of copy.
- Fast and accessible: static HTML for everything except the journey; reduced-motion visitors get a full, static experience.
- Deploys automatically from GitHub to Vercel.

## Non-goals

- Documentation. The site links to the app's GitHub README for details.
- A blog, changelog, pricing, sign-up, newsletter, or any backend.
- A custom domain (later; no code change needed).

## Anti-goals (failure even if it "works")

- **Overclaiming privacy.** Data is stored locally, but the profile, the CV text and Gmail content are sent to the visitor's own agent (for example, Claude Code, which talks to Anthropic). Copy must never say "nothing leaves your machine" or "offline". Every factual claim must be traceable to the app README.
- **Claims the app does not support.** The app never applies to jobs, sends mail, or changes labels or messages (README "Security"). Do not imply auto-apply.
- **Real companies in the mock.** Use only invented names and `example.com` addresses, as the app's own sample data does.
- **Scroll-jacking.** The page always scrolls natively. The journey uses sticky positioning and scroll *progress*; it never intercepts wheel or touch events.
- **Third-party tracking.** No cookies, no Google Fonts or other third-party font CDNs, no external scripts other than Vercel Web Analytics.

## Constraints

- Static output only.
- Vercel, deployed through the GitHub integration from the public repo `kapantzak/job-applications-tracker-website`.
- The app's visual language is the source of truth for the mock. The app repo is pinned for reference at commit `13026cd918363d84aff433bd7e3417ae18e619ca`:
  - `src/ui/styles.css`: Tailwind v4 colour variables (shadcn defaults plus the app's success/warning colours), light and dark.
  - `components.json`, `src/ui/components/ui/*`: shadcn components.
  - `src/ui/components/{StatusBadge,VerificationBadge,LogoMark}.tsx`, `src/ui/components/dashboard/*`: badge, logo and dashboard visuals.
  - Font: Manrope (variable).
  - Icons: lucide.
  - Copying from the app is fine: same owner, MIT.
  - The pinned commit is one commit ahead of npm `0.2.0` (a Gmail sync internals change). Site copy must describe behaviour that is in the published npm version.
- Browsers: at least the app's own baseline (Chrome/Edge 111+, Safari 16.4+, Firefox 128+).

## Approaches considered

| # | Option | Trade-off | Picked |
|---|---|---|---|
| Framework | A. Astro + one React island for the journey | Static HTML with no JS for the text sections; the island reuses the app's React/shadcn code. One more framework to know. | **A** |
| | B. Vite + React SPA (same as the app) | Familiar, but without a prerender step the whole page needs JS to render, which hurts SEO and first paint. | |
| | C. Next.js static export | Vercel-native and prerendered, but heavy for one page and ships React for the whole page. | |
| Animation | A. Motion (`motion` package) | Built for React, scroll-linked values (`useScroll`), `useReducedMotion`. About 30–40 KB JS (estimate, unmeasured). | **A** |
| | B. GSAP ScrollTrigger | Most powerful for scroll sequences, but drives the DOM directly, which is awkward in React. | |
| | C. CSS scroll-driven animations | Ships no JS, but browser support is uncertain and complex sequences are hard to express. | |
| Journey interaction | A. Scroll-driven, sticky mock on desktop; autoplay with step tabs on narrow screens | Most immersive; the largest build cost in the project. | **A** |
| | B. Autoplay loop with step tabs everywhere | Cheaper and works everywhere, but the visitor watches rather than drives it. | |
| | C. Click-through stepper | Simplest, but few visitors click past step two. | |
| Scope | A. Single landing page, docs on GitHub | No duplicated docs to drift. | **A** |
| | B. Landing page plus docs pages | Better SEO, but the README changes often, so the copy goes stale. | |

## Decided by the user

1. Journey has five steps (below).
2. Scroll-driven on desktop, autoplay with tabs on narrow screens; motion is disabled for visitors whose system is set to reduce motion.
3. Single landing page; documentation lives in the GitHub README.
4. Include the real demo video (`docs/video/demo.mp4`, 2.1 MB, plus `demo-poster.png`, 80 KB), copied into this repo and lazy-loaded.
5. Light and dark themes, following the system setting.
6. Astro, with a React island for the journey.
7. Motion for animation.
8. Vercel GitHub integration: `main` deploys to production, PRs get preview URLs.
9. Free `*.vercel.app` address for now.
10. Vercel Web Analytics for page views (extended by decision 13).
11. Pitch: "no agent setup".
    - The hero says the app works with the Claude Code you already have.
    - The Claude Code section is a short "ready in two steps" list: run `npx`, then optionally connect Gmail in claude.ai for sync.
    - "Zero setup" must not be used.
12. The builder performs the Vercel account steps with the CLI, on the team "kapantzak's projects" (Pro plan).
    - Each account action (create or import the project, connect Git, enable Analytics) is confirmed with the user before it runs.
    - The builder then verifies the live site.
13. Count clicks on the install-command copy buttons as a Web Analytics custom event, for example `track('copy_install', { location: 'hero' | 'install' })`.
    - Before building it, the builder confirms in Vercel's docs that the Pro plan includes custom events. If it does not, stop and ask the user.

### Copy review decisions (2026-11-21)

14. Agent-neutral copy (supersedes the Claude-Code-only wording of decision 11).
    - The headline says "the AI agent you already use"; Claude Code, Codex and custom commands are named where it matters.
    - Claims that hold only for Claude Code are labelled as such ("no agent setup with Claude Code"; Gmail via the claude.ai connector for Claude Code, a Gmail MCP server for other agents; the spend cap is Claude Code only).
    - Journey step 2 becomes "Your agent finds jobs, the app checks every link". The page title and OG image drop "with Claude Code".
15. The Claude Code section becomes "Works with your agent": run `npx`; pick your agent (Claude Code is used automatically, Codex or a custom command in Setup); optionally connect Gmail (claude.ai connector for Claude Code, a Gmail MCP server for others).
16. Accuracy fixes, reworded agent-neutrally: meta description; step 1 ("The app reads the text of your CV and your agent suggests…"); FAQ "the links of the 200 newest jobs you already have"; keep the FAQ sentence about content reaching the agent's model.
17. Keep all 16 invented company names, including Umbrella Health (the app's own sample data).
18. Journey: a small "A few weeks later" cue in the mock at step 3, so the existing applications list makes sense after a brand-new profile.
19. Narrow-screen autoplay also stops when the visitor focuses or touches anything in the journey.
20. Focus indicator: a solid, full-strength ring on `:focus-visible`.
21. Accept that narrow screens with scripts blocked (not disabled) show only step 1's line.
22. Vercel: turn the Vercel Toolbar off for this project; use a Protection Bypass for Automation secret locally (never committed) to test previews; pin `engines.node` to `24.x`.

## Page structure

```
Header       logo · GitHub link
Hero         headline · one-line subhead · copyable `npx job-applications-tracker` · "View on GitHub"
Journey      the animated mocked app (five steps)
Why trust it data stored locally (SQLite) · your own agent · nothing changes until you accept · never applies or sends mail
Your agent   works with your agent: `npx` · pick your agent (Claude Code automatic; Codex/custom in Setup) · (optional) Gmail
Demo video   real recording, poster first, loads on scroll
Install      `npx` and `npm i -g` + `jobtrack` · requirements (Node 22+) · short FAQ
Footer       GitHub · npm · MIT licence
```

- The FAQ covers: other agents (Codex, a custom command); what is sent to the agent; where data lives (`~/.job-applications-tracker/`); desktop browsers only; cost (it uses your Claude Code plan; Max effort uses more).
- All copy is drafted by the builder and reviewed by the user before launch.

## The journey

A mocked app window (sidebar plus main area, matching the app's layout) shows one screen per step. The data is invented: the "Frontend Platform" profile, Acme Robotics, Umbrella Health and Northwind Studio, with `example.com` senders.

| # | Step (copy idea) | What animates in the mock |
|---|---|---|
| 1 | Drop your CV, get a profile | A file card drops in → "Analysing CV" progress bar → profile form fields fill in (target roles as tags, locations, remote, seniority) |
| 2 | Claude Code finds jobs, the app checks every link | "Find jobs" pressed → plain-words log lines stream in → jobs table rows appear; each gets a badge (Verified / Redirected / Could not verify) and a Fit column (✓ ✗ ?) |
| 3 | Mark one applied | A row's status changes Saved → Applied; the Applications list gains a row |
| 4 | Sync Gmail, review what it found | "Sync from Gmail" → a Review card with evidence (From / Date / Subject / snippet) → Accept → status becomes Interview |
| 5 | See where everything stands | The Dashboard: tiles count up, the status bar fills, the funnel bars grow |

Behaviour:

- **Desktop (≥ 1024 px):**
  - Two columns: step copy on one side scrolls normally; the mock window is `position: sticky` on the other.
  - Scroll progress through each step's section drives that step's animation, and reversing the scroll reverses it.
  - The active step is highlighted in a step indicator.
- **Narrow screens (< 1024 px):**
  - One mock window above step tabs.
  - It autoplays through the steps in a loop while visible, and pauses when off-screen or when the tab is hidden.
  - Tapping a tab jumps to that step and pauses autoplay.
- **Reduced motion:**
  - No autoplay and no scroll-linked animation.
  - Each step shows its final state statically, and tabs or the step list still switch steps.
- **Accessibility:**
  - The mock is decorative (`aria-hidden`); the step copy carries the meaning.
  - Step tabs are real buttons, usable from the keyboard.
- **Fidelity:** the mock reuses the app's colour variables and shadcn styles. It is a simplified rendering, not a pixel copy; small inaccuracies are acceptable when they help clarity.

## Technical notes

- **Stack:** Astro (static output), `@astrojs/react`, Tailwind v4, `motion`, `lucide-react`, Manrope via `@fontsource-variable/manrope` (self-hosted), `@vercel/analytics`. Package manager: npm.
- **Install command:** copy-to-clipboard button with a visible "Copied" confirmation and a selectable-text fallback.
- **SEO:** title, meta description, Open Graph/Twitter image (a static image designed for the site), and a favicon derived from the app's `LogoMark`.
  - Absolute URLs (canonical, OG image) come from a single `site` setting in the Astro config.
  - Until the production address is known, that setting is read from Vercel's production-URL environment variable (builder's call).
- **Theme:** follows `prefers-color-scheme`; no manual toggle (not requested).
- **Video:** `<video>` with `controls`, `muted`, `playsinline` and `preload="none"`, with the poster shown first.
- **Quality bar (targets, not guarantees):** mobile Lighthouse performance ≥ 90 and accessibility ≥ 95; no layout shift from the journey or the fonts.
- **Vercel setup:** see decision 12. The CLI is logged in to the team "kapantzak's projects".

## Left to the builder

- Exact copy (headline, step lines, FAQ), presented to the user for review.
- The internal structure of the journey components and the animation timings.
- Exact breakpoints within the stated ranges, and the visual design of the non-journey sections, consistent with the app's look.
- How to test: at minimum, `astro check`, a production build, and a browser check at desktop width, phone width and with reduced motion on.

## Follow-up opportunities (not in scope)

- Point the app's `package.json` `homepage` and README at the new site (separate repo).
- A custom domain.
