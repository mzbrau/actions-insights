# Development Guide

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
git clone https://github.com/mzbrau/actions-insights.git
cd actions-insights
npm ci
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run Vitest unit tests |
| `npm run lint` | TypeScript type check |
| `npm run build` | Compile and bundle action to `dist/` |
| `npm run generate-sample` | Generate sample report in `_report/` |

## Project Layout

- `src/` — Action source code
- `test/fixtures/` — Sample TRX, JUnit, NUnit, xUnit files
- `test/` — Unit and snapshot tests
- `reference/` — UI design mockups (inspiration)
- `dist/` — Bundled action output (generated)

## Testing Locally

```bash
npm test
npm run generate-sample
open _report/index.html
```

Set `UPDATE_GOLDEN=1` to refresh golden file snapshots.

## Building the Action

The build uses TypeScript + `@vercel/ncc` to produce a single `dist/index.js` bundle. Generator assets (CSS/JS) are copied to `dist/assets/`.

## Adding a Parser

1. Create `src/parsers/myformat.ts` implementing `TestResultParser`
2. Register in `src/parsers/registry.ts` (order matters for detection)
3. Add fixture in `test/fixtures/`
4. Add tests in `test/parsers/`

See [CONTRIBUTING.md](../CONTRIBUTING.md).
