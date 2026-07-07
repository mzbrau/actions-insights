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
2. Add as `ACTIONS_INSIGHTS_HISTORY_TOKEN` in each source repository's secrets

## Dashboard config

`config.json` in the history repository root:

```json
{
  "defaultRepository": "my-org/my-project"
}
```

When set, the dashboard auto-navigates to this repository (users can still switch via the repository list).
