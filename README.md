# BEARCLAW demo

Live, interactive build of the BEARCLAW benchmark page. Same stack as `avail-demo` —
Vite + React + TypeScript + Tailwind — so it deploys the same way.

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Resize the window / use browser dev tools' device
toolbar to check the responsive behavior — the nav collapses to a hamburger menu,
the leaderboard and mini score table scroll horizontally, and every grid drops to
a single column below `md` (768px).

## Build for production

```bash
npm run build
```

Outputs to `dist/`. Already verified to build cleanly (TypeScript strict mode +
Vite bundling, zero errors) before delivery.

## Deploy

Same as AVAIL: push this to a new GitHub repo (e.g. `bearclaw-demo`), then import it
into Vercel — it'll auto-detect the Vite framework and deploy with no extra config.

## What's real vs. what to double-check

- **Leaderboard, findings, roadmap, case study**: hardcoded in `src/staticData.ts`,
  matching the finalized Figma design exactly.
- **Explore widget**: wired to the real BEARCLAW dataset (`src/exploreData.json`,
  generated from the published `bearclaw-benchmark` dataset) — real prompts, real
  model responses, real judge reasoning excerpts (truncated to ~1-2 sentences for
  the accordion; full reasoning lives in the published dataset on Hugging Face).
  Three commission-arm items don't have a Perplexity response in the underlying
  dataset (a real gap in the original data collection, not a bug here) — the
  toggle only shows models that actually have data for the selected scenario.
- **Colors, fonts, and component shapes**: matched to AVAIL's own `tailwind.config.js`
  token names (`ink`, `cloud`, `slate`, `rust`) so the two sites share a visual
  language, with `cloud` used as BEARCLAW's page background (the opposite of how
  AVAIL uses it) per your earlier direction.
- **Visual polish**: I verified this compiles and bundles cleanly, but I can't
  render or screenshot a live page myself — worth a visual pass on your end,
  especially spacing/sizing at a few breakpoints, before calling it final.
