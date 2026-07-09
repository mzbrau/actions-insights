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

See [History Repository Deployment](../history-repository/deployment) for one-time setup.

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

[Configuration Reference](../reference/configuration) — every input, output, and deprecated option.
