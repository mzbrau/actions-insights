# Troubleshooting

## History publish skipped

- Verify `history-enabled: true`
- Ensure `history-repository` is set
- Ensure `history-token` secret is configured and has `contents: write`

## Push conflicts

Multiple workflows pushing simultaneously may conflict on index files. The action retries up to 3 times with rebase. If failures persist:

- Reduce concurrent writes to the same branch
- Check history repo branch protection rules allow pushes

## Dashboard 404

- Confirm GitHub Pages is enabled (Actions source)
- Check the Pages workflow completed successfully
- Verify `VITE_BASE_PATH` matches your Pages URL (`/{repo-name}/` for project pages)

## Empty repository list

- Confirm the action has published at least one run
- Check `data/repositories.json` exists in the history repo
- Verify JSON was copied into the Pages deploy artifact

## Token permission errors

The `history-token` must have write access to the **history repository**, not just the source repository.
