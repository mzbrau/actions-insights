# History Repository Data Model

All JSON files use `version: 1`. Types are defined in `packages/history-models`.

## Global index

`data/repositories.json`:

```json
{
  "version": 1,
  "updatedAt": "2026-07-07T10:00:00.000Z",
  "repositories": [
    {
      "key": "owner.repo",
      "name": "owner/repo",
      "url": "https://github.com/owner/repo",
      "latestStatus": "failed",
      "branchCount": 3,
      "lastUpdated": "2026-07-07T10:00:00.000Z",
      "latestCommitShortSha": "abc123d"
    }
  ]
}
```

## Run record

`runs/{timestamp}-{runId}.json` contains the full test payload:

```json
{
  "version": 1,
  "runId": "4829",
  "workflowRunId": 4829,
  "status": "failed",
  "date": "2026-07-07T10:00:00.000Z",
  "durationMs": 1634,
  "context": { "repository": "owner/repo", "branchKey": "pr-42", "...": "..." },
  "stats": { "total": 100, "passed": 98, "failed": 2, "skipped": 0 },
  "tests": [{ "i": 0, "n": "Tests.MyTest", "o": 0, "d": 123 }],
  "failures": [{ "fullName": "Tests.MyTest", "message": "...", "stackTrace": "..." }],
  "links": { "workflowUrl": "...", "commitUrl": "..." }
}
```

Outcome codes: `0=passed`, `1=failed`, `2=skipped`, `3=inconclusive`.

## Branch history

`history.json` contains summary rows only — the UI loads full run data on demand from `runs/`.
