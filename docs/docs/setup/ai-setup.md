---
sidebar_position: 2
title: AI Setup Guide
---

# AI Setup Guide

You can ask your AI coding assistant to set up Actions Insights in your repository. Share this page URL and the prompt below — the assistant will inspect your project, configure test output, add the GitHub Action, and ask which reporting outputs you want.

## Copy this prompt

Paste this into Cursor, Copilot, Claude Code, or any coding agent that can edit your repository:

```
Set up Actions Insights in this repository. Follow the setup playbook at
https://www.ghactionsinsights.com/docs/setup/ai-setup

Inspect our test runner and GitHub Actions workflows, ensure we output a
supported format (TRX, JUnit, NUnit, or xUnit XML), add the action step,
then ask me which reporting outputs I want before making changes.
```

---

## Setup playbook (for AI assistants)

When helping a user set up Actions Insights, follow these phases in order. **Canonical defaults** come from [`action.yml`](https://github.com/mzbrau/actions-insights/blob/main/action.yml), not from the README.

### Phase 0 — Discover

1. Find workflow files in `.github/workflows/`
2. Detect the primary language and test framework (e.g. .NET/xUnit, Java/Maven, Python/pytest, JavaScript/Jest)
3. Locate the test command step and any existing result file paths
4. Note the workflow trigger (`pull_request`, `push`, `schedule`, etc.)

If multiple test frameworks exist, ask the user which workflow(s) to configure.

### Phase 1 — Ensure supported test output

Actions Insights reads **TRX, JUnit XML, NUnit XML, or xUnit XML** files. It does **not** support TAP, JSON reporters, or plain console output.

| Format | Extensions | Typical runners |
|--------|-----------|-----------------|
| TRX | `.trx` | .NET (`dotnet test`), Visual Studio |
| JUnit XML | `.xml` | Java (Maven, Gradle), Python (pytest), JavaScript, Go (`gotestsum`) |
| NUnit XML | `.xml` | NUnit (.NET) |
| xUnit XML | `.xml` | xUnit (.NET) |

The action auto-detects format from file content. Detection order for `.xml` files: **TRX → NUnit → xUnit → JUnit**.

If the runner does not already emit a supported format, update the test command. See [Prepare Test Output](./prepare-test-output) for per-language snippets and [Example Workflows](./example-workflows).

**Example workflow files in the Actions Insights repo:**

- [.NET / TRX](https://github.com/mzbrau/actions-insights/blob/main/examples/dotnet.yml)
- [Java / JUnit](https://github.com/mzbrau/actions-insights/blob/main/examples/java.yml)
- [Python / JUnit](https://github.com/mzbrau/actions-insights/blob/main/examples/python.yml)
- [JavaScript / JUnit](https://github.com/mzbrau/actions-insights/blob/main/examples/javascript.yml)

### Phase 2 — Add permissions

Add at the workflow or job level based on which outputs will be enabled:

```yaml
permissions:
  contents: read          # Required
  pull-requests: write    # PR comments
  checks: write           # Check runs and annotations
```

| Output | Required permission |
|--------|---------------------|
| PR comments | `pull-requests: write` |
| GitHub Checks | `checks: write` |
| Job summary | `contents: read` (no extra permission) |
| HTML artifact | `contents: read` (no extra permission) |

For **pull requests from forks**, `GITHUB_TOKEN` cannot write PR comments in a standard `pull_request` workflow. Use a separate reporting job — see [Add the Action](./add-action#pull-requests-from-forks).

### Phase 3 — Add the action step

Insert the Actions Insights step **after** tests run and result files are written:

```yaml
- name: Publish test report
  uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'   # glob must match actual output path
```

Set `test-results` to a glob that matches the files produced in Phase 1. Default: `**/*.{trx,xml}`.

### Phase 4 — Configure outputs (ask the user)

**Stop and ask the user** which reporting channels they want before applying non-default settings. Present these options:

| Output | Default | When to use | Input to disable |
|--------|---------|-------------|------------------|
| [PR comments](./pr-comments) | **On** | Review failures in the PR | `comment-mode: off` |
| [Workflow summary](./workflow-summary) | **On** | Desktop review on the workflow run page | `generate-job-summary: false` |
| [GitHub Checks](./add-action) | **On** | Check run with file annotations | `publish-checks: false` |
| [HTML artifact](./html-artifact) | **On** | Deep investigation, offline review | `upload-html-report: false` |
| [History repository](./history-repository) | **Off** | Org-wide dashboards across repos | `history-enabled: true` |

#### Recommended presets

**Pull request workflows** (default — no extra inputs needed):

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
```

**Main branch / scheduled runs** (no PR comments):

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    comment-mode: off
```

**Summary only** (minimal):

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    comment-mode: off
    upload-html-report: false
    publish-checks: false
```

See [Choose Your Outputs](./choose-outputs) for the full decision guide.

### Phase 5 — History repository (optional)

Only proceed if the user explicitly wants org-wide, persistent dashboards across repositories.

1. Explain this is a **one-time setup** plus a secret in each source repo
2. Follow [History Repository Deployment](../history-repository/deployment):
   - Run `curl -fsSL https://raw.githubusercontent.com/mzbrau/actions-insights/main/scripts/init-history-repo.sh | bash -s -- init`
   - Or: `gh extension install mzbrau/gh-actions-insights` then `gh actions-insights init`
3. Create a PAT with `contents: write` on the history repository
4. Add the PAT as a repository secret (recommended name: `ACTIONS_INSIGHTS_HISTORY_TOKEN`)
5. Enable in the workflow:

```yaml
- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    history-enabled: true
    history-repository: 'my-org/actions-insights-history'
    history-token: ${{ secrets.ACTIONS_INSIGHTS_HISTORY_TOKEN }}
```

The secret name is arbitrary but must match the `secrets.*` reference in the workflow.

See [History Repository Configuration](../history-repository/configuration) and [Adding Repositories](../history-repository/adding-repositories) for multi-repo setup.

### Phase 6 — Validate

Before committing, verify every item on the [Setup Checklist](./checklist). At minimum:

- [ ] Test runner emits TRX, JUnit, NUnit, or xUnit XML
- [ ] `test-results` glob matches the actual output path
- [ ] Actions Insights step runs **after** the test step
- [ ] Workflow permissions match enabled outputs
- [ ] `history-enabled`, `history-repository`, and `history-token` are set together (or all omitted)
- [ ] Fork PR workflows use a separate reporting job if PR comments are needed

Summarize changes to the user and explain how to verify:

1. Open a pull request to see the test summary comment
2. Open the workflow run to see the job summary table
3. Download the `actions-insights-report` artifact for the full HTML report

---

## Do not

- Use TAP, JSON, or other unsupported test reporter formats
- Place the Actions Insights step before tests run
- Copy default values from the README — use [`action.yml`](https://github.com/mzbrau/actions-insights/blob/main/action.yml) as the source of truth
- Enable `history-enabled` without `history-token` and `history-repository`
- Use `pull_request_target` without explaining the security trade-offs

## Further reading

- [Quick Start](./quick-start) — minimal workflow example
- [Configuration Reference](../reference/configuration) — every input and output
- [Example Workflows](./example-workflows) — complete YAML for common scenarios
