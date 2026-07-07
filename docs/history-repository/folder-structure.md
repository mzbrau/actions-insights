# History Repository Folder Structure

```
/
  .gitignore
  config.json
  web/
  data/
    repositories.json
    repositories/
      owner.repo/
        metadata.json
        branches.json
        branches/
          main/
            latest.json
            history.json
            runs/
              2026-07-07T10-14-32Z-4829.json
          pr-123/
        pull-requests/
        tags/
        indexes/
  .github/workflows/pages.yml
```

## File purposes

| File | Purpose |
|------|---------|
| `.gitignore` | Excludes `web/node_modules/`, `web/dist/`, and other local artifacts |
| `config.json` | Dashboard config (`defaultRepository`) |
| `data/repositories.json` | Global index of all source repositories |
| `metadata.json` | Per-repository summary |
| `branches.json` | Branch index with latest status per branch |
| `latest.json` | Pointer to the newest run on a branch |
| `history.json` | Run summaries for a branch (no full test data) |
| `runs/*.json` | Full run payload including all tests and failures |

## Branch keys

Branch keys follow the same convention as the action's local history:

- `main` — regular branches (sanitized)
- `pr-42` — pull requests
- `release-v1.0` — tags

## Repository keys

Source repositories are keyed as `owner.repo` (e.g. `my-org.my-project`).
