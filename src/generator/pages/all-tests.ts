import type { ThemeMode } from '../../config';
import type { CompactTestRecord } from '../../model/manifest';
import type { TestRun } from '../../model/test-run';
import { OUTCOME_TO_CODE } from '../../model/manifest';
import { escapeHtml } from '../escape';
import { renderLayout } from '../layout';

export function toCompactTests(run: TestRun, slowThresholdMs: number): CompactTestRecord[] {
  return run.tests.map((test, index) => ({
    i: index,
    n: test.fullName,
    o: OUTCOME_TO_CODE[test.outcome] ?? 3,
    d: test.durationMs,
    a: test.assembly,
    ns: test.namespace,
    c: test.className,
    m: test.message,
    st: test.stackTrace,
    nf: test.isNewFailure,
  }));
}

export function renderAllTestsPage(
  run: TestRun,
  reportTitle: string,
  theme: ThemeMode,
  slowThresholdMs: number,
): string {
  const compact = toCompactTests(run, slowThresholdMs);
  const dataJson = JSON.stringify({ tests: compact, slowThreshold: slowThresholdMs });

  const body = `
<div class="section">
  <div class="breadcrumbs"><a href="index.html">Summary</a> › All Tests</div>
  <div class="section-header">
    <h1 class="section-title">All Tests <span style="font-weight:400;color:var(--on-surface-variant)">(${run.stats.total.toLocaleString()})</span></h1>
    ${run.stats.failed > 0 ? `<span class="nav-badge">${run.stats.failed} failed</span>` : ''}
  </div>
  <div class="search-wrap">
    <input id="test-search" class="search-input" type="search" placeholder="Search tests by name, class, or assembly..." style="max-width:100%"/>
  </div>
  <div class="filter-chips">
    <button class="chip" data-filter="failed" type="button">Failed</button>
    <button class="chip" data-filter="passed" type="button">Passed</button>
    <button class="chip" data-filter="skipped" type="button">Skipped</button>
    <button class="chip" data-filter="slow" type="button">Slow</button>
    <button id="clear-filters" class="btn" type="button">Clear Filters</button>
    <span style="margin-left:auto;color:var(--on-surface-variant)"><span id="visible-count">${run.stats.total}</span> visible</span>
  </div>
  <div class="data-table-wrap virtual-scroll">
    <table class="data-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Test Name</th>
          <th class="hide-mobile">Namespace / Class</th>
          <th>Duration</th>
          <th class="hide-mobile">Assembly</th>
        </tr>
      </thead>
    </table>
    <div id="virtual-table-body"></div>
  </div>
</div>
<script id="tests-data" type="application/json">${escapeHtml(dataJson)}</script>`;

  return renderLayout({
    title: 'All Tests',
    reportTitle,
    activeNav: 'all-tests',
    run,
    theme,
  }, body);
}
