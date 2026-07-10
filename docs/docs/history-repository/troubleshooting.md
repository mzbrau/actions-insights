---
sidebar_position: 10
title: Troubleshooting
---

# Troubleshooting

## Pages workflow fails on initial commit

If `setup-node` fails with "Some specified paths were not resolved, unable to cache dependencies", the history repo is missing `web/package-lock.json` and the vendored `@actions-insights/history-models` package.

See [Fixing an already-created history repository](deployment.md#fixing-an-already-created-history-repository) in the deployment guide.

## Pages build fails with TypeScript errors

If the Pages workflow fails during `npm run build` with errors like:

- `Cannot find module './encoding'` in `vendor/history-models/src/index.ts`
- `Type 'RunSummary[]' is not assignable to type 'EnrichedRun[]'` in `BranchPage.tsx`
- Implicit `any` types in `RunDetailPage.tsx`

The vendored `@actions-insights/history-models` package is incomplete or the dashboard source is stale. Schema v2 added `encoding.ts` alongside `index.ts`, and older dashboard copies may still include removed pages such as `BranchPage.tsx`.

Re-sync the dashboard from a current `actions-insights` checkout:

```bash
bash scripts/update-history-repo.sh update <owner>/<history-repo> --verify --yes
```

Or fix manually:

1. Delete `web/src/pages/BranchPage.tsx` if it still exists
2. Re-vendor history-models:
   ```bash
   bash scripts/prepare-standalone-web.sh /path/to/history-repo/web packages/history-models --verify
   ```
3. Commit `web/vendor/history-models/src/encoding.ts`, the updated `web/package-lock.json`, and any removed stale files
4. Push to `main`

## node_modules committed to git

If `web/node_modules/` was committed (for example before `.gitignore` was added), remove it from version control:

```bash
cp /path/to/actions-insights/templates/history-repo/.gitignore .gitignore
git rm -r --cached web/node_modules
git commit -m "Stop tracking web/node_modules"
git push
```

Or run `bash scripts/update-history-repo.sh update <owner>/<history-repo>` from an `actions-insights` checkout to open a PR with the fix.

## History publish skipped

- Verify `history-enabled: true`
- Ensure `history-repository` is set
- Ensure `history-token` secret is configured and has `contents: write`

## History publish fails on fork PR

Fork PRs triggered by `pull_request` cannot access repository secrets. If `history-enabled: true` is set unconditionally, `history-token` will be empty and the step can fail.

Guard with a same-repo check:

```yaml
history-enabled: ${{ github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository }}
```

See [Add the Action](../setup/add-action#history-on-fork-pull-requests).

## Push conflicts

Multiple workflows pushing simultaneously may conflict on index files. The action retries up to 3 times with rebase. If failures persist:

- Reduce concurrent writes to the same branch
- Check history repo branch protection rules allow pushes

## Dashboard 404

- Confirm GitHub Pages is enabled (Actions source)
- Check the Pages workflow completed successfully
- Verify `VITE_BASE_PATH` matches your Pages URL (`/{repo-name}/` for project pages)

## Deep links do not load

The dashboard uses hash-based URLs (for example `.../repo-name/#/r/owner.repo/b/main/run/1`). Path-based URLs without the `#` (for example `.../repo-name/r/owner.repo/...`) will not work on GitHub Pages.

If you have an older dashboard build that used path-based routing, run `bash scripts/update-history-repo.sh update <owner>/<history-repo>` to pick up hash routing.

## Blank page after dashboard update

The dashboard uses `HashRouter` for GitHub Pages. Do not set `basename` on `HashRouter` — unlike `BrowserRouter`, it applies to the hash segment, not the repo path, and causes the router to match no routes. `VITE_BASE_PATH` is only for static assets and data fetches (`import.meta.env.BASE_URL`).

If the site is blank after updating, run `bash scripts/update-history-repo.sh update <owner>/<history-repo>` to pick up the latest dashboard build.

## Empty repository list

- Confirm the action has published at least one run
- Check `data/repositories.json` exists in the history repo
- Verify JSON was copied into the Pages deploy artifact

## Token permission errors

The `history-token` must have write access to the **history repository**, not just the source repository.
