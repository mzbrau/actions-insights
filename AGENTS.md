# AGENTS.md

Guidance for AI coding agents working on the **actions-insights** repository.

> **Not to be confused with** [`docs/docs/setup/ai-setup.md`](docs/docs/setup/ai-setup.md) — that playbook helps end users set up Actions Insights in *their* repos. This file is for developing *this* repo.

## Project summary

GitHub Action monorepo that parses test result files (TRX, JUnit, NUnit, xUnit), generates self-contained HTML reports, and publishes results through GitHub-native channels (PR comments, job summaries, checks, workflow artifacts). Optional long-term history is stored in a dedicated git repository with a React dashboard.

## Repository map

| Path | Purpose |
|------|---------|
| `src/` | GitHub Action source (parsers, generator, history, reporting, GitHub API) |
| `test/` | Vitest unit tests; fixtures in `test/fixtures/` |
| `action.yml` | Action manifest — **source of truth** for inputs and defaults |
| `dist/` | Bundled action output (`esbuild` → `dist/index.js`) — **committed to git** |
| `web/` | React SPA dashboard for history repositories — see [`web/AGENTS.md`](web/AGENTS.md) |
| `docs/` | Docusaurus documentation site — see [`docs/AGENTS.md`](docs/AGENTS.md) |
| `packages/` | Shared workspace packages — see [`packages/AGENTS.md`](packages/AGENTS.md) |
| `examples/` | Example workflow YAMLs (dotnet, java, python, javascript) |
| `templates/history-repo/` | Scaffold for dedicated history repositories |
| `scripts/` | Build helpers, sample generation, history import |
| `design-system/` | UI design tokens and rules for the web dashboard |

Generated / gitignored paths: `lib/` (tsc output), `_report/`, `_site/`, `.local-results/`.

## Architecture

Entry point: [`src/main.ts`](src/main.ts) → bundled to [`dist/index.js`](dist/index.js) via `action.yml`.

```
parse test files → restore site cache → integrate report into site history
→ save cache → (optional) publish to history repo → upload HTML artifact
→ upsert PR comment → write job summary → publish check run → set outputs
```

Module layout:

```
src/
├── main.ts              Entry point
├── config.ts            Action inputs (reads action.yml)
├── parsers/             Format detection and parsing
├── model/               TestCase, TestRun, manifests
├── generator/           HTML report pages + assets
├── history/             Site integration, retention, trends
├── reporting/           Shared markdown formatters (PR, summary, checks)
├── github/              PR comments, job summary, checks API
├── publisher/           Site cache + artifact upload
└── history-repo/        Publish JSON to dedicated git repo
```

Full details: [`docs/docs/reference/architecture.md`](docs/docs/reference/architecture.md).

## Development commands

Prerequisites: Node.js 24+, npm.

```bash
npm ci                    # install all workspaces
npm test                  # run root Vitest suite
npm run lint              # TypeScript type check (tsc --noEmit)
npm run build             # tsc + copy assets + esbuild bundle → dist/
npm run generate-sample   # sample output in _report/ and _site/
npm run generate-local -- <path>   # report from your own result file
npm run build:web         # build React dashboard
npm run docs:start        # Docusaurus dev server
npm run docs:build        # build documentation site
```

Local testing workflow:

```bash
npm test
npm run generate-sample
open _report/index.html
open _site/test-reports/main/latest/index.html
```

Put your own result files in `.local-results/` (gitignored) and run `npm run generate-local`.

## Critical constraints

- **`action.yml` is the source of truth** for action inputs and defaults — not README tables.
- **`dist/` is committed.** Any change under `src/` that affects the bundled action requires `npm run build` and updated `dist/index.js` in the PR.
- **`lib/` is generated** by `tsc` and gitignored — never edit manually.
- **Parser registration order matters** in [`src/parsers/registry.ts`](src/parsers/registry.ts): TRX → NUnit → xUnit → JUnit for XML auto-detection.
- **Normalize to `TestCase`** in [`src/model/test-case.ts`](src/model/test-case.ts) — all parsers must map to this model.
- **Focused diffs** — no unrelated refactors. Parser and history logic changes require Vitest coverage.
- **Update docs** when changing `action.yml` inputs or user-facing behavior (see [`docs/AGENTS.md`](docs/AGENTS.md)).

## Adding a parser

1. Create `src/parsers/myformat.ts` implementing `TestResultParser` from `src/parsers/types.ts`.
2. Map results to the normalized `TestCase` model.
3. Register in `src/parsers/registry.ts` (order matters for detection).
4. Add a fixture in `test/fixtures/` and tests in `test/parsers/`.
5. Run `npm test` and `npm run build`.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Adding a coverage parser

1. Create `src/coverage-parsers/myformat.ts` implementing `CoverageParser` from `src/coverage-parsers/types.ts`.
2. Map results to the normalized `CoverageReport` model in `packages/history-models/src/coverage.ts`.
3. Register in `src/coverage-parsers/registry.ts` (detection order matters).
4. Add a fixture in `test/fixtures/coverage/` and tests in `test/coverage-parsers/`.
5. Run `npm test` and `npm run build`.

## CI expectations

On every PR, CI runs: `npm run lint` → `npm test` → `npm run build` → `npm run generate-sample` → verify output files.

Run these locally before finishing a task.

## Further reading

- [Development Guide](docs/docs/development.md)
- [Architecture](docs/docs/reference/architecture.md)
- [Contributing](CONTRIBUTING.md)
- [Design system](design-system/actions-insights/MASTER.md) (for web UI work)
