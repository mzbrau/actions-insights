# gh-actions-insights

Optional GitHub CLI wrapper for `scripts/init-history-repo.sh`.

Most users do not need this extension — use the curl installer from the main repository instead (see `docs/history-repository/deployment.md`).

## Install

```bash
gh extension install mzbrau/gh-actions-insights
gh actions-insights init
```

## Development

```bash
cd extensions/gh-actions-insights
gh extension install . --force
gh actions-insights init --dry-run
```

## Publishing

Maintainers publish from the monorepo:

```bash
npm run publish:extension
```
