---
sidebar_position: 8
title: HTML Artifact
---

# HTML Artifact

Actions Insights generates a standalone, responsive, interactive HTML report and uploads it as a workflow artifact. The report includes per-run details and basic test history merged across runs.

![Interactive web report workflow summary](/img/html-summary.png)

## When to Enable

Enable the HTML artifact when you need:

- Deep investigation beyond what fits in a PR comment
- Offline review of test results
- Per-branch test history across workflow runs
- Sharing reports with stakeholders who do not have PR access

## Configuration

HTML artifact upload is **enabled by default** (`upload-html-report: true`).

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    upload-html-report: true
    artifact-retention-days: 30
    history: 20
    retain-days: 30
    theme: auto
```

To disable:

```yaml
with:
  upload-html-report: false
```

## Accessing the Report

1. Open the workflow run on GitHub
2. Scroll to **Artifacts**
3. Download `actions-insights-report`
4. Open `test-reports/{branch}/latest/index.html` locally

## History Across Runs

Report history is preserved via Actions cache. Each run merges into the cached site tree, prunes old runs per `history` and `retain-days`, and re-uploads the complete site.

For **persistent, org-wide history** across repositories, see [History Repository](./history-repository).

## Key Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `upload-html-report` | `true` | Upload HTML report artifact |
| `artifact-retention-days` | `30` | Artifact retention on GitHub |
| `history` | `20` | Max historical runs per branch/PR |
| `retain-days` | `30` | Max age for historical runs |
| `theme` | `auto` | `light`, `dark`, or `auto` |

## Learn More

- [Configuration Reference — Artifact](../reference/configuration#artifact)
- [Architecture — HTML Artifact](../reference/architecture#deep-dive-html-artifact)
