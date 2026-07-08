---
sidebar_position: 2
title: Architecture
---

# Architecture

Actions Insights is a GitHub Action that parses test result files and publishes results through GitHub-native channels. The pull request comment is the primary experience; the HTML report is a secondary artifact for deep investigation.

## Pipeline

```
1. Parse test results (TRX, NUnit, xUnit, JUnit)
2. Restore site cache (Actions cache)
3. Generate HTML report + merge into site history
4. Save site cache
5. Upload site as workflow artifact
6. Update PR comment (if PR context)
7. Write job summary
8. Publish check run with annotations
```

## Module Layout

```
src/
├── main.ts              Entry point
├── config.ts            Action inputs
├── parsers/             Format detection and parsing
├── model/               TestCase, TestRun, manifests
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

The full `_site/` directory is uploaded as the `actions-insights-report` artifact. It includes:

- Per-run reports (`index.html`, `all-tests.html`)
- Branch/PR history pages with trends
- Multi-run retention managed via Actions cache

Download the artifact from the workflow run and open `test-reports/{branch}/latest/index.html` locally.

## History

Report history is preserved across workflow runs using `@actions/cache`. Each run merges into the cached site tree, prunes old runs per `history` and `retain-days` settings, and re-uploads the complete site as an artifact.

History pages use relative links so the artifact is self-contained when downloaded.

## Performance

- Single parse pass; lazy selection for markdown output
- Virtual scrolling in `all-tests.html` for large test suites
- Truncation of stack traces and failure lists in PR comments and summaries
