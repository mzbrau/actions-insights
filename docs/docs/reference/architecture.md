---
sidebar_position: 2
title: Architecture
---

# Architecture

Actions Insights is a GitHub Action that parses test result files and publishes results through GitHub-native channels. The pull request comment is the primary experience; the HTML report is a secondary artifact for deep investigation.

## Pipeline

```
1. Parse test results (TRX, NUnit, xUnit, JUnit)
2. Parse coverage files (optional: Cobertura/Coverlet, OpenCover, LCOV, JaCoCo)
3. Parse build diagnostics (optional: SARIF, MSBuild, gcc/clang logs)
4. Fetch workflow timing from GitHub API (optional, when history enabled)
5. Restore site cache (Actions cache)
6. Generate HTML report + merge into site history
7. Save site cache
8. Publish to history repository (optional)
9. Upload site as workflow artifact
10. Update PR comment (if PR context)
11. Write job summary
12. Publish check run with annotations
```

## Module Layout

```
src/
├── main.ts              Entry point
├── config.ts            Action inputs
├── parsers/             Test result format detection and parsing
├── coverage-parsers/    Coverage format detection and parsing
├── diagnostic-parsers/  Build diagnostic format detection and parsing
├── model/               TestCase, TestRun, CoverageReport, diagnostics, timing
├── generator/           HTML report pages + assets
├── history/             Site integration, retention, trends
├── reporting/           Shared markdown formatters (PR, summary, checks)
├── github/              PR comments, job summary, checks API
└── publisher/           Site cache + artifact upload
```

## Outputs

### Primary: PR Comment

A single upserted comment per pull request. Optimized for GitHub Mobile — status and failure counts appear above the fold, with expandable stack traces and links to artifacts.

### Secondary: Job Summary

TeamCity-inspired markdown tables written to `GITHUB_STEP_SUMMARY`. Includes failed tests, slowest tests, skipped tests, and links.

### Checks

A dedicated check run (default name: "Actions Insights") with a rich summary and file annotations parsed from .NET/JVM stack traces where possible.

### Deep Dive: HTML Artifact

The reports subdirectory (default `_site/test-reports`) is uploaded as two workflow artifacts:

- `actions-insights-report-{sha}.html` — unzipped self-contained HTML (opens directly in the browser)
- `actions-insights-report-{sha}` — zip containing `report.html`, `trends.json`, and optional `raw/` files

The HTML report mirrors the dashboard single-run layout (Summary, All Tests, and conditional Test Coverage / Build tabs). Trends, coverage, and build data are embedded in the HTML so the unzipped artifact works without sidecar fetches; `trends.json` remains in the zip for offline/debug use.

PR comments, job summaries, and the `artifact-url` output link to the unzipped HTML artifact. Multi-run history in the HTML report is managed via Actions cache.

## History

Report history is preserved across workflow runs using `@actions/cache`. Each run merges into the cached site tree, prunes old runs per `history` and `retain-days` settings, and re-uploads the complete site as an artifact.

History pages use relative links so the artifact is self-contained when downloaded.

## History repository JSON

When `history-enabled` is true, each run writes JSON under `{history-path}/repositories/{owner.repo}/branches/{branch}/runs/`:

| File | Content |
|------|---------|
| `{date}-{runId}.json` | Full test run (`RunRecord`) |
| `{date}-{runId}.coverage.json` | Coverage detail (optional) |
| `{date}-{runId}.diagnostics.json` | Build warnings/errors (optional) |
| `{date}-{runId}.timing.json` | Workflow job/step durations (optional) |

`history.json` stores compact `RunSummary` entries with optional `diagnostics`, `timing`, and file pointers for lazy loading in the React dashboard.

## Performance

- Single parse pass; lazy selection for markdown output
- Virtual scrolling in `all-tests.html` for large test suites
- Truncation of stack traces and failure lists in PR comments and summaries
