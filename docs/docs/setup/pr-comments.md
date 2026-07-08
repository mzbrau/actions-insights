---
sidebar_position: 6
title: PR Comments
---

# PR Comments

When a workflow runs on a pull request, Actions Insights posts a rich comment with test results — failure counts, stack traces, and slow tests — optimised for mobile review.

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
    comment-mode: update          # upsert a single comment per PR
    max-failed-tests-in-comment: 10
    max-stack-trace-lines: 25
    include-slowest-tests: 18
```

To disable:

```yaml
with:
  comment-mode: off
```

## Permissions

```yaml
permissions:
  pull-requests: write
```

## Key Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `comment-mode` | `update` | `update` (upsert) or `off` |
| `max-failed-tests-in-comment` | `10` | Cap failures shown in the comment |
| `max-stack-trace-lines` | `25` | Stack trace truncation |
| `include-slowest-tests` | `18` | Slow test count (0 to disable) |
| `include-stdout` / `include-stderr` | `true` | Include output in failure details |

## Learn More

- [Configuration Reference — PR Comment](../reference/configuration#pr-comment)
- [Architecture — PR Comment](../reference/architecture#primary-pr-comment)
