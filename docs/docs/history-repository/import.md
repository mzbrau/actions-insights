---
sidebar_position: 4
title: Import
---

# Importing historical test data

Backfill a history repository with test results from **previous workflow runs** on a source repository. The import tool downloads **raw test-result artifacts** (TRX, JUnit, NUnit, xUnit), parses them with the same parsers as the action, converts them to history JSON, and opens a pull request.

## Prerequisites

- `gh` and `git` on your PATH
- Node.js 20+ (for the TypeScript import engine)
- Authenticated `gh auth login` (or `GITHUB_TOKEN`)
- Read access to the source repository's Actions runs and artifacts
- Write access to the history repository (for the PR branch)
- Workflows that **upload test result files as artifacts** (for example `test-results` containing `*.trx` or `*.xml`)

GitHub Actions artifact retention applies: runs whose artifacts have expired cannot be imported.

## Quick start

From an actions-insights checkout:

```bash
bash scripts/import-history-repo.sh import owner/my-app owner/my-history \
  --artifact-name test-results --limit 20
```

Or via the optional GitHub CLI extension:

```bash
gh actions-insights import owner/my-app owner/my-history --artifact-name test-results
```

From the monorepo directly (after cloning the history repo yourself):

```bash
npm run import-history -- owner/my-app --repo-path /path/to/history-repo \
  --artifact-name test-results
```

## Confirmation and dry-run

Like `init` and `update`, the bash wrapper shows a summary and asks `Proceed? [Y]es / [n]o / [e]dit:` before cloning or writing. Use `--dry-run` to preview without changes, or `--yes` for CI.

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--artifact-name <name>` | auto-detect | Exact artifact name (repeatable) |
| `--artifact-pattern <glob>` | — | Artifact name glob (repeatable) |
| `--test-results-glob` | `**/*.{trx,xml}` | Glob inside downloaded artifact |
| `--workflow <name\|id>` | all | Filter workflow runs |
| `--branch <name>` | all | Filter by branch |
| `--since <ISO date>` | none | Only runs after date |
| `--limit <n>` | `50` | Max runs to scan |
| `--history-limit` | `20` | Branch history limit |
| `--retain-days` | `30` | Retention window |
| `--data-path` | `data` | History data root |

When no artifact name or pattern is given, the importer tries each artifact on a run and uses the first one that contains parseable test files.

## Workflow example

Upload test results as artifacts so historical runs can be imported later:

```yaml
- run: dotnet test --logger "trx;LogFileName=results.trx"
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-results
    path: '**/*.trx'
```

## What gets written

For each imported run, the tool writes the same JSON files as a live `history-enabled` publish:

- `data/repositories.json`
- `data/repositories/{owner.repo}/metadata.json`, `branches.json`, `tests.json`
- `data/repositories/{owner.repo}/branches/{branchKey}/latest.json`, `history.json`
- `data/repositories/{owner.repo}/branches/{branchKey}/runs/{timestamp-runId}.json`

Runs already present in the history repository (matched by `workflowRunId`) are skipped.

Imported JSON uses **schema v2** (minified, class dictionaries, name index). See [Data model](data-model.md).

## Related

- [Migration guide](migration.md) — moving from cache-only history
- [Deployment](deployment.md) — initializing and updating the history repository
