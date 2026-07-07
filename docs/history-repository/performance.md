# Performance Guidance

## Scale targets

The dashboard is designed for lazy loading:

- 100 repositories
- 500 branches
- 100,000 workflow runs
- Millions of tests (via per-run lazy load)

## Recommendations

- Use `history` and `retain-days` action inputs to prune old runs
- Each run is a separate JSON file — pruning removes entries from `history.json` but orphan run files may remain until manually cleaned
- The run detail page virtualizes the test list for large suites
- Index files stay small by storing summaries only

## Git churn

- Only touched repositories and branches are updated per workflow run
- Run files are append-only (never rewritten)
- Keep commits scoped to the publishing repository's subtree
