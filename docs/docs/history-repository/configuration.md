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

On `pull_request` workflows, guard `history-enabled` so fork PRs do not attempt to publish (secrets are unavailable):

```yaml
history-enabled: ${{ github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository }}
history-repository: my-org/test-history
history-token: ${{ secrets.ACTIONS_INSIGHTS_HISTORY_TOKEN }}
```

## Concurrency

When multiple workflow runs finish at the same time, they may conflict on shared index files in the history repository. The action retries automatically (up to 3 attempts with rebase), but you should serialize history publishes in your workflow to avoid conflicts.

**Same source repository** — use when multiple jobs or events (for example, a PR run and a push to `main`) can finish together:

```yaml
concurrency:
  group: actions-insights-history-${{ github.repository }}
  cancel-in-progress: false
```

Use `cancel-in-progress: false` so queued runs still publish when they reach the front of the queue (no lost history).

**Multiple source repositories → one history repository** — optional, when several repos publish to the same history branch:

```yaml
concurrency:
  group: actions-insights-history-my-org/test-history-main
  cancel-in-progress: false
```

All source repositories publishing to the same history branch should share the same group name.

See [Troubleshooting — Push conflicts](troubleshooting.md#push-conflicts) if publish failures persist.

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
