# Actions Insights

[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-498fff)](https://mzbrau.github.io/actions-insights/)

GitHub-native test reports for GitHub Actions. Parse TRX, JUnit, NUnit, and xUnit results, then surface failures directly in pull requests, job summaries, and checks — with a polished HTML report uploaded as a workflow artifact for deep investigation.

**[Read the full documentation →](https://mzbrau.github.io/actions-insights/)**

## Quick Start

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

## Features

- **Supported formats:** TRX, NUnit XML, xUnit XML, JUnit XML
- **PR comments** — mobile-first dashboard with failure details, stack traces, and slow tests
- **Job summaries** — TeamCity-style tables for desktop review
- **GitHub Checks** — check run with annotations parsed from stack traces
- **HTML artifact** — beautiful static report with full multi-run history (download from workflow artifacts)
- **Report history** — merged across runs via Actions cache, retained in the artifact
- **Dark mode** (light / dark / auto)
- **Virtual scroll** for 100,000+ tests

## Outputs

| Output | Description |
|--------|-------------|
| `workflow-url` | Link to the workflow run |
| `artifact-url` | Link to workflow artifacts (HTML report) |
| `status` | `passed` or `failed` |
| `total`, `passed`, `failed`, `skipped` | Test counts |

## Configuration

| Input | Default | Description |
|-------|---------|-------------|
| `test-results` | `**/*.{trx,xml}` | Glob for test result files |
| `reports-subdirectory` | `test-reports` | Subdirectory in the site artifact |
| `comment-mode` | `update` | `update` (upsert PR comment) or `off` |
| `max-failed-tests-in-comment` | `10` | Cap failures shown in PR comment |
| `max-stack-trace-lines` | `25` | Stack trace truncation |
| `include-slowest-tests` | `10` | Slow test count (0 to disable) |
| `upload-html-report` | `true` | Upload HTML report artifact |
| `publish-checks` | `true` | Publish GitHub check run |
| `generate-job-summary` | `true` | Write job summary |

See the [Configuration Reference](https://mzbrau.github.io/actions-insights/docs/reference/configuration) for the full reference.

## Migration from GitHub Pages

If you previously used the Pages-based workflow with a separate `deploy-pages` job, see [Migrate from GitHub Pages](https://mzbrau.github.io/actions-insights/docs/reference/migration).

## Development

```bash
npm ci
npm test
npm run build
npm run generate-sample   # creates _report/ and _site/ sample output
```

See the [Development Guide](https://mzbrau.github.io/actions-insights/docs/development) and [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache 2.0 — see [LICENSE](LICENSE).
