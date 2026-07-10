---
sidebar_position: 10
title: Example Workflows
---

# Example Workflows

Complete workflow examples for common scenarios. Mix and match outputs from the [setup guide](./choose-outputs).

## Pull Request — Full Reporting

PR comments, workflow summary, checks, and HTML artifact:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write
  checks: write

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run tests
        run: dotnet test --logger "trx;LogFileName=results.trx"

      - name: Publish test report
        uses: mzbrau/actions-insights@v1
        with:
          test-results: '**/*.trx'
          comment-mode: update
          generate-job-summary: true
          upload-html-report: true
          publish-checks: true
```

## Main Branch — No PR Comments

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    comment-mode: off
    generate-job-summary: true
    upload-html-report: true
```

## Minimal — Summary Only

```yaml
permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: dotnet test --logger "trx;LogFileName=results.trx"
      - uses: mzbrau/actions-insights@v1
        with:
          test-results: '**/*.trx'
          comment-mode: off
          upload-html-report: false
          publish-checks: false
```

## With History Repository

```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: dotnet test --logger "trx;LogFileName=results.trx"
      - uses: mzbrau/actions-insights@v1
        with:
          test-results: '**/*.trx'
          history-enabled: true
          history-repository: 'my-org/actions-insights-history'
          history-token: ${{ secrets.ACTIONS_INSIGHTS_HISTORY_TOKEN }}
```

On `pull_request` workflows, guard `history-enabled` so fork PRs (which cannot access secrets) do not attempt to publish:

```yaml
history-enabled: ${{ github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository }}
history-repository: 'my-org/actions-insights-history'
history-token: ${{ secrets.ACTIONS_INSIGHTS_HISTORY_TOKEN }}
```

See [History Repository Deployment](../history-repository/deployment) for one-time setup.

## Release Workflow — Non-blocking Report

When the report step shares a job with `gh release create`, use `contents: write` and `continue-on-error: true`:

```yaml
permissions:
  contents: write   # required for gh release create, not read
  checks: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run tests
        run: dotnet test --logger "trx;LogFileName=results.trx"

      - name: Publish test report
        uses: mzbrau/actions-insights@v1
        if: always()
        continue-on-error: true
        with:
          test-results: '**/*.trx'
          comment-mode: off

      - name: Create Release
        run: gh release create v1.0.0 ./artifacts/*
        env:
          GH_TOKEN: ${{ github.token }}
```

`if: always()` runs the step after test failures, but `continue-on-error: true` prevents a reporting outage from skipping the release step.

## Separate Test Report Job

For build workflows where reporting should not fail CI (parity with `fail-on-error: false`):

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

  test-report:
    needs: test
    if: always()
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      checks: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: test-results
      - name: Publish test report
        uses: mzbrau/actions-insights@v1
        continue-on-error: true
        with:
          test-results: '**/*.trx'
```

## Java (JUnit)

```yaml
- run: mvn test
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/TEST-*.xml'
```

See the full [Java example workflow](https://github.com/mzbrau/actions-insights/blob/main/examples/java.yml).

## Python (JUnit)

```yaml
- run: pytest --junitxml=test-results.xml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
```

See the full [Python example workflow](https://github.com/mzbrau/actions-insights/blob/main/examples/python.yml).

## JavaScript (JUnit via Vitest)

```yaml
- run: npx vitest run --reporter=junit --outputFile=test-results.xml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
```

See the full [JavaScript example workflow](https://github.com/mzbrau/actions-insights/blob/main/examples/javascript.yml).

## Full Reference

[Configuration Reference](../reference/configuration) — every input and output.
