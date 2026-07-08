---
sidebar_position: 3
title: Migrate from GitHub Pages
---

# Migration from GitHub Pages

Actions Insights no longer publishes to GitHub Pages. Reports are delivered through GitHub-native channels (PR comments, job summaries, checks) with the HTML report uploaded as a workflow artifact.

## Workflow Changes

### Before (GitHub Pages)

```yaml
permissions:
  contents: write
  pages: write
  id-token: write
  pull-requests: write

jobs:
  test:
    steps:
      - uses: mzbrau/actions-insights@v1
        with:
          test-results: '**/*.trx'

  deploy-pages:
    needs: test
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

### After (GitHub-Native)

```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write

jobs:
  test:
    steps:
      - uses: mzbrau/actions-insights@v1
        with:
          test-results: '**/*.trx'
```

Remove the `deploy-pages` job entirely.

## Input Changes

| Old Input | New Input | Notes |
|-----------|-----------|-------|
| `pages-subdirectory` | `reports-subdirectory` | Same purpose, renamed |
| `publish-pages` | `upload-html-report` | Artifact upload instead of Pages |
| `pages-mode` | — | Removed |
| `seed-from-gh-pages` | — | Removed |
| `comment-pr` | `comment-mode` | Use `update` or `off` |

## Output Changes

| Old Output | New Output |
|------------|------------|
| `report-url` | `artifact-url` |
| `page-url` | `workflow-url` |

## Accessing Reports

Hosted report URLs are no longer available. Instead:

1. **PR comment** — primary dashboard with failure details
2. **Job summary** — desktop-friendly tables on the workflow run page
3. **Check run** — "Actions Insights" check with annotations
4. **Artifact** — download `actions-insights-report` from the workflow run's Artifacts section, then open `test-reports/{branch}/latest/index.html` locally

Report history is preserved across runs via Actions cache and included in each artifact upload.

## Permissions

Remove `pages: write` and `id-token: write`. Add `checks: write` if not already present.
