---
sidebar_position: 1
title: Development
---

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
| `npm run generate-sample` | Generate sample report in `_report/` and `_site/` |

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
# Full history site (as uploaded in workflow artifact):
open _site/test-reports/main/latest/index.html
```

### Your own test result files

Put exports in `.local-results/` (gitignored) and generate a report:

```bash
npm run generate-local -- .local-results/unit-test-results.trx
open _report/all-tests.html
```

For NUnit XML:

```bash
npm run generate-local -- .local-results/nunit-results.xml
```

`npm run generate-sample` always uses the small TRX fixture in `test/fixtures/` — not `.local-results/`.

Set `UPDATE_GOLDEN=1` to refresh golden file snapshots.

## Building the Action

The build uses TypeScript + `esbuild` to produce a single `dist/index.js` bundle. Generator assets (CSS/JS) are copied to `dist/assets/`.

## Adding a Parser

1. Create `src/parsers/myformat.ts` implementing `TestResultParser`
2. Register in `src/parsers/registry.ts` (order matters for detection)
3. Add fixture in `test/fixtures/`
4. Add tests in `test/parsers/`

See [Contributing](./contributing).
