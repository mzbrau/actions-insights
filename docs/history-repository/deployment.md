# Deploying the History Repository

## Quick start

```bash
gh extension install owner/actions-insights/extensions/gh-actions-insight
gh actions-insight init my-org-test-history --org my-org --default-repository my-org/my-project
```

This creates the repository, copies the React app and folder structure, commits, and enables GitHub Pages.

## Manual setup

1. Create a new repository
2. Copy contents from `templates/history-repo/` and `web/` from this monorepo
3. Enable GitHub Pages with source: **GitHub Actions**
4. Push to `main` — the `pages.yml` workflow builds and deploys

## Dashboard URL

For project Pages: `https://{owner}.github.io/{repo-name}/`

## Updating the web app

Modify `web/` in the history repository and push. The Pages workflow rebuilds on changes to `web/`, `data/`, or `config.json`.

JSON-only pushes from the action do not require React source changes — the workflow rebuilds the static site and copies current `data/` into the deploy artifact.
