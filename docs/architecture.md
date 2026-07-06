# Architecture

## Overview

Actions Insights is a Node 20 GitHub Action that:

1. Parses test result files into a normalized model
2. Generates static HTML + JSON report pages
3. Merges reports into a GitHub Pages site tree
4. Publishes via Pages artifact or gh-pages branch
5. Updates PR comments and job summaries

## Module Structure

```
src/
├── main.ts              Entry point
├── config.ts            Input parsing
├── parsers/             TRX, JUnit, NUnit, xUnit + registry
├── model/               TestCase, TestRun, manifest types
├── generator/           HTML/CSS/JS report generation
├── history/             URL paths, retention, trends, integration
├── github/              Context, PR comments, job summary
└── publisher/           Site merger, Pages artifact, gh-pages
```

## Parser Registry

Parsers implement a common interface with `canParse()` and `parse()`. Detection order:

1. TRX (`.trx`, `<TestRun>`)
2. NUnit (`<test-run>`)
3. xUnit (`<assemblies>`)
4. JUnit (fallback for `<testsuite>`)

Duplicate tests (same `fullName`) are merged using worst-outcome-wins.

## Report Pages

Each run generates:

| File | Purpose |
|------|---------|
| `index.html` | Summary with failures above the fold |
| `all-tests.html` | Virtual-scroll table (data in `tests.json`) |
| `manifest.json` | Run metadata + failed test names |
| `summary.json` | Machine-readable export |
| `assets/` | CSS and client-side JS |

Branch-level `index.html` shows history. Root `test-reports/index.html` lists all branches/PRs.

## GitHub Pages Merge Strategy

GitHub Pages deployments replace the **entire** site. To avoid overwriting existing documentation:

### Mode 1: Artifact + Cache

1. Restore cached `_site` from previous run
2. Write new report into `{pages-subdirectory}/`
3. Apply retention (prune old `run-*` directories)
4. Save cache
5. Upload `github-pages` artifact
6. Separate `deploy-pages` job deploys the artifact

### Mode 2: gh-pages Branch

1. Clone `gh-pages` branch
2. Update only `{pages-subdirectory}/`
3. Commit and push (other directories untouched)

### First Run with Existing Site

Use `seed-from-gh-pages: true` to bootstrap the cache from an existing `gh-pages` branch, or combine doc builds and report generation in a single workflow.

## URL Strategy

Priority: PR number > tag > branch name.

```
test-reports/{branchKey}/latest/     Stable latest URL
test-reports/{branchKey}/run-{id}/   Specific workflow run
```

## History & Retention

Static JSON manifests — no database. `index.json` at the site root aggregates branches. Retention prunes `run-*` directories by count and age; `latest/` is always updated.

## Performance

- Summary page: server-rendered failures only
- All tests: `tests.json` + virtual scroll (renders visible rows)
- Search/filter: client-side on compact JSON records
