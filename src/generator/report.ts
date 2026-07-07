import * as fs from 'fs';
import * as path from 'path';
import type { ThemeMode } from '../config';
import type { TrendsFile } from '../model/manifest';
import { OUTCOME_TO_CODE } from '../model/manifest';
import type { TestCase } from '../model/test-case';
import type { TestRun } from '../model/test-run';
import { formatDuration } from '../model/test-run';
import { getShortTestName, groupTestsByClass } from '../reporting/grouping';
import { escapeHtml } from './escape';

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

function toCompactTests(run: TestRun, slowThresholdMs: number) {
  return run.tests.map((test, index) => ({
    i: index,
    n: test.fullName,
    o: OUTCOME_TO_CODE[test.outcome] ?? 3,
    d: test.durationMs,
    a: test.assembly,
    ns: test.namespace,
    c: test.className,
    m: test.method ?? test.name,
    sf: test.sourceFile,
    nf: test.isNewFailure,
  }));
}

function safeRepoPath(p: string | undefined): string | undefined {
  const v = (p ?? '').trim().replace(/^\/+/, '');
  return v ? v : undefined;
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
  const codePath = safeRepoPath(test.sourceFile);
  const codeUrl = codePath ? `${ctx.repositoryUrl}/blob/${ctx.commitSha}/${codePath}` : undefined;
  const links = `<span class="test-links">
      <a href="${escapeHtml(ctx.workflowUrl)}" target="_blank" rel="noopener">log</a>
      ${codeUrl ? ` · <a href="${escapeHtml(codeUrl)}" target="_blank" rel="noopener">code</a>` : ''}
    </span>`;

  return `<article class="failure-item${newClass}">
    <div class="failure-header">
      <div>
        <div class="failure-name">${escapeHtml(shortName)} ${links}</div>
        ${test.message ? `<div class="failure-message">${escapeHtml(test.message)}</div>` : ''}
      </div>
      <span>${formatDuration(test.durationMs)}</span>
    </div>
    <div class="failure-body">${stack}${stdout ? `<p><strong>StdOut</strong></p>${stdout}` : ''}${stderr ? `<p><strong>StdErr</strong></p>${stderr}` : ''}</div>
  </article>`;
}

function renderFailuresSection(run: TestRun): string {
  const failures = run.tests.filter((t) => t.outcome === 'failed');
  if (failures.length === 0) {
    return '<div class="empty-state">No failures — all tests passed.</div>';
  }

  const groups = groupTestsByClass(failures);
  return groups.map((group) => `
    <div class="failure-group">
      <div class="failure-group-title">${escapeHtml(group.qualifiedClassName)}</div>
      ${group.tests.map((t) => renderFailureBlock(t, run.context)).join('')}
    </div>`).join('');
}

export function writeRunReport(
  run: TestRun,
  outputDir: string,
  config: { reportTitle: string; theme: ThemeMode; slowTestThresholdMs: number },
  trends: TrendsFile,
): void {
  fs.mkdirSync(outputDir, { recursive: true });
  const html = renderReportHtml(run, config.reportTitle, config.theme, config.slowTestThresholdMs);
  fs.writeFileSync(path.join(outputDir, 'report.html'), html);
  fs.writeFileSync(path.join(outputDir, 'trends.json'), JSON.stringify(trends, null, 2));
}

export function renderReportHtml(
  run: TestRun,
  reportTitle: string,
  theme: ThemeMode,
  slowThresholdMs: number,
): string {
  const { stats, context: ctx, status } = run;
  const runTimestamp = ctx.completedAt || ctx.startedAt;
  const runTimestampLabel = runTimestamp ? new Date(runTimestamp).toLocaleString() : '';
  const css = readAsset('report-v2.css');
  const js = readAsset('report-app.js');
  const runJson = JSON.stringify({
    stats,
    context: {
      repository: ctx.repository,
      workflow: ctx.workflow,
      branch: ctx.branch,
      commitShortSha: ctx.commitShortSha,
      commitSha: ctx.commitSha,
      author: ctx.author,
      workflowUrl: ctx.workflowUrl,
      repositoryUrl: ctx.repositoryUrl,
    },
    tests: toCompactTests(run, slowThresholdMs),
    slowThreshold: slowThresholdMs,
  }).replace(/</g, '\\u003c');

  const bannerClass = status === 'passed' ? 'passed' : 'failed';
  const bannerLabel = status === 'passed' ? 'PASSED' : 'FAILED';
  const bannerIcon = status === 'passed' ? '✅' : '❌';
  const bannerDetail = status === 'passed'
    ? `All ${stats.total.toLocaleString()} tests passed`
    : `${stats.failed.toLocaleString()} of ${stats.total.toLocaleString()} tests failed`;

  return `<!DOCTYPE html>
<html lang="en" data-default-theme="${escapeHtml(theme)}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(reportTitle)} — Test Report</title>
  <style>${css}</style>
</head>
<body>
<div class="app">
  <header class="header">
    <div>
      <div class="header-brand">${escapeHtml(reportTitle)}</div>
      <div class="header-meta">
        <span><strong>${escapeHtml(ctx.repository)}</strong></span>
        <span>${escapeHtml(ctx.workflow)}</span>
        <span>${escapeHtml(ctx.branch)}</span>
        <span><a href="${escapeHtml(ctx.commitUrl)}" target="_blank" rel="noopener"><code>${escapeHtml(ctx.commitShortSha)}</code></a> ${escapeHtml(ctx.author)}</span>
        ${runTimestampLabel ? `<span>${escapeHtml(runTimestampLabel)}</span>` : ''}
      </div>
    </div>
    <div class="header-actions">
      <button id="theme-toggle" class="btn" type="button" aria-label="Toggle theme">◐ Theme</button>
      <a href="${escapeHtml(ctx.workflowUrl)}" class="btn btn-primary" target="_blank" rel="noopener">Workflow</a>
    </div>
  </header>

  <nav class="tab-bar">
    <button class="tab active" data-tab="summary" type="button">Summary</button>
    <button class="tab" data-tab="tests" type="button">All Tests (${stats.total.toLocaleString()})</button>
  </nav>

  <main id="panel-summary" class="tab-panel active">
    <div class="status-banner ${bannerClass}">
      <h1>${bannerIcon} ${bannerLabel}</h1>
      <p>${escapeHtml(bannerDetail)} · ${formatDuration(stats.durationMs)} total</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="label">Total</div><div class="value">${stats.total.toLocaleString()}</div></div>
      <div class="stat-card passed"><div class="label">Passed</div><div class="value">${stats.passed.toLocaleString()}</div></div>
      <div class="stat-card failed"><div class="label">Failed</div><div class="value">${stats.failed.toLocaleString()}</div></div>
      <div class="stat-card"><div class="label">Skipped</div><div class="value">${stats.skipped.toLocaleString()}</div></div>
      <div class="stat-card"><div class="label">Duration</div><div class="value">${formatDuration(stats.durationMs)}</div></div>
      <div class="stat-card"><div class="label">Success</div><div class="value">${stats.successRate}%</div></div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <h3>Outcome Distribution</h3>
        <div class="chart-wrap"><svg id="pie-chart" width="160" height="160" viewBox="0 0 160 160"></svg></div>
      </div>
      <div class="chart-card">
        <h3>Recent Runs (branch)</h3>
        <div class="chart-wrap"><svg id="bar-chart" width="280" height="140" viewBox="0 0 280 140"></svg></div>
      </div>
    </div>

    <h2 class="section-title">Failed Tests (${stats.failed.toLocaleString()})</h2>
    ${renderFailuresSection(run)}
  </main>

  <main id="panel-tests" class="tab-panel">
    <div id="trends-notice" class="trends-notice hidden">
      Load <code>trends.json</code> to view test history.
      <button id="load-trends-btn" class="btn" type="button">Load trends.json</button>
      <input id="load-trends-file" type="file" accept=".json,application/json" hidden/>
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

  <footer class="footer">
    <span>Actions Insights</span>
    <a href="${escapeHtml(ctx.commitUrl)}">${escapeHtml(ctx.commitShortSha)}</a>
    <span>${escapeHtml(ctx.commitMessage)}</span>
  </footer>
</div>
<script id="run-data" type="application/json">${runJson}</script>
<script>${js}</script>
</body>
</html>`;
}

export { toCompactTests };
