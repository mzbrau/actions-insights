---
sidebar_position: 1
title: Configuration
---

# Configuration Reference

## Permissions

```yaml
permissions:
  contents: read          # Required
  pull-requests: write    # PR comments (fork PRs may need pull_request_target)
  checks: write           # Check runs and annotations
```

## Inputs

### Test Results

#### `test-results`
Glob pattern for test result files.

- **Default:** `**/*.{trx,xml}`

### Reporting

#### `reports-subdirectory`
Subdirectory within the site artifact for test reports.

- **Default:** `test-reports`

#### `report-title`
Title displayed in report UI and GitHub outputs.

- **Default:** `Actions Insights`

#### `report-output`
Local directory for the current run's report files.

- **Default:** `_report`

#### `site-output`
Local directory for the merged site with history.

- **Default:** `_site`

### PR Comment

#### `comment-mode`
PR comment behavior.

- **Default:** `update`
- **Values:** `update` (upsert single comment), `off`

#### `max-failed-tests-in-comment`
Maximum failed tests shown in the PR comment.

- **Default:** `10`

#### `max-stack-trace-lines`
Maximum stack trace lines before truncation.

- **Default:** `25`

#### `include-stdout` / `include-stderr`
Include stdout/stderr in failure details.

- **Default:** `true`

### Job Summary

#### `generate-job-summary`
Write a GitHub Actions job summary.

- **Default:** `true`

#### `max-failed-tests-in-summary`
Maximum failed tests in the job summary table.

- **Default:** `20`

### Checks

#### `publish-checks`
Publish a GitHub check run.

- **Default:** `true`

#### `check-name`
Name of the check run.

- **Default:** `Actions Insights`

### Artifact

#### `upload-html-report`
Upload the HTML report site as a workflow artifact.

- **Default:** `true`

#### `artifact-retention-days`
Retention days for the uploaded artifact.

- **Default:** `30`

### History

#### `history`
Maximum historical runs retained per branch/PR.

- **Default:** `20`

#### `retain-days`
Maximum age in days for historical runs.

- **Default:** `30`

### Display

#### `theme`
Report theme: `light`, `dark`, or `auto`.

- **Default:** `auto`

#### `slow-test-threshold-ms`
Duration threshold for marking tests as slow.

- **Default:** `1000`

#### `include-slowest-tests`
Number of slowest tests to include (0 to disable).

- **Default:** `10`

### Authentication

#### `github-token`
Token for GitHub API calls.

- **Default:** `${{ github.token }}`

## Outputs

| Output | Description |
|--------|-------------|
| `workflow-url` | URL to the workflow run |
| `artifact-url` | URL to workflow artifacts |
| `status` | `passed` or `failed` |
| `total` | Total test count |
| `passed` | Passed count |
| `failed` | Failed count |
| `skipped` | Skipped count |

## History Repository (optional)

Publish structured JSON to a persistent history repository for the GitHub Pages dashboard. See [History Repository Configuration](../history-repository/configuration) for full details.

| Input | Default | Description |
|-------|---------|-------------|
| `history-enabled` | `false` | Enable JSON publishing |
| `history-repository` | `''` | History repo (`owner/repo`) |
| `history-token` | `''` | Token with write access (required when enabled) |
| `history-branch` | `main` | Target branch |
| `history-path` | `data` | Data root path |
| `history-repository-name` | `auto` | Source repo key |
| `history-mode` | `multi` | Reserved |
| `history-default-repository` | `''` | Default dashboard repository |
| `history-pages-url` | `''` | Base URL for the history dashboard (GitHub Pages). If unset, Actions Insights will try to discover it or fall back to `https://{owner}.github.io/{repo}/`. |

## Deprecated Inputs

These inputs are ignored with a deprecation warning:

| Deprecated | Replacement |
|------------|-------------|
| `pages-subdirectory` | `reports-subdirectory` |
| `publish-pages` | Removed — use `upload-html-report` |
| `pages-mode` | Removed |
| `seed-from-gh-pages` | Removed |
| `comment-pr` | `comment-mode` |

## Example

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    comment-mode: update
    max-failed-tests-in-comment: 10
    max-stack-trace-lines: 25
    include-slowest-tests: 10
    upload-html-report: true
    publish-checks: true
```
