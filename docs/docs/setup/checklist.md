---
sidebar_position: 11
title: Setup Checklist
---

# Setup Checklist

Use this checklist to verify your Actions Insights setup before merging. AI assistants should complete every item in Phase 6 of the [AI Setup Guide](./ai-setup).

## Test output

- [ ] Test runner emits **TRX, JUnit, NUnit, or xUnit XML** (not TAP or JSON)
- [ ] Result files are written **before** the Actions Insights step runs
- [ ] `test-results` glob matches the actual output path (e.g. `**/*.trx`, `**/TEST-*.xml`)

## Workflow structure

- [ ] Actions Insights step is placed **after** the test step
- [ ] Workflow uses `mzbrau/actions-insights@v1` (or a pinned version)

## Permissions

| Output enabled | Permission required |
|----------------|---------------------|
| Any | `contents: read` |
| PR comments | `pull-requests: write` |
| GitHub Checks | `checks: write` |

- [ ] Workflow permissions match the outputs you enabled

### Fork pull requests

- [ ] If PRs come from forks and PR comments are needed, a **separate reporting job** uploads/downloads test result artifacts (see [Add the Action](./add-action#pull-requests-from-forks))

## Output configuration

Confirm which channels are enabled and the corresponding inputs:

| Channel | Enabled by default | To disable |
|---------|-------------------|------------|
| PR comments | Yes | `comment-mode: off` |
| Workflow summary | Yes | `generate-job-summary: false` |
| GitHub Checks | Yes | `publish-checks: false` |
| HTML artifact | Yes | `upload-html-report: false` |
| History repository | No | `history-enabled: true` |

- [ ] Output preferences match your team's workflow (PR vs main branch)

## History repository (optional)

Skip this section if `history-enabled` is not set.

- [ ] History repository created ([deployment guide](../history-repository/deployment))
- [ ] GitHub Pages enabled on the history repository
- [ ] PAT with `contents: write` on the history repository
- [ ] Secret added to source repository (recommended: `ACTIONS_INSIGHTS_HISTORY_TOKEN`)
- [ ] `history-repository` set to `owner/repo`
- [ ] `history-token` references the correct `secrets.*` name

## Post-setup verification

After the workflow runs:

1. **Pull request** — open the PR and confirm the Actions Insights comment appears (if `comment-mode` is not `off`)
2. **Workflow run** — open the run page and check the job summary table
3. **Checks** — confirm the Actions Insights check run with annotations (if `publish-checks` is enabled)
4. **Artifact** — download the `actions-insights-report` artifact and open the HTML report (if `upload-html-report` is enabled)
5. **History dashboard** — visit the GitHub Pages URL and confirm the latest run appears (if history repository is enabled)

## Troubleshooting

- **No results found** — verify the `test-results` glob and that tests ran successfully
- **Wrong format detected** — ensure XML files use a supported schema; see [Prepare Test Output](./prepare-test-output)
- **No PR comment** — confirm the workflow ran on a pull request and `comment-mode` is not `off`; check fork PR permissions
- **History not updating** — verify `history-token` has write access to the history repository

See [History Repository Troubleshooting](../history-repository/troubleshooting) for dashboard-specific issues.
