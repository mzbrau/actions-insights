---
sidebar_position: 5
title: Migrate to History Repository
---

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

There is no automatic migration from cache to history repo in v1. New runs will populate the history repository going forward.

To backfill from **workflow artifacts** (when your CI uploads TRX/JUnit/XML test results), use the [import script](import.md):

```bash
bash scripts/import-history-repo.sh import owner/my-app owner/my-history \
  --artifact-name test-results --limit 50
```

Cache-based `runs.json` is not imported automatically in v1.
