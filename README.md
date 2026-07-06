# Actions Insights

TeamCity-style test reports for GitHub Actions. Parse TRX, JUnit, NUnit, and xUnit results, generate beautiful static HTML reports, and publish to GitHub Pages — without external infrastructure.

## Quick Start

```yaml
permissions:
  contents: write
  pages: write
  id-token: write
  pull-requests: write

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

  deploy-pages:
    needs: test
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deploy
        uses: actions/deploy-pages@v4
```

## Features

- **Supported formats:** TRX, NUnit XML, xUnit XML, JUnit XML
- **Beautiful HTML reports** with failures above the fold
- **GitHub Pages** publishing with subdirectory support (won't overwrite existing docs)
- **PR comments** — single updating comment per pull request
- **Job summaries** with failed test list and report link
- **Report history** with retention policies
- **Dark mode** (light / dark / auto)
- **Virtual scroll** for thousands of tests

## Configuration

| Input | Default | Description |
|-------|---------|-------------|
| `test-results` | `**/*.{trx,xml}` | Glob for test result files |
| `pages-subdirectory` | `test-reports` | Pages subdirectory for reports |
| `publish-pages` | `true` | Publish to GitHub Pages |
| `pages-mode` | `artifact` | `artifact`, `gh-pages`, or `none` |
| `comment-pr` | `true` | Update PR comment with summary |
| `history` | `20` | Max reports per branch/PR |
| `retain-days` | `30` | Max age for historical reports |
| `report-title` | `Actions Insights` | UI title |
| `theme` | `auto` | `light`, `dark`, or `auto` |
| `seed-from-gh-pages` | `false` | Bootstrap cache from gh-pages branch |

See [docs/configuration.md](docs/configuration.md) for the full reference.

## URL Structure

```
/test-reports/main/latest/       ← latest on branch
/test-reports/main/run-123/      ← specific workflow run
/test-reports/pr-456/latest/     ← latest for PR
/test-reports/release-v2.1/latest/
```

## Existing GitHub Pages Sites

Reports publish beneath `pages-subdirectory` (default: `test-reports`). The action merges with your existing site using a cache-based strategy (Mode 1) or writes only to the subdirectory on the `gh-pages` branch (Mode 2). See [docs/architecture.md](docs/architecture.md).

## Development

```bash
npm ci
npm test
npm run build
npm run generate-sample   # creates _report/ sample output
```

See [docs/development.md](docs/development.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache 2.0 — see [LICENSE](LICENSE).
