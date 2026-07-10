# AGENTS.md — Web Dashboard

React SPA that reads JSON from an Actions Insights **history repository** and renders a multi-run test dashboard. This is **not** the GitHub Action itself — action logic lives in `src/`.

Parent guidance: [`../AGENTS.md`](../AGENTS.md).

## Stack

- React 18, React Router 6 (HashRouter), Vite 6
- Vitest + Testing Library (jsdom)
- `@tanstack/react-virtual` for large test lists
- `@actions-insights/history-models` from `packages/`

## Entry points

- [`src/main.tsx`](src/main.tsx) — React root with `HashRouter`
- [`src/App.tsx`](src/App.tsx) — route definitions

## Routes

| Path | Page |
|------|------|
| `/` | Home redirect |
| `/r/:repoKey` | Repository dashboard |
| `/r/:repoKey/b/:branchKey` | Branch redirect |
| `/r/:repoKey/b/:branchKey/run/:runId` | Run detail |

## Directory layout

```
web/src/
├── components/    UI components (layout, charts, tables)
├── pages/         Route-level page components
├── hooks/         Custom React hooks
├── utils/         Data loading, formatting helpers
├── styles/        Global and component styles
└── theme/         Theme tokens and dark mode
```

## Design system

Follow [`design-system/actions-insights/MASTER.md`](../design-system/actions-insights/MASTER.md) for colors, typography, spacing, and component patterns. UI mockup inspiration is in `reference/`.

When building a specific page, check `design-system/pages/[page-name].md` first — page rules override the master file.

## Commands

```bash
npm run dev --workspace=@actions-insights/web      # Vite dev server
npm test --workspace=@actions-insights/web          # Vitest (jsdom)
npm run build --workspace=@actions-insights/web     # tsc -b && vite build
```

Or from repo root: `npm run build:web`.

## Gotchas

- `web/src/version.ts` is **generated** by `scripts/write-version.mjs` (gitignored). It runs automatically via `predev`, `prebuild`, and `pretest` hooks.
- `VITE_BASE_PATH` env var controls the base path for GitHub Pages deployment (see `web/vite.config.ts`).
- HashRouter is used intentionally — the dashboard is deployed as static files without server-side routing.
