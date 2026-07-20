import * as fs from 'fs';
import * as path from 'path';
import type { ThemeMode } from '../config';
import {
  encodeCoverageRunRecord,
  toCoverageSummaryCompact,
  type CoverageSummaryCompact,
} from '../model/coverage';
import { encodeDiagnosticRunRecord } from '../model/diagnostics';
import type { TrendsFile } from '../model/manifest';
import { OUTCOME_TO_CODE } from '../model/manifest';
import type { TestCase } from '../model/test-case';
import type { TestRun } from '../model/test-run';
import { formatDuration } from '../model/test-run';
import { encodeTimingRunRecord } from '../model/timing';
import {
  computeCoverageDelta,
  formatCoverageDeltaValue,
  formatCoveragePercent,
} from '../reporting/coverage-stats';
import { getCodeSearchName, getShortTestName, groupTestsByClass } from '../reporting/grouping';
import {
  formatAiAgentInstructions,
} from '@actions-insights/history-models';
import { toAiAgentContextInput, toAiAgentFailureInput } from '../reporting/ai-agent-section';
import { escapeHtml } from './escape';

const COPY_NAME_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

function renderCopyNameButton(fullName: string): string {
  return `<button type="button" class="copy-name-btn" data-copy-name="${escapeHtml(fullName)}" aria-label="Copy test name" title="Copy full test name">${COPY_NAME_ICON}</button>`;
}

function resolveAssetsDir(): string {
  const candidates = [
    path.join(__dirname, 'assets'),
    path.join(__dirname, '..', 'src', 'generator', 'assets'),
    path.join(process.cwd(), 'dist', 'assets'),
    path.join(process.cwd(), 'src', 'generator', 'assets'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'report-v2.css'))) {
      return candidate;
    }
  }
  throw new Error('Could not locate generator assets directory');
}

function readAsset(name: string): string {
  return fs.readFileSync(path.join(resolveAssetsDir(), name), 'utf8');
}

function readLogoDataUri(name: 'logo-white.png' | 'logo-black.png'): string {
  const buf = fs.readFileSync(path.join(resolveAssetsDir(), name));
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function toCompactTests(run: TestRun, _slowThresholdMs: number) {
  return run.tests.map((test, index) => ({
    i: index,
    n: test.fullName,
    o: OUTCOME_TO_CODE[test.outcome] ?? 3,
    d: test.durationMs,
    a: test.assembly,
    ns: test.namespace,
    c: test.className,
    m: test.method ?? test.name,
    nf: test.isNewFailure,
  }));
}

function renderFailureBlock(test: TestCase, ctx: TestRun['context']): string {
  const newClass = test.isNewFailure ? ' new-failure' : '';
  const stack = test.stackTrace
    ? `<div class="code-block"><button class="copy-btn" type="button">Copy</button><pre>${escapeHtml(test.stackTrace)}</pre></div>`
    : '';
  const stdout = test.stdout
    ? `<div class="code-block"><pre>${escapeHtml(test.stdout)}</pre></div>`
    : '';
  const stderr = test.stderr
    ? `<div class="code-block"><pre>${escapeHtml(test.stderr)}</pre></div>`
    : '';

  const shortName = getShortTestName(test);
  const logUrl = ctx.jobUrl || ctx.workflowUrl;
  const codeUrl = `https://github.com/search?q=${encodeURIComponent(`repo:${ctx.repository} ${getCodeSearchName(test)}`)}&type=code`;
  const links = `<span class="test-links">
      <a href="${escapeHtml(logUrl)}" target="_blank" rel="noopener">log</a>
      · <a href="${escapeHtml(codeUrl)}" target="_blank" rel="noopener">code</a>
    </span>`;

  return `<article class="failure-item${newClass}">
    <div class="failure-header">
      <div>
        <div class="failure-name">${escapeHtml(shortName)}${renderCopyNameButton(test.fullName)} ${links}</div>
        ${test.message ? `<div class="failure-message">${escapeHtml(test.message)}</div>` : ''}
      </div>
      <span>${formatDuration(test.durationMs)}</span>
    </div>
    <div class="failure-body">${stack}${stdout ? `<p><strong>StdOut</strong></p>${stdout}` : ''}${stderr ? `<p><strong>StdErr</strong></p>${stderr}` : ''}</div>
  </article>`;
}

function renderAiAgentSection(run: TestRun, failures: TestCase[]): string {
  const prompt = formatAiAgentInstructions(
    failures.map(toAiAgentFailureInput),
    toAiAgentContextInput(run),
  );
  return `<details class="ai-agent-details">
    <summary>Instructions for an AI agent</summary>
    <pre class="ai-agent-prompt">${escapeHtml(prompt.trimEnd())}</pre>
    <button type="button" class="copy-btn ai-agent-copy-btn">Copy</button>
  </details>`;
}

function renderFailuresSection(run: TestRun): string {
  const failures = run.tests.filter((t) => t.outcome === 'failed');
  if (failures.length === 0) return '';

  const groups = groupTestsByClass(failures);
  const body = groups.map((group) => `
    <div class="failure-group">
      <div class="failure-group-title">${escapeHtml(group.qualifiedClassName)}</div>
      ${group.tests.map((t) => renderFailureBlock(t, run.context)).join('')}
    </div>`).join('');

  return `<section class="section">
    <h2 class="section-title">Failed Tests (${failures.length.toLocaleString()})</h2>
    ${body}
    ${renderAiAgentSection(run, failures)}
  </section>`;
}

function renderSlowTestsSection(run: TestRun, slowThresholdMs: number): string {
  const slow = run.tests
    .filter((t) => t.outcome === 'passed' && t.durationMs >= slowThresholdMs)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 18);
  if (slow.length === 0) return '';

  const items = slow.map((t) =>
    `<li>⏱ ${escapeHtml(getShortTestName(t))}${renderCopyNameButton(t.fullName)} — ${formatDuration(t.durationMs)}</li>`).join('');

  return `<section class="section">
    <h2 class="section-title">Slow tests</h2>
    <ul class="simple-list">${items}</ul>
  </section>`;
}

function renderCoverageProgressBar(label: string, value: number | undefined, variant: 'line' | 'branch'): string {
  if (value === undefined) return '';
  const pct = Math.min(100, Math.max(0, value));
  return `<div class="coverage-progress" role="group" aria-label="${escapeHtml(label)} coverage">
    <div class="coverage-progress-header">
      <span class="coverage-progress-label">${escapeHtml(label)}</span>
      <span class="coverage-progress-value">${pct.toFixed(1)}%</span>
    </div>
    <div class="coverage-progress-track coverage-progress-${variant}" role="progressbar"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"
      aria-label="${escapeHtml(label)}: ${pct.toFixed(1)} percent">
      <div class="coverage-progress-fill" style="width:${pct}%"></div>
    </div>
  </div>`;
}

function renderSummaryCoverageSection(run: TestRun): string {
  const line = run.coverage?.summary.line;
  if (line === undefined) return '';
  return `<section class="section coverage-summary-section">
    <h2 class="section-title">Code Coverage</h2>
    <div class="coverage-summary-bars">
      ${renderCoverageProgressBar('Line coverage', line, 'line')}
      ${renderCoverageProgressBar('Branch coverage', run.coverage?.summary.branch, 'branch')}
    </div>
  </section>`;
}

interface CoverageDeltaInfo {
  line?: number;
  branch?: number;
  label: 'base' | 'previous';
}

function findComparisonCoverage(
  run: TestRun,
  trends?: TrendsFile,
): CoverageSummaryCompact | undefined {
  if (run.coverage?.summary.line === undefined) return undefined;

  type RunWithCoverage = { runId: string; coverage?: CoverageSummaryCompact };
  const runs = trends?.runs as RunWithCoverage[] | undefined;
  if (!runs?.length) return undefined;

  const currentId = String(run.context.runId);
  const idx = runs.findIndex((r) => r.runId === currentId);
  const isPr = Boolean(run.context.prNumber);
  const start = idx >= 0 ? idx + 1 : 0;

  if (isPr) {
    return runs.find((r, i) => i >= start && r.coverage?.line !== undefined)?.coverage;
  }
  for (let i = start; i < runs.length; i += 1) {
    if (runs[i].coverage?.line !== undefined) return runs[i].coverage;
  }
  return undefined;
}

function buildCoverageDelta(run: TestRun, trends?: TrendsFile): CoverageDeltaInfo | undefined {
  if (run.coverage?.summary.line === undefined) return undefined;
  const previous = findComparisonCoverage(run, trends);
  if (!previous) return undefined;
  const delta = computeCoverageDelta(run.coverage.summary, previous);
  if (delta.line === undefined && delta.branch === undefined) return undefined;
  return {
    ...delta,
    label: run.context.prNumber ? 'base' : 'previous',
  };
}

function formatDeltaHint(delta: number | undefined, label: string): string {
  const formatted = formatCoverageDeltaValue(delta);
  if (!formatted) return '';
  const cls = delta === undefined || Math.abs(delta) < 0.05
    ? 'neutral'
    : delta > 0 ? 'positive' : 'negative';
  return `<div class="stat-hint ${cls}">${escapeHtml(formatted)} vs ${escapeHtml(label)}</div>`;
}

function renderCoverageStatCards(run: TestRun, delta?: CoverageDeltaInfo): string {
  const line = run.coverage?.summary.line;
  if (line === undefined) return '';
  const branch = run.coverage?.summary.branch;
  const label = delta?.label ?? 'previous';
  let html = `<div class="stat-card">
    <div class="label">Line Coverage</div>
    <div class="value">${formatCoveragePercent(line)}</div>
    ${formatDeltaHint(delta?.line, label)}
  </div>`;
  if (branch !== undefined) {
    html += `<div class="stat-card">
      <div class="label">Branch Coverage</div>
      <div class="value">${formatCoveragePercent(branch)}</div>
      ${formatDeltaHint(delta?.branch, label)}
    </div>`;
  }
  return html;
}

export function writeRunReport(
  run: TestRun,
  outputDir: string,
  config: { reportTitle: string; theme: ThemeMode; slowTestThresholdMs: number; includeRawTestResults?: boolean },
  trends: TrendsFile,
): void {
  fs.mkdirSync(outputDir, { recursive: true });
  const html = renderReportHtml(
    run,
    config.reportTitle,
    config.theme,
    config.slowTestThresholdMs,
    trends,
    config.includeRawTestResults ?? false,
  );
  fs.writeFileSync(path.join(outputDir, 'report.html'), html);
  fs.writeFileSync(path.join(outputDir, 'trends.json'), JSON.stringify(trends, null, 2));
}

export function renderReportHtml(
  run: TestRun,
  reportTitle: string,
  theme: ThemeMode,
  slowThresholdMs: number,
  trends?: TrendsFile,
  includeRawTestResults = false,
): string {
  const { stats, context: ctx, status } = run;
  const runTimestamp = ctx.completedAt || ctx.startedAt;
  const css = readAsset('report-v2.css');
  const js = readAsset('report-app.js');
  const logoLight = readLogoDataUri('logo-black.png');
  const logoDark = readLogoDataUri('logo-white.png');
  // Static initial theme for correct logo before JS runs; `auto` defaults to light
  // and report-app.js upgrades via prefers-color-scheme.
  const initialTheme = theme === 'dark' ? 'dark' : 'light';
  const logoCss = `
.header-logo-light { background-image: url("${logoLight}"); }
.header-logo-dark { background-image: url("${logoDark}"); }
`;
  const trendsJson = trends
    ? JSON.stringify(trends).replace(/</g, '\\u003c')
    : '';

  const hasCoverage = run.coverage?.summary.line !== undefined;
  const hasBuild = Boolean(run.diagnostics || run.workflowTiming);
  const coverageDelta = buildCoverageDelta(run, trends);

  const runJson = JSON.stringify({
    stats,
    status,
    context: {
      repository: ctx.repository,
      workflow: ctx.workflow,
      branch: ctx.branch,
      commitShortSha: ctx.commitShortSha,
      commitSha: ctx.commitSha,
      commitUrl: ctx.commitUrl,
      author: ctx.author,
      workflowUrl: ctx.workflowUrl,
      jobUrl: ctx.jobUrl,
      repositoryUrl: ctx.repositoryUrl,
      prNumber: ctx.prNumber,
      prUrl: ctx.prUrl,
      runId: ctx.runId,
      completedAt: runTimestamp,
    },
    tests: toCompactTests(run, slowThresholdMs),
    slowThreshold: slowThresholdMs,
    coverage: hasCoverage && run.coverage
      ? {
          summary: toCoverageSummaryCompact(run.coverage),
          detail: encodeCoverageRunRecord(String(ctx.runId), run.coverage),
        }
      : undefined,
    coverageDelta,
    diagnostics: run.diagnostics
      ? encodeDiagnosticRunRecord(String(ctx.runId), run.diagnostics)
      : undefined,
    timing: run.workflowTiming
      ? encodeTimingRunRecord(String(ctx.runId), run.workflowTiming)
      : undefined,
  }).replace(/</g, '\\u003c');

  const statusIcon = status === 'passed' ? '✓' : '✗';
  const statusClass = status === 'passed' ? 'passed' : 'failed';
  const branchOrPr = ctx.prNumber
    ? (ctx.prUrl
      ? `<a href="${escapeHtml(ctx.prUrl)}" target="_blank" rel="noopener">PR #${ctx.prNumber}</a>`
      : `PR #${ctx.prNumber}`)
    : escapeHtml(ctx.branch);

  const rawResultsNote = includeRawTestResults && (run.matchedFiles?.length ?? 0) > 0
    ? '<p class="raw-results-note">Original test result files are included in the <code>raw/</code> folder of the downloaded workflow artifact.</p>'
    : '';

  const coverageTab = hasCoverage
    ? `<button class="tab" data-tab="coverage" type="button" role="tab">Test Coverage</button>`
    : '';
  const buildTab = hasBuild
    ? `<button class="tab" data-tab="build" type="button" role="tab">Build</button>`
    : '';

  const coveragePanel = hasCoverage
    ? `<main id="panel-coverage" class="tab-panel" role="tabpanel">
    <div id="coverage-panel-root"></div>
  </main>`
    : '';

  const buildPanel = hasBuild
    ? `<main id="panel-build" class="tab-panel" role="tabpanel">
    <div id="build-panel-root"></div>
  </main>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" data-theme="${initialTheme}" data-default-theme="${escapeHtml(theme)}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(reportTitle)} — Test Report</title>
  <style>${css}${logoCss}</style>
</head>
<body>
<div class="app">
  <header class="header">
    <div class="header-main">
      <div class="header-brand-row">
        <span class="header-logo header-logo-light" role="img" aria-hidden="true"></span>
        <span class="header-logo header-logo-dark" role="img" aria-hidden="true"></span>
        <div class="header-brand">${escapeHtml(reportTitle)}</div>
      </div>
      <div class="header-meta">
        <span class="status-pill ${statusClass}" aria-label="${statusClass}">${statusIcon} ${branchOrPr}</span>
        ${runTimestamp ? `<span id="run-timestamp" data-run-timestamp="${escapeHtml(runTimestamp)}"></span>` : ''}
        <span>Test time: ${formatDuration(stats.durationMs)}</span>
      </div>
      <div class="header-meta header-meta-secondary">
        <span><strong>${escapeHtml(ctx.repository)}</strong></span>
        <span>${escapeHtml(ctx.workflow)}</span>
        <span>${escapeHtml(ctx.author)}</span>
      </div>
      ${rawResultsNote}
    </div>
    <div class="header-actions">
      <button id="theme-toggle" class="btn" type="button" aria-label="Toggle theme">◐ Theme</button>
      <a href="${escapeHtml(ctx.workflowUrl)}" class="btn btn-primary" target="_blank" rel="noopener">Workflow</a>
      <a href="${escapeHtml(ctx.commitUrl)}" class="btn" target="_blank" rel="noopener">Commit ${escapeHtml(ctx.commitShortSha)}</a>
      ${ctx.prUrl ? `<a href="${escapeHtml(ctx.prUrl)}" class="btn" target="_blank" rel="noopener">Pull request</a>` : ''}
    </div>
  </header>

  <nav class="tab-bar" role="tablist" aria-label="Page sections">
    <button class="tab active" data-tab="summary" type="button" role="tab" aria-selected="true">Summary</button>
    <button class="tab" data-tab="tests" type="button" role="tab">All Tests (${stats.total.toLocaleString()})</button>
    ${coverageTab}
    ${buildTab}
  </nav>

  <main id="panel-summary" class="tab-panel active" role="tabpanel">
    <div class="stats-grid">
      <div class="stat-card"><div class="label">Total</div><div class="value">${stats.total.toLocaleString()}</div></div>
      <div class="stat-card passed"><div class="label">Passed</div><div class="value">${stats.passed.toLocaleString()}</div></div>
      <div class="stat-card failed"><div class="label">Failed</div><div class="value">${stats.failed.toLocaleString()}</div></div>
      <div class="stat-card"><div class="label">Skipped</div><div class="value">${stats.skipped.toLocaleString()}</div></div>
      <div class="stat-card"><div class="label">Duration</div><div class="value">${formatDuration(stats.durationMs)}</div></div>
      <div class="stat-card"><div class="label">Success</div><div class="value">${stats.successRate}%</div></div>
      ${renderCoverageStatCards(run, coverageDelta)}
      <div class="stat-card stat-card-chart">
        <div class="label">Distribution</div>
        <div class="stat-chart-wrap"><svg id="pie-chart" width="72" height="72" viewBox="0 0 72 72"></svg></div>
      </div>
    </div>

    ${renderSummaryCoverageSection(run)}
    ${renderFailuresSection(run)}
    ${renderSlowTestsSection(run, slowThresholdMs)}
  </main>

  <main id="panel-tests" class="tab-panel" role="tabpanel">
    <div id="trends-notice" class="trends-notice hidden">
      Test history is unavailable for this report.
    </div>
    <div class="toolbar">
      <input id="test-search" class="search-input" type="search" placeholder="Search tests..."/>
      <select id="sort-select" class="sort-select">
        <option value="default">Sort: Default (Grouped)</option>
        <option value="name">Sort: Name</option>
        <option value="duration">Sort: Duration</option>
        <option value="outcome">Sort: Outcome</option>
        <option value="passRate">Sort: Pass Rate</option>
      </select>
      <span style="color:var(--on-surface-variant);font-size:12px"><span id="visible-count">${stats.total}</span> visible</span>
    </div>
    <div class="filter-chips">
      <button class="chip" data-filter="failed" type="button">Failed</button>
      <button class="chip" data-filter="passed" type="button">Passed</button>
      <button class="chip" data-filter="skipped" type="button">Skipped</button>
      <button class="chip" data-filter="slow" type="button">Slow</button>
      <button class="chip" data-filter="new" type="button">New Failure</button>
    </div>
    <div id="all-tests-list"></div>
  </main>

  ${coveragePanel}
  ${buildPanel}

  <footer class="footer">
    <span>Actions Insights</span>
    <a href="${escapeHtml(ctx.commitUrl)}">${escapeHtml(ctx.commitShortSha)}</a>
    <span>${escapeHtml(ctx.commitMessage)}</span>
  </footer>
</div>
${trends ? `<script id="trends-data" type="application/json">${trendsJson}</script>` : ''}
<script id="run-data" type="application/json">${runJson}</script>
<script>${js}</script>
</body>
</html>`;
}

export { toCompactTests };
