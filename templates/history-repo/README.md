# Actions Insights History Repository

This repository stores structured JSON test history and hosts the Actions Insights dashboard on GitHub Pages.

## Structure

- `data/` — test run JSON (written by the GitHub Action)
- `web/` — React dashboard source
- `config.json` — dashboard configuration (default repository)

## Setup

1. Enable the GitHub Action in your source repositories with `history-enabled: true`
2. Provide a `history-token` secret with write access to this repository
3. Push to `main` to deploy the dashboard via GitHub Pages

## Documentation

See the [Actions Insights documentation](https://github.com/actions-insights/actions-insights/tree/main/docs/history-repository).
