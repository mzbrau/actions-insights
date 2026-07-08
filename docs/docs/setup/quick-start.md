---
sidebar_position: 2
title: Quick Start
---

# Quick Start

Get Actions Insights running in your workflow with sensible defaults. All four output channels are enabled except the history repository.

## Minimal Workflow

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

      - name: Run tests
        run: dotnet test --logger "trx;LogFileName=results.trx"

      - name: Publish test report
        uses: mzbrau/actions-insights@v1
        with:
          test-results: '**/*.trx'
```

This configuration:

- Posts a **PR comment** with failure details (when running on a pull request)
- Writes a **workflow summary** with failed and slow tests
- Publishes a **GitHub Check** with annotations
- Uploads an **HTML report** as a workflow artifact

## Supported Formats

| Format | File patterns |
|--------|---------------|
| TRX | `*.trx` |
| JUnit XML | `*.xml` (JUnit schema) |
| NUnit XML | `*.xml` (NUnit schema) |
| xUnit XML | `*.xml` (xUnit schema) |

## What Happens Next

After your workflow runs:

1. Open the **pull request** to see the test summary comment
2. Open the **workflow run** to see the job summary table
3. Download the **`actions-insights-report`** artifact for the full interactive HTML report

## Customise Your Setup

The defaults work for most teams, but you can enable or disable individual outputs:

- **[Choose Your Outputs](./choose-outputs)** — decision guide for each output channel
- **[Prepare Test Output](./prepare-test-output)** — ensure your test runner writes compatible files
- **[Example Workflows](./example-workflows)** — common configuration patterns

## Full Reference

See the [Configuration Reference](../reference/configuration) for every input and output.
