---
sidebar_position: 3
title: Deployment
---

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

Before making changes, the script shows a summary of the repository name, visibility, and planned steps, then asks you to confirm, cancel, or edit settings. When installed via `curl | bash`, prompts still work when a terminal is available.

From a local checkout you can run the same script directly:

```bash
bash scripts/init-history-repo.sh init --dry-run
```

Use `--dry-run` to preview the same summary without executing or prompting. Use `--yes` (or `-y`) to skip confirmation in non-interactive or CI environments.

## Optional: GitHub CLI extension

`gh extension install` requires a repository whose name starts with `gh-`, so the main `actions-insights` repository cannot be used directly. If you prefer a `gh` subcommand, install the optional extension:

```bash
gh extension install mzbrau/gh-actions-insights
gh actions-insights init
gh actions-insights update <owner>/<history-repo>
gh actions-insights import <owner>/<source-repo> <owner>/<history-repo>
```

See [Importing historical test data](import.md) for backfilling runs from workflow artifacts.

Maintainers publish that extension from this monorepo with `npm run publish:extension`.

## Manual setup

1. Create a new repository
2. Copy contents from `templates/history-repo/` and `web/` from this monorepo
3. Run `bash scripts/prepare-standalone-web.sh web packages/history-models` to vendor shared types and generate `web/package-lock.json`
4. Enable GitHub Pages with source: **GitHub Actions**
5. Push to `main` — the `pages.yml` workflow builds and deploys

## Dashboard URL

For project Pages: `https://{owner}.github.io/{repo-name}/`

The dashboard uses hash-based routing so deep links work on static GitHub Pages hosting. Run detail URLs look like:

`https://{owner}.github.io/{repo-name}/#/r/{repo-key}/b/{branch}/run/{run-id}`

For example: `https://my-org.github.io/test-history/#/r/owner.repo/b/main/run/42`

## Updating the dashboard

To pull in dashboard and workflow improvements from `actions-insights`, run the update script. It validates the target repository, syncs `web/` and `.github/workflows/pages.yml`, and opens a pull request. Your `data/` and `config.json` are left unchanged.

Like the init script, update shows a summary and asks you to confirm, cancel, or edit settings (target repository, source ref, verify build) before cloning or opening a pull request.

```bash
curl -fsSL https://raw.githubusercontent.com/mzbrau/actions-insights/main/scripts/update-history-repo.sh | \
  bash -s -- update <owner>/<history-repo>
```

From a local checkout:

```bash
bash scripts/update-history-repo.sh update <owner>/<history-repo>
```

Or with the GitHub CLI extension:

```bash
gh actions-insights update <owner>/<history-repo>
```

Use `--dry-run` to preview the planned actions without executing or prompting. Use `--verify` to run `npm ci` and `npm run build` while preparing `web/`. Use `--yes` (or `-y`) to skip confirmation in non-interactive or CI environments.

You can still modify `web/` directly in the history repository and push. The Pages workflow rebuilds on changes to `web/`, `data/`, or `config.json`.

JSON-only pushes from the action do not require React source changes — the workflow rebuilds the static site and copies current `data/` into the deploy artifact.

## What not to commit

The history repository template includes a `.gitignore` that excludes `web/node_modules/` and `web/dist/`. CI installs dependencies from `web/package-lock.json` during the Pages build. Commit `web/package-lock.json` and `web/vendor/history-models/`, but not install or build output.

## Fixing an already-created history repository

If your history repository was created before standalone web preparation was added, the Pages workflow may fail on the first run with:

> Some specified paths were not resolved, unable to cache dependencies.

The easiest fix is the update script, which also adds `.gitignore` and removes tracked `node_modules` if present:

```bash
bash scripts/update-history-repo.sh update <owner>/<history-repo>
```

Manual fix from a checkout of `actions-insights` (note the `/web` suffix on the history repo path):

```bash
git clone https://github.com/<owner>/<history-repo>.git /tmp/history-repo-fix
bash scripts/prepare-standalone-web.sh /tmp/history-repo-fix/web packages/history-models
```

You can also pass the history repo root instead of `web/`; the script will detect that and use `web/` automatically.

Then update `.github/workflows/pages.yml` in the history repository to match the current template (Node 24, `npm ci`, and `cache-dependency-path: web/package-lock.json`), add `.gitignore` from `templates/history-repo/.gitignore`, commit, and push:

```bash
cd /tmp/history-repo-fix
cp /path/to/actions-insights/templates/history-repo/.github/workflows/pages.yml .github/workflows/pages.yml
cp /path/to/actions-insights/templates/history-repo/.gitignore .gitignore
git rm -r --cached web/node_modules 2>/dev/null || true
git add web .github/workflows/pages.yml .gitignore
git commit -m "Fix Pages workflow for standalone web build"
git push
```
