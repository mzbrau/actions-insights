---
sidebar_position: 2
title: AI Setup Guide
---

# AI Setup Guide

You can ask your AI coding assistant to set up Actions Insights in your repository. Share this page URL and the prompt below — the assistant will inspect your project, configure test output, add the GitHub Action, and ask which reporting outputs, code coverage, and build diagnostics options you want.

## Copy this prompt

Paste this into Cursor, Copilot, Claude Code, or any coding agent that can edit your repository:

```
Set up Actions Insights in this repository. Follow the setup playbook at
https://www.ghactionsinsights.com/docs/setup/ai-setup

Inspect our test runner and GitHub Actions workflows, ensure we output a
supported format (TRX, JUnit, NUnit, or xUnit XML), add the action step,
then ask me which reporting outputs I want, whether I want code coverage,
and whether I want build diagnostics (warnings/errors) before making changes.
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
  contents: read          # Required for test-only jobs
  actions: read           # Workflow job/step timing (when history-enabled)
  pull-requests: write    # PR comments
  checks: write           # Check runs and annotations
```

| Output | Required permission |
|--------|---------------------|
| PR comments | `pull-requests: write` |
| GitHub Checks | `checks: write` |
| Job summary | `contents: read` (no extra permission) |
| HTML artifact | `contents: read` (no extra permission) |
| Workflow timing (history) | `actions: read` |

When `history-enabled` is true, workflow timing uses the GitHub Actions API to fetch job and step durations. Same-repo workflows with default token permissions usually include `actions: read` — add it explicitly only when the workflow uses custom restricted permissions.

**Job-level permissions apply to every step in that job.** If the same job also runs `gh release create`, uploads release assets, or commits to the repository, you must grant `contents: write` — not `contents: read`. A common mistake is copying the minimal quick-start permissions into a release workflow:

```yaml
# Release workflow — same job as gh release create
permissions:
  contents: write   # required for release upload, not read
  checks: write
```

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

#### Non-blocking reporting

Test reporting is ancillary — a reporting outage should not block releases or deployments. Add `continue-on-error: true` when:

- The report step shares a job with release, publish, or deploy steps
- The workflow previously used `fail-on-error: false` on another reporter (e.g. `dorny/test-reporter`)
- Reporting runs in a separate `test-report` job that should not fail the overall workflow

```yaml
- name: Publish test report
  uses: mzbrau/actions-insights@v1
  if: always()              # run after test failures
  continue-on-error: true     # do not fail the job if reporting fails
  with:
    test-results: '**/*.trx'
```

`if: always()` only controls whether the step **runs** after a prior failure. If the step itself fails, the job still fails and subsequent steps are skipped unless `continue-on-error: true` is set.

### Phase 4 — Code coverage (optional, ask the user)

**Stop and ask the user**: "Would you like to include code coverage in your test reports?"

If the user says **no**, skip this phase and leave `coverage-enabled` at its default (`false`).

If the user says **yes**, make changes in **two places**:

| Step | What to change |
|------|----------------|
| Test runner | Generate a supported coverage file before the Actions Insights step |
| Action inputs | `coverage-enabled: true` and a `coverage-files` glob matching the output |

Coverage uses the **same Actions Insights step** — no separate action or extra GitHub permissions are required. When enabled, coverage appears in the PR comment, job summary, HTML artifact, and (if history is enabled) the dashboard **Test Coverage** tab.

#### Supported formats

| Format | Typical output | Languages / tools |
|--------|---------------|-------------------|
| Cobertura XML | `coverage.cobertura.xml` | .NET Coverlet (default), Python `coverage xml` |
| OpenCover XML | `*.opencover.xml` | .NET OpenCover |
| JaCoCo XML | `jacoco.xml`, `jacocoTestReport.xml` | Java Maven/Gradle |
| LCOV | `lcov.info`, `coverage/lcov.info` | JS/TS (Vitest, Jest/nyc), Python `coverage lcov` |

The action auto-detects format from file content. See [Configuration Reference — Code coverage](../reference/configuration#code-coverage) for canonical defaults.

#### Per-language examples

**.NET (Coverlet / Cobertura)** — see [.NET example with coverage](https://github.com/mzbrau/actions-insights/blob/main/examples/dotnet.yml):

```yaml
- name: Run tests
  run: dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage --logger "trx;LogFileName=results.trx"

- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    coverage-enabled: true
    coverage-files: '**/coverage.cobertura.xml'
```

**Java (JaCoCo)**:

```yaml
- name: Run tests
  run: mvn test jacoco:report

- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/TEST-*.xml'
    coverage-enabled: true
    coverage-files: '**/jacoco*.xml'
```

**JavaScript / TypeScript (LCOV via Vitest)**:

```yaml
- name: Run tests
  run: npx vitest run --coverage

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
    coverage-enabled: true
    coverage-files: '**/lcov.info'
```

**Python (LCOV via pytest-cov)**:

```yaml
- name: Run tests
  run: pytest --junitxml=test-results.xml --cov --cov-report=lcov:coverage/lcov.info

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
    coverage-enabled: true
    coverage-files: 'coverage/lcov.info'
```

See [Prepare Test Output — Code Coverage](./prepare-test-output#code-coverage) for additional per-language snippets.

#### Optional strictness

Only set `coverage-fail-if-missing: true` if the user wants the step to fail when coverage is enabled but no files match or all parses fail. Default is `false`.

#### Multiple coverage files

When a workflow produces coverage from multiple jobs or formats, use comma-separated globs:

```yaml
coverage-files: '**/coverage.cobertura.xml,**/lcov.info'
```

### Phase 5 — Build diagnostics (optional, ask the user)

**Stop and ask the user**: "Would you like to track build warnings and errors in the history dashboard?"

If the user says **no**, skip this phase and leave `diagnostics-enabled` at its default (`false`).

If the user says **yes**, make changes in **two places**:

| Step | What to change |
|------|----------------|
| Build/compile step | Capture compiler output to a `.log` file or emit SARIF |
| Action inputs | `diagnostics-enabled: true` and a `diagnostics-files` glob matching the output |

Build diagnostics use the **same Actions Insights step** — no separate action is required. When `history-enabled` is true, summaries appear on the dashboard **Build Insights** tab and per-run **Build** panel. If the user wants diagnostics but not history yet, you can still enable collection for future use, but explain that dashboard charts require `history-enabled: true` (Phase 7).

#### Supported formats

| Format | Typical files | Languages / tools |
|--------|---------------|-------------------|
| SARIF 2.1 | `*.sarif` | CodeQL, ESLint, Roslyn analyzers (recommended) |
| MSBuild / Roslyn | `build.log`, `msbuild.log` | .NET (`dotnet build` output) |
| gcc / clang | `*.log` | C/C++ compiler stdout |

Parser order is SARIF → MSBuild → gcc/clang. See [Configuration Reference — Build diagnostics](../reference/configuration#build-diagnostics) for canonical defaults.

#### Per-language examples

**.NET (MSBuild log)**:

```yaml
- name: Build
  run: dotnet build --no-restore 2>&1 | tee build.log

- uses: mzbrau/actions-insights@v1
  if: always()
  with:
    test-results: '**/*.trx'
    diagnostics-enabled: true
    diagnostics-files: 'build.log'
```

**.NET (SARIF from Roslyn analyzers)**:

```yaml
- name: Build
  run: dotnet build /p:ErrorLog=build.sarif

- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    diagnostics-enabled: true
    diagnostics-files: 'build.sarif'
```

**JavaScript / TypeScript (ESLint SARIF)**:

```yaml
- name: Lint
  run: npx eslint -f @microsoft/eslint-formatter-sarif -o eslint.sarif .

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
    diagnostics-enabled: true
    diagnostics-files: 'eslint.sarif'
```

**C/C++ (gcc or clang)**:

```yaml
- name: Build
  run: make 2>&1 | tee build.log

- uses: mzbrau/actions-insights@v1
  if: always()
  with:
    test-results: '**/TEST-*.xml'
    diagnostics-enabled: true
    diagnostics-files: 'build.log'
```

See [Build diagnostics](../reference/build-diagnostics) for additional workflow patterns.

#### Optional strictness

Only set `diagnostics-fail-if-missing: true` if the user wants the step to fail when diagnostics are enabled but no files match or all parses fail. Default is `false`.

#### Multiple diagnostic files

When a workflow produces diagnostics from multiple steps or formats, use comma-separated globs:

```yaml
diagnostics-files: 'build.log,eslint.sarif'
```

### Phase 6 — Configure outputs (ask the user)

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

### Phase 7 — History repository (optional)

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

**Do not enable history unconditionally on `pull_request` workflows.** Fork PRs cannot access repository secrets, so `history-token` will be empty and the step can fail. Guard with the same pattern used for PR comments:

```yaml
history-enabled: ${{ github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository }}
history-repository: 'my-org/actions-insights-history'
history-token: ${{ secrets.ACTIONS_INSIGHTS_HISTORY_TOKEN }}
```

See [History Repository Configuration](../history-repository/configuration) and [Adding Repositories](../history-repository/adding-repositories) for multi-repo setup.

#### Workflow timing (automatic)

When `history-enabled: true`, `workflow-timing-enabled` defaults to **`true`** — no extra build steps are required. The action fetches job and step durations from the current workflow run via the GitHub Actions API. Ensure `actions: read` is in permissions when using restricted token scopes (see Phase 2). To disable timing capture, set `workflow-timing-enabled: false`.

#### Dashboard tabs

When history is enabled, the React dashboard surfaces:

- **Test Coverage** — line coverage trends (when `coverage-enabled: true`)
- **Build Insights** — diagnostic error/warning trends and workflow/test duration charts (when diagnostics and/or timing data is present)
- **Run → Build** — step timeline and diagnostics grouped by file (lazy-loaded detail)

#### Combined example (coverage + diagnostics + history)

```yaml
permissions:
  contents: read
  actions: read
  pull-requests: write

- uses: mzbrau/actions-insights@v1
  if: always()
  with:
    test-results: '**/*.trx'
    coverage-enabled: true
    coverage-files: '**/coverage.cobertura.xml'
    diagnostics-enabled: true
    diagnostics-files: 'build.log'
    history-enabled: true
    history-repository: 'my-org/actions-insights-history'
    history-token: ${{ secrets.ACTIONS_INSIGHTS_HISTORY_TOKEN }}
```

### Phase 8 — Validate

Before committing, verify every item on the [Setup Checklist](./checklist). At minimum:

- [ ] Test runner emits TRX, JUnit, NUnit, or xUnit XML
- [ ] `test-results` glob matches the actual output path
- [ ] Actions Insights step runs **after** the test step
- [ ] Workflow permissions match enabled outputs **and every other step in the job** (e.g. `contents: write` for release jobs)
- [ ] `continue-on-error: true` on reporting steps that must not block releases or builds
- [ ] If coverage enabled: test runner writes a supported format (Cobertura, OpenCover, LCOV, or JaCoCo) before the action step
- [ ] `coverage-files` glob matches the actual coverage output path (or all coverage inputs omitted/default)
- [ ] `coverage-enabled`, `coverage-files`, and `coverage-fail-if-missing` set together (or all omitted/default)
- [ ] If diagnostics enabled: build/compile step writes SARIF or compiler log before the action step
- [ ] `diagnostics-files` glob matches the actual diagnostic output path (or all diagnostics inputs omitted/default)
- [ ] `diagnostics-enabled`, `diagnostics-files`, and `diagnostics-fail-if-missing` set together (or all omitted/default)
- [ ] `history-enabled`, `history-repository`, and `history-token` are set together (or all omitted)
- [ ] If history enabled: `actions: read` present when using restricted permissions
- [ ] If history enabled: `workflow-timing-enabled` considered (default on; set `false` only if user opts out)
- [ ] `history-enabled` is guarded on `pull_request` workflows (fork PRs cannot access secrets)
- [ ] Fork PR workflows use a separate reporting job if PR comments are needed

Summarize changes to the user and explain how to verify:

1. Open a pull request to see the test summary comment (and coverage line, if enabled)
2. Open the workflow run to see the job summary table (and Coverage section, if enabled)
3. Download the `actions-insights-report` artifact for the full HTML report
4. If history repository is enabled, confirm the **Test Coverage** tab shows trend data (when coverage enabled)
5. If history repository is enabled, confirm the **Build Insights** tab shows diagnostic and/or duration trends; open a run → **Build** for step timeline and file-grouped diagnostics

---

## Workflow integration rules

When adding or modifying Actions Insights across multiple workflows, apply these rules to avoid common regressions:

| Workflow type | Report step placement | `continue-on-error` | `contents` permission |
|---------------|----------------------|---------------------|-------------------------|
| CI / build | Separate `test-report` job or after tests | Recommended (parity with `fail-on-error: false`) | `read` is fine |
| Release / pre-release | Same job as `gh release create` | **Required** | **`write`** (release upload) |

1. **Job-level permissions must satisfy every step** — `contents: read` breaks `gh release create` and release asset uploads in the same job.
2. **`if: always()` is not non-blocking** — add `continue-on-error: true` so reporting failures do not skip release or deploy steps.
3. **History requires a token** — guard `history-enabled` on fork PRs; secrets are unavailable to workflows triggered by external forks.
4. **Preserve non-blocking reporting** — when migrating from `dorny/test-reporter` or similar, keep reporting failures from failing CI.

See [Example Workflows](./example-workflows) for release and fork-PR patterns.

## Do not

- Use TAP, JSON, or other unsupported test reporter formats
- Place the Actions Insights step before tests run
- Copy default values from the README — use [`action.yml`](https://github.com/mzbrau/actions-insights/blob/main/action.yml) as the source of truth
- Set `contents: read` on jobs that also create GitHub Releases or upload release assets
- Rely on `if: always()` alone to make reporting non-blocking — add `continue-on-error: true`
- Enable `coverage-enabled` without updating the test command to produce coverage files
- Enable `coverage-enabled: true` unconditionally — always ask the user first
- Use unsupported coverage formats (only Cobertura, OpenCover, LCOV, and JaCoCo are supported)
- Enable `diagnostics-enabled` without updating the build step to produce log/SARIF files
- Enable `diagnostics-enabled: true` unconditionally — always ask the user first
- Expect Build Insights dashboard data without `history-enabled: true`
- Enable `history-enabled` without `history-token` and `history-repository`
- Enable `history-enabled: true` unconditionally on `pull_request` workflows (fork PRs cannot access secrets)
- Use `pull_request_target` without explaining the security trade-offs

## Further reading

- [Quick Start](./quick-start) — minimal workflow example
- [Configuration Reference](../reference/configuration) — every input and output
- [Build diagnostics](../reference/build-diagnostics) — SARIF, MSBuild, and gcc/clang setup
- [Example Workflows](./example-workflows) — complete YAML for common scenarios
