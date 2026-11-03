---
sidebar_position: 6
title: PR Comments
---

# PR Comments

When a workflow runs on a pull request, Actions Insights posts a rich comment with test results — failure counts, stack traces, and slow tests — optimised for mobile review. When [code coverage](./prepare-test-output#code-coverage) is enabled, the comment also includes a compact coverage line and per-project breakdown.

When there are failing tests, the comment includes a collapsible **Instructions for an AI agent** section. Expanding it reveals a copyable prompt with run context and failure details (messages, stack traces, stdout/stderr) so you can hand the investigation off to an AI coding agent.

When the [history repository](./history-repository) is enabled, the comment includes a **Details** link (at the top and in the footer) to the run in the history dashboard, and a **Test history** footer link to the repository dashboard. Each time the comment is updated, a **Previous results** section accumulates the timestamp and pass/fail/skip counts from prior runs **for that publisher**.

![PR comment with failure details and stack trace](/img/comment.png)

## When to Enable

Enable PR comments when your team reviews CI failures directly on pull requests. This is the **primary experience** for most teams.

Disable when running on `main`, scheduled workflows, or when you only need workflow summaries.

## Configuration

PR comments are **enabled by default** (`comment-mode: update`).

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    comment-mode: update          # upsert one comment per check-name on the PR
    max-failed-tests-in-comment: 10
    max-stack-trace-lines: 25
    include-slowest-tests: 18
```

To disable:

```yaml
with:
  comment-mode: off
```

## Multiple publishers on one PR

`comment-mode: update` upserts **one comment per [`check-name`](../reference/configuration#check-name)** on the pull request (the same key used for check runs). Give each Actions Insights step a distinct `check-name`, matching `report-title`, and [`reports-subdirectory`](../reference/configuration#reports-subdirectory) so comments, checks, HTML history, and previous-run comparisons stay isolated. Sharing a subdirectory merges test results on purpose (for example sharded suites); separate publishers need separate subdirectories:

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/TestResults/*.trx'
    check-name: Backend
    report-title: Backend
    reports-subdirectory: test-reports/backend

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-reports/*junit.xml'
    check-name: CI — unit & e2e
    report-title: CI — unit & e2e
    reports-subdirectory: test-reports/ci-unit
```

Publishers that share the same `check-name` (including the default `Actions Insights`) still upsert the same comment — last writer wins for that key.

**Historical note:** Earlier releases used a single global comment marker, so `update` was **global-per-PR** (any publisher could replace the whole comment). Upserts are now keyed by `check-name`.

## Permissions

```yaml
permissions:
  pull-requests: write
```

## Key Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `comment-mode` | `update` | `update` (upsert one comment per `check-name`) or `off` |
| `check-name` | `Actions Insights` | Keys the comment upsert (and the check run name) |
| `max-failed-tests-in-comment` | `10` | Cap failures shown in the comment |
| `max-stack-trace-lines` | `25` | Stack trace truncation |
| `include-slowest-tests` | `18` | Slow test count (0 to disable) |
| `include-stdout` / `include-stderr` | `true` | Include output in failure details |

## Learn More

- [Configuration Reference — PR Comment](../reference/configuration#pr-comment)
- [Architecture — PR Comment](../reference/architecture#primary-pr-comment)
