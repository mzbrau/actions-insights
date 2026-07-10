---
sidebar_position: 6
title: Data Model
---

# History Repository Data Model

All JSON files use `version: 2`. Types and encode/decode helpers are defined in `packages/history-models`.

History JSON is written **minified** (no indentation) to reduce repository size.

## Global index

`data/repositories.json`:

```json
{"version":2,"updatedAt":"2026-07-07T10:00:00.000Z","repositories":[{"key":"owner.repo","name":"owner/repo","url":"https://github.com/owner/repo","latestStatus":"failed","branchCount":3,"lastUpdated":"2026-07-07T10:00:00.000Z","latestCommitShortSha":"abc123d"}]}
```

## Run record

`runs/{timestamp}-{runId}.json` contains the full test payload. Test names are compressed with a per-run **class dictionary**; each test stores a class index (`c`) and method name (`m`) instead of the full name.

```json
{
  "version": 2,
  "runId": "4829",
  "workflowRunId": 4829,
  "status": "failed",
  "date": "2026-07-07T10:00:00.000Z",
  "durationMs": 1634,
  "context": { "repository": "owner/repo", "branchKey": "pr-42" },
  "stats": { "total": 100, "passed": 98, "failed": 2, "skipped": 0 },
  "classes": ["Notey.Tests.DocumentStoreIndexTests"],
  "tests": [
    { "c": 0, "m": "GetDynamicValueSuggestionsAsync_reads_folder_values_for_command", "o": 0, "d": 123 }
  ],
  "failures": [{ "t": 0, "message": "...", "stackTrace": "..." }],
  "links": { "workflowUrl": "...", "commitUrl": "..." }
}
```

| Field | Meaning |
|-------|---------|
| `classes` | Dictionary of fully-qualified class names for this run |
| `tests[].c` | Index into `classes` |
| `tests[].m` | Method name (suffix of full test name) |
| `tests[].n` | Fallback full name when class decomposition is unavailable |
| `tests[].o` | Outcome code |
| `tests[].d` | Duration in milliseconds |
| `tests[].a` | Assembly / project name (optional) |
| `tests[].nf` | New failure flag (optional) |
| `failures[].t` | Index of the failed test in `tests[]` |

Outcome codes: `0=passed`, `1=failed`, `2=skipped`, `3=inconclusive`.

The web dashboard expands stored tests to full names at load time using `normalizeRunRecord()` from `history-models`.

## Repository test trends

`data/repositories/{owner.repo}/tests.json` stores cross-branch per-test history. Test names are stored once in a `names` array; entries are keyed by numeric ID:

```json
{
  "version": 2,
  "updatedAt": "2026-07-07T10:00:00.000Z",
  "names": ["Notey.Tests.DocumentStoreIndexTests.MyTest"],
  "entries": {
    "0": {
      "passRate": 95.0,
      "runCount": 20,
      "points": [{ "runId": "1", "date": "...", "o": 0, "d": 123, "commitShortSha": "abc123d", "branchKey": "main", "branchLabel": "main" }]
    }
  }
}
```

## Branch history

`history.json` contains summary rows only — the UI loads full run data on demand from `runs/`.

When coverage is enabled, each run may also reference a sidecar file:

`runs/{timestamp}-{runId}.coverage.json`

| Field | Meaning |
|-------|---------|
| `RunSummary.coverage` | Compact summary + per-project percentages for trend charts |
| `RunSummary.coverageFile` | Sidecar filename (lazy-loaded in the dashboard) |
| `.coverage.json` | Full project/package/class hierarchy and compact file entries |

## Schema version 1

Version 1 data is not supported. Delete existing history data and re-import or publish fresh runs with schema v2.
