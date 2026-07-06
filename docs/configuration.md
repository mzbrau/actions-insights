# Configuration Reference

## Inputs

### `test-results`
Glob pattern for test result files. Supports TRX, NUnit, xUnit, and JUnit XML.

Default: `**/*.{trx,xml}`

### `pages-subdirectory`
Subdirectory under GitHub Pages where reports are published. Use this when your repo already hosts documentation at the site root.

Default: `test-reports`

### `publish-pages`
When `false`, generates reports locally without publishing.

Default: `true`

### `pages-mode`
- `artifact` — Upload a `github-pages` artifact for `actions/deploy-pages` (recommended)
- `gh-pages` — Commit to the `gh-pages` branch, preserving other files
- `none` — No publishing (same as `publish-pages: false`)

Default: `artifact`

### `comment-pr`
Post or update a single PR comment with test summary and report link.

Default: `true`

### `history`
Maximum number of historical run directories retained per branch/PR/tag.

Default: `20`

### `retain-days`
Maximum age in days for historical run directories.

Default: `30`

### `report-title`
Title shown in the report UI.

Default: `Actions Insights`

### `report-output`
Local directory for the current run's report files.

Default: `_report`

### `site-output`
Local directory for the merged GitHub Pages site tree.

Default: `_site`

### `theme`
Default theme: `light`, `dark`, or `auto` (system preference).

Default: `auto`

### `slow-test-threshold-ms`
Tests slower than this threshold are marked as slow in the All Tests view.

Default: `1000`

### `seed-from-gh-pages`
On first run, bootstrap the site cache from an existing `gh-pages` branch.

Default: `false`

## Outputs

| Output | Description |
|--------|-------------|
| `report-url` | URL to the latest report |
| `page-url` | GitHub Pages base URL |
| `status` | `passed` or `failed` |
| `total` | Total test count |
| `passed` | Passed test count |
| `failed` | Failed test count |
| `skipped` | Skipped test count |

## Permissions

```yaml
permissions:
  contents: write    # gh-pages mode
  pages: write       # artifact mode
  id-token: write    # artifact mode OIDC
  pull-requests: write
```

## Example: Java JUnit

```yaml
- run: mvn test
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/surefire-reports/*.xml'
```

## Example: Existing Docusaurus Site

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    pages-subdirectory: test-reports
    seed-from-gh-pages: true
```
