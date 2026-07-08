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
