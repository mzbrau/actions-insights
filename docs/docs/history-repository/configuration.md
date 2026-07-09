---
sidebar_position: 2
title: Configuration
---

# History Repository Configuration

## Action inputs

| Input | Default | Description |
|-------|---------|-------------|
| `history-enabled` | `false` | Enable JSON publishing |
| `history-repository` | `''` | History repo (`owner/repo`) |
| `history-token` | `''` | Token with write access (required when enabled) |
| `history-branch` | `main` | Target branch |
| `history-path` | `data` | Data root path in history repo |
| `history-repository-name` | `auto` | Source repo key (`auto` = `GITHUB_REPOSITORY`) |
| `history-mode` | `multi` | Reserved (`multi` only in v1) |
| `history-default-repository` | `''` | Written to `config.json` on first publish |
| `history-pages-url` | `''` | Base URL for the history dashboard (GitHub Pages). If unset, Actions Insights will try to discover it or fall back to `https://{owner}.github.io/{repo}/`. |

## Workflow example

```yaml
- uses: owner/actions-insights@v1
  with:
    test-results: '**/*.{trx,xml}'
    history-enabled: true
    history-repository: my-org/test-history
    history-token: ${{ secrets.ACTIONS_INSIGHTS_HISTORY_TOKEN }}
```

## Secret setup

1. Create a fine-grained PAT or classic PAT with `contents: write` on the history repository
2. Add the token as a repository secret in each source repository

We recommend naming the secret `ACTIONS_INSIGHTS_HISTORY_TOKEN`. The name is arbitrary, but it must match the `secrets.*` reference in your workflow's `history-token` input.

## Dashboard config

`config.json` in the history repository root:

```json
{
  "defaultRepository": "my-org/my-project"
}
```

When set, the dashboard auto-navigates to this repository (users can still switch via the repository list).
