# AGENTS.md — Shared Packages

Pure TypeScript workspace packages shared between the GitHub Action (`src/`), the web dashboard (`web/`), and history-repo tooling.

Parent guidance: [`../AGENTS.md`](../AGENTS.md).

## Packages

| Package | Path | Role |
|---------|------|------|
| `@actions-insights/history-models` | `history-models/` | Shared JSON schemas and types for history repo data |
| `@actions-insights/history-publisher` | `history-publisher/` | Pure functions for building history repo file updates (paths, retention, build-update) |

## Consumers

- `src/history-repo/` — publishes test run data to a dedicated git repository
- `web/` — reads history repo JSON to render the dashboard
- Each other — `history-publisher` depends on `history-models`

## Path aliases

Root [`tsconfig.json`](../tsconfig.json) and [`vitest.config.ts`](../vitest.config.ts) map:

```
@actions-insights/history-models  →  packages/history-models/src
@actions-insights/history-publisher  →  packages/history-publisher/src
```

Imports use the package name, not relative paths across workspace boundaries.

## Conventions

- Keep packages **side-effect free** — no filesystem, network, or GitHub API calls.
- Action I/O (reading files, calling GitHub APIs) belongs in `src/`, not here.
- Export types and pure functions from each package's `src/index.ts`.
- When changing shared models, update tests in the root `test/` directory (covered via path aliases).

## Testing

Root `npm test` covers packages through Vitest path aliases. Add or update tests in `test/` when changing shared models or publisher logic — do not add a separate test runner per package.
