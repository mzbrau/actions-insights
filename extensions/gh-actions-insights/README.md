# gh-actions-insights

Optional GitHub CLI wrapper for `scripts/init-history-repo.sh`.

Most users do not need this extension — use the curl installer from the main repository instead (see [History Repository Deployment](https://mzbrau.github.io/actions-insights/docs/history-repository/deployment)).

## Install

```bash
gh extension install mzbrau/gh-actions-insights
gh actions-insights init
gh actions-insights update <owner>/<history-repo>
gh actions-insights import <owner>/<source-repo> <owner>/<history-repo>
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
