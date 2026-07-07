# Migration Guide

## From cache-only history

The existing Actions cache history (`_site/.../.history/`) continues to work unchanged. History repository publishing is an **optional enhancement**.

You can run both in parallel:

```yaml
- uses: owner/actions-insights@v1
  with:
    history-enabled: true
    history-repository: my-org/test-history
    history-token: ${{ secrets.ACTIONS_INSIGHTS_HISTORY_TOKEN }}
    # Existing settings unchanged
    history: 20
    retain-days: 30
    upload-html-report: true
```

## What changes

| Before | After (with history enabled) |
|--------|------------------------------|
| History in Actions cache only | JSON also persisted in git |
| HTML artifact for investigation | React dashboard on GitHub Pages |
| Per-workflow cache dependency | Durable cross-workflow history |

## What does not change

- PR comments, job summaries, and check runs
- HTML report artifacts
- Local cache-based history for trends in the HTML report

## Migrating existing data

There is no automatic migration from cache to history repo in v1. New runs will populate the history repository going forward. Consider backfilling with a script that reads `runs.json` from cache and publishes if needed.
