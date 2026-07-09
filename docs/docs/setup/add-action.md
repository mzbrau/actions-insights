---
sidebar_position: 5
title: Add the Action
---

# Add the Action

Add Actions Insights as a step **after** your tests run and result files are written.

## Basic Step

```yaml
- name: Publish test report
  uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
```

## Required Permissions

Add these permissions at the workflow or job level:

```yaml
permissions:
  contents: read          # Required
  pull-requests: write    # PR comments
  checks: write           # Check runs and annotations
```

For pull requests from forks, you may need `pull_request_target` or a separate reporting job — see the [Configuration Reference](../reference/configuration#permissions).

### Pull requests from forks

`GITHUB_TOKEN` from a `pull_request` workflow cannot write PR comments on fork PRs. Use one of these patterns:

1. **Separate reporting job** (recommended) — run tests on the fork code, upload result files as artifacts, then run Actions Insights in a trusted job with `pull-requests: write`:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: dotnet test --logger "trx;LogFileName=results.trx"
      - uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: '**/*.trx'

  report:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      checks: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: test-results
      - uses: mzbrau/actions-insights@v1
        with:
          test-results: '**/*.trx'
```

2. **`pull_request_target`** — only when you understand the security implications of running untrusted code with elevated permissions.

See the [Setup Checklist](./checklist) for a full pre-flight review.

## Step Placement

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run tests
        run: dotnet test --logger "trx;LogFileName=results.trx"

      - name: Publish test report    # ← after tests
        uses: mzbrau/actions-insights@v1
        with:
          test-results: '**/*.trx'
```

## Outputs

Use step outputs in later steps:

```yaml
- name: Publish test report
  id: report
  uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'

- name: Fail if tests failed
  if: steps.report.outputs.status == 'failed'
  run: exit 1
```

| Output | Description |
|--------|-------------|
| `status` | `passed` or `failed` |
| `total`, `passed`, `failed`, `skipped` | Test counts |
| `workflow-url` | Link to the workflow run |
| `artifact-url` | Link to workflow artifacts |

## Next Step

[Choose which outputs to enable](./choose-outputs).
