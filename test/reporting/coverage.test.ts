import { describe, expect, it } from 'vitest';
import { coberturaParser } from '../../src/coverage-parsers/cobertura';
import { formatCoverageCompactLine, formatCoverageStatsTable } from '../../src/reporting/coverage-stats';
import { renderPrComment } from '../../src/reporting/pr-comment';
import { sampleRun, sampleConfig } from '../reporting/fixtures';
import * as fs from 'fs';
import * as path from 'path';

describe('coverage reporting', () => {
  it('includes coverage in PR comment', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, '../fixtures/coverage/cobertura.xml'),
      'utf8',
    );
    const run = {
      ...sampleRun,
      coverage: coberturaParser.parse(fixture, 'coverage.cobertura.xml'),
    };
    const body = renderPrComment(
      {
        run,
        failedTests: [],
        failedCount: 0,
        slowTests: [],
        skippedTests: [],
        extendedStats: {
          total: run.stats.total,
          passed: run.stats.passed,
          failed: run.stats.failed,
          skipped: run.stats.skipped,
          durationMs: run.stats.durationMs,
          successRate: run.stats.successRate,
          avgDurationMs: 100,
          longestTestName: 'x',
          longestTestDurationMs: 100,
        },
      },
      sampleConfig,
      { workflowRun: 'https://example.com', artifacts: 'https://example.com/a', commit: 'https://example.com/c' },
    );
    expect(body).toContain('Coverage');
    expect(body).toContain('## Coverage');
    expect(body).toContain('75.0%');
  });

  it('formats compact coverage line with delta', () => {
    const line = formatCoverageCompactLine(
      { line: 82.4, branch: 71.2 },
      { line: 1.3, branch: -0.5 },
      'main',
    );
    expect(line).toContain('82.4%');
    expect(line).toContain('+1.3%');
    expect(line).not.toContain('branch');
  });

  it('formats coverage stats table', () => {
    const table = formatCoverageStatsTable(
      { line: 80, branch: 70, coveredLines: 8, totalLines: 10 },
      { App: { line: 80, branch: 70 } },
    );
    expect(table).toContain('Line coverage');
    expect(table).toContain('App');
    expect(table).not.toContain('Branch coverage');
    expect(table).not.toContain('| Branch |');
  });
});
