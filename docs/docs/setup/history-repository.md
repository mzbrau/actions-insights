---
sidebar_position: 9
title: History Repository
---

# History Repository

The history repository is an **optional** feature that pushes structured JSON test data to a separate git repository. A React dashboard hosted on GitHub Pages presents test results for all branches and repositories in a beautiful, responsive interface.

![Repository summary dashboard](/img/web-repo-summary.png)

## When to Enable

Enable the history repository when you need:

- **Org-wide visibility** across multiple repositories
- **Persistent history** that survives workflow artifact expiry
- A **hosted dashboard** on GitHub Pages for all branches
- Trend analysis and stability metrics over time

For single-repo setups with per-run investigation, the [HTML artifact](./html-artifact) may be sufficient.

## How It Works

```mermaid
flowchart LR
  action[ActionsInsights] -->|push JSON| repo[HistoryRepository]
  repo -->|GitHub Pages| dashboard[ReactDashboard]
```

1. Actions Insights pushes structured JSON after each test run
2. The history repository stores data under `data/`
3. A GitHub Actions workflow builds and deploys the React dashboard to GitHub Pages

## Minimal Configuration

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    history-enabled: true
    history-repository: 'my-org/actions-insights-history'
    history-token: ${{ secrets.HISTORY_REPO_TOKEN }}
```

## Setup Steps

The history repository requires a one-time setup:

1. **[Deploy the history repository](../history-repository/deployment)** — run the init script or use the `gh` extension
2. **[Configure secrets](../history-repository/configuration)** — create a token with write access
3. **Enable in your workflow** — set `history-enabled: true` and the inputs above

## Key Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `history-enabled` | `false` | Enable JSON publishing |
| `history-repository` | `''` | History repo (`owner/repo`) |
| `history-token` | `''` | Token with write access |
| `history-branch` | `main` | Target branch |
| `history-path` | `data` | Data root path |

## Learn More

- [History Repository Deployment](../history-repository/deployment) — init script, GitHub Pages setup
- [History Repository Configuration](../history-repository/configuration) — full input reference
- [Adding Repositories](../history-repository/adding-repositories) — multi-repo setup
- [Import Historical Data](../history-repository/import) — backfill from workflow artifacts
- [Troubleshooting](../history-repository/troubleshooting) — common issues
