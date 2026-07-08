---
sidebar_position: 3
title: Choose Your Outputs
---

# Choose Your Outputs

Actions Insights publishes test results through up to four channels. Each is optional — enable only what your team needs.

## Output Decision Matrix

| Output | Default | When to use | Key inputs |
|--------|---------|-------------|------------|
| [PR comments](./pr-comments) | **On** | Reviewing failures without leaving the PR | `comment-mode` |
| [Workflow summary](./workflow-summary) | **On** | Desktop review on the workflow run page | `generate-job-summary` |
| [HTML artifact](./html-artifact) | **On** | Deep investigation, offline review, test history | `upload-html-report` |
| [History repository](./history-repository) | **Off** | Org-wide dashboards across repos and branches | `history-enabled` |

Additionally, **GitHub Checks** are published by default (`publish-checks: true`) with file annotations parsed from stack traces.

## Recommended Paths

### Pull Request Workflows

Enable PR comments + workflow summary. Most developers review failures in the PR comment; the job summary provides a desktop-friendly table.

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    comment-mode: update
    generate-job-summary: true
```

### Main Branch / Scheduled Runs

PR comments are not applicable. Enable workflow summary + HTML artifact for post-run investigation.

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    comment-mode: off
    generate-job-summary: true
    upload-html-report: true
```

### Organisation-Wide Visibility

Add the [history repository](./history-repository) on top of any of the above. This pushes structured JSON to a dedicated repo and hosts a React dashboard on GitHub Pages.

## Setup Journey

Follow these steps in order:

1. **[Prepare test output](./prepare-test-output)** — configure your test runner to write result files
2. **[Add the action](./add-action)** — add the Actions Insights step to your workflow
3. **Configure outputs** — pick the channels above that match your needs
4. **[Example workflows](./example-workflows)** — copy a complete workflow for your scenario

## Architecture Overview

For a deeper understanding of how parsing, caching, and publishing work, see [Architecture](../reference/architecture).
