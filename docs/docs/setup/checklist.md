---
sidebar_position: 11
title: Setup Checklist
---

# Setup Checklist

Use this checklist to verify your Actions Insights setup before merging. AI assistants should complete every item in Phase 8 of the [AI Setup Guide](./ai-setup).

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
| Any | `contents: read` (or `write` if the job also creates releases) |
| PR comments | `pull-requests: write` |
| GitHub Checks | `checks: write` |
| Workflow timing (history) | `actions: read` |

- [ ] Workflow permissions match the outputs you enabled
- [ ] Job-level permissions satisfy **every step** in that job (e.g. `contents: write` when the job runs `gh release create`)

### Fork pull requests

- [ ] If PRs come from forks and PR comments are needed, a **separate reporting job** uploads/downloads test result artifacts (see [Add the Action](./add-action#pull-requests-from-forks))
- [ ] `history-enabled` is **not** unconditional on `pull_request` workflows — guard with a same-repo check (fork PRs cannot access secrets)

## Non-blocking reporting

- [ ] Reporting steps that must not block releases or builds use `continue-on-error: true`
- [ ] Steps that run after test failures use `if: always()` **and** `continue-on-error: true` when in the same job as release/deploy steps

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

## Code coverage (optional)

Skip this section if `coverage-enabled` is not set.

- [ ] Test runner writes a supported coverage format (**Cobertura, OpenCover, LCOV, or JaCoCo**) before the Actions Insights step
- [ ] `coverage-files` glob matches the actual coverage output path
- [ ] `coverage-enabled`, `coverage-files`, and `coverage-fail-if-missing` are set together (or all omitted/default)

## Build diagnostics (optional)

Skip this section if `diagnostics-enabled` is not set.

- [ ] Build/compile step captures SARIF or compiler log output before the Actions Insights step
- [ ] `diagnostics-files` glob matches the actual diagnostic output path
- [ ] `diagnostics-enabled`, `diagnostics-files`, and `diagnostics-fail-if-missing` are set together (or all omitted/default)

## History repository (optional)

Skip this section if `history-enabled` is not set.

- [ ] History repository created ([deployment guide](../history-repository/deployment))
- [ ] GitHub Pages enabled on the history repository
- [ ] PAT with `contents: write` on the history repository
- [ ] Secret added to source repository (recommended: `ACTIONS_INSIGHTS_HISTORY_TOKEN`)
- [ ] `history-repository` set to `owner/repo`
- [ ] `history-token` references the correct `secrets.*` name
- [ ] On `pull_request` workflows, `history-enabled` is guarded so fork PRs do not attempt to publish (secrets unavailable)
- [ ] `actions: read` is present when workflow timing is used with restricted permissions
- [ ] `workflow-timing-enabled` is considered (default `true`; set `false` only if timing capture is not wanted)

## Post-setup verification

After the workflow runs:

1. **Pull request** — open the PR and confirm the Actions Insights comment appears (if `comment-mode` is not `off`); if coverage is enabled, confirm the coverage line and table appear
2. **Workflow run** — open the run page and check the job summary table; if coverage is enabled, confirm the Coverage section
3. **Checks** — confirm the Actions Insights check run with annotations (if `publish-checks` is enabled)
4. **Artifact** — download the `actions-insights-report` artifact and open the HTML report (if `upload-html-report` is enabled); if coverage is enabled, confirm the Coverage section
5. **History dashboard** — visit the GitHub Pages URL and confirm the latest run appears (if history repository is enabled); if coverage is enabled, confirm the **Test Coverage** tab shows trend data; if diagnostics or timing are enabled, confirm the **Build Insights** tab and **Run → Build** panel show data

## Troubleshooting

- **No results found** — verify the `test-results` glob and that tests ran successfully
- **Wrong format detected** — ensure XML files use a supported schema; see [Prepare Test Output](./prepare-test-output)
- **No PR comment** — confirm the workflow ran on a pull request and `comment-mode` is not `off`; check fork PR permissions
- **Release step fails with 403** — job likely has `contents: read` but needs `contents: write` for `gh release create`
- **Reporting failure blocks release** — add `continue-on-error: true` to the Actions Insights step; `if: always()` alone is not enough
- **History not updating** — verify `history-token` has write access to the history repository
- **History fails on fork PR** — guard `history-enabled` with a same-repo check; fork PRs cannot access repository secrets
- **No coverage in reports** — verify `coverage-enabled: true`, the test command produces a supported format, and the `coverage-files` glob matches the output path; see [Prepare Test Output — Code Coverage](./prepare-test-output#code-coverage)
- **No Build Insights data** — verify `history-enabled: true`; for diagnostics also verify `diagnostics-enabled: true` and a matching `diagnostics-files` glob
- **No workflow timing** — verify `workflow-timing-enabled` (default `true`), `history-enabled: true`, and `actions: read` when using restricted permissions

See [History Repository Troubleshooting](../history-repository/troubleshooting) for dashboard-specific issues.
