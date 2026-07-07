# Deploying the History Repository

## Quick start (recommended)

No clone and no separate extension repository required:

```bash
curl -fsSL https://raw.githubusercontent.com/mzbrau/actions-insights/main/scripts/init-history-repo.sh | bash -s -- init
```

With options:

```bash
curl -fsSL https://raw.githubusercontent.com/mzbrau/actions-insights/main/scripts/init-history-repo.sh | \
  bash -s -- init my-org-test-history --org my-org --default-repository my-org/my-project
```

Requires `gh` and `git` on your PATH. The script shallow-clones `mzbrau/actions-insights` into a temporary directory to copy templates, then creates your history repository.

From a local checkout you can run the same script directly:

```bash
bash scripts/init-history-repo.sh init --dry-run
```

## Optional: GitHub CLI extension

`gh extension install` requires a repository whose name starts with `gh-`, so the main `actions-insights` repository cannot be used directly. If you prefer a `gh` subcommand, install the optional extension:

```bash
gh extension install mzbrau/gh-actions-insights
gh actions-insights init
```

Maintainers publish that extension from this monorepo with `npm run publish:extension`.

## Manual setup

1. Create a new repository
2. Copy contents from `templates/history-repo/` and `web/` from this monorepo
3. Run `bash scripts/prepare-standalone-web.sh web packages/history-models` to vendor shared types and generate `web/package-lock.json`
4. Enable GitHub Pages with source: **GitHub Actions**
5. Push to `main` — the `pages.yml` workflow builds and deploys

## Dashboard URL

For project Pages: `https://{owner}.github.io/{repo-name}/`

## Updating the web app

Modify `web/` in the history repository and push. The Pages workflow rebuilds on changes to `web/`, `data/`, or `config.json`.

JSON-only pushes from the action do not require React source changes — the workflow rebuilds the static site and copies current `data/` into the deploy artifact.

## Fixing an already-created history repository

If your history repository was created before standalone web preparation was added, the Pages workflow may fail on the first run with:

> Some specified paths were not resolved, unable to cache dependencies.

From a checkout of `actions-insights`, run (note the `/web` suffix on the history repo path):

```bash
git clone https://github.com/<owner>/<history-repo>.git /tmp/history-repo-fix
bash scripts/prepare-standalone-web.sh /tmp/history-repo-fix/web packages/history-models
```

You can also pass the history repo root instead of `web/`; the script will detect that and use `web/` automatically.

Then update `.github/workflows/pages.yml` in the history repository to match the current template (Node 24, `npm ci`, and `cache-dependency-path: web/package-lock.json`), commit, and push:

```bash
cd /tmp/history-repo-fix
cp /path/to/actions-insights/templates/history-repo/.github/workflows/pages.yml .github/workflows/pages.yml
git add web .github/workflows/pages.yml
git commit -m "Fix Pages workflow for standalone web build"
git push
```
