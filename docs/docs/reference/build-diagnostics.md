---
sidebar_position: 4
title: Build diagnostics
---

# Build diagnostics

Actions Insights can parse compiler and analyzer output from build logs or SARIF files and publish compact summaries to the history repository for the dashboard **Build Insights** tab.

## Enable diagnostics

```yaml
- uses: your-org/actions-insights@v1
  with:
    diagnostics-enabled: true
    diagnostics-files: '**/*.{sarif,log}'
    history-enabled: true
    history-repository: your-org/test-history
    history-token: ${{ secrets.HISTORY_TOKEN }}
```

## Supported formats

| Format | Typical files | Detection |
|--------|---------------|-----------|
| **SARIF 2.1** | `*.sarif`, CodeQL, ESLint, Roslyn analyzers | JSON with `"runs"` array (recommended) |
| **MSBuild / Roslyn** | `build.log`, `msbuild.log` | `path(line,col): warning CS1234:` lines |
| **gcc / clang** | compiler stdout redirected to `.log` | `file:line:col: warning:` lines |

Parser order is SARIF → MSBuild → gcc/clang. More specific formats are tried first.

## .NET example

Capture MSBuild output to a log file, then point Actions Insights at it:

```yaml
- name: Build
  run: dotnet build --no-restore 2>&1 | tee build.log

- name: Test report
  uses: your-org/actions-insights@v1
  if: always()
  with:
    test-results: '**/TestResults/*.trx'
    diagnostics-enabled: true
    diagnostics-files: 'build.log'
    history-enabled: true
```

For structured output, prefer SARIF from analyzers:

```yaml
- name: Build with analyzers
  run: dotnet build /p:ErrorLog=build.sarif
```

```yaml
diagnostics-files: 'build.sarif'
```

## Workflow timing

When `history-enabled` and `workflow-timing-enabled` (default `true`) are set, the action fetches job and step durations from the current workflow run via the GitHub Actions API. No extra workflow configuration is required.

Ensure the job has `permissions: actions: read` if you use restricted `GITHUB_TOKEN` permissions.

## Dashboard

- **Repository → Build Insights**: error/warning trends and workflow duration charts
- **Run → Build**: step timeline, diagnostic list grouped by file (lazy-loaded detail)

Diagnostics are capped at 500 items per run in storage; additional items are summarized in the `truncated` field.
