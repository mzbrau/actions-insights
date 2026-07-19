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
  contents: read          # Required for test-only jobs
  pull-requests: write    # PR comments
  checks: write           # Check runs and annotations
```

Job-level permissions apply to **every step** in that job. If the same job also runs `gh release create` or uploads release assets, use `contents: write` instead of `contents: read`.

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

### History on fork pull requests

`history-enabled: true` requires a non-empty `history-token`. Fork PRs triggered by `pull_request` cannot access repository secrets, so an unconditional `history-enabled: true` will fail. Guard with the same pattern used for PR comments:

```yaml
history-enabled: ${{ github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository }}
history-repository: 'my-org/actions-insights-history'
history-token: ${{ secrets.ACTIONS_INSIGHTS_HISTORY_TOKEN }}
```

## Non-blocking reporting

Test reporting should not block releases, deployments, or the overall build. Add `continue-on-error: true` when the Actions Insights step is ancillary to the job's primary purpose:

```yaml
- name: Publish test report
  uses: mzbrau/actions-insights@v1
  if: always()
  continue-on-error: true
  with:
    test-results: '**/*.trx'
```

`if: always()` only ensures the step runs after a prior failure — it does **not** prevent the step's own failure from failing the job. Use both attributes when reporting shares a job with release or publish steps.

**Trade-off:** `continue-on-error: true` also hides total action failures (including load-time crashes). If reporting integrity should fail CI, omit `continue-on-error` and keep `if: always()` so the step still runs after test failures.

When migrating from `dorny/test-reporter` or similar tools that used `fail-on-error: false`, add `continue-on-error: true` to preserve the same behavior.

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
| `artifact-url` | Direct link to the unzipped HTML report artifact |

## Next Step

[Choose which outputs to enable](./choose-outputs).
