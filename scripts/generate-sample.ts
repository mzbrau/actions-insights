import * as fs from 'fs';
import * as path from 'path';
import { parseTestFiles } from '../src/parsers/registry';
import { computeStats, deriveStatus } from '../src/model/test-run';
import { integrateReportIntoSite } from '../src/history/integrate';
import type { TestRun } from '../src/model/test-run';
import { defaultLocalConfig } from './default-config';

async function main(): Promise<void> {
  const fixtures = path.join(__dirname, '..', 'test', 'fixtures');
  const { tests, sourceFiles, matchedFiles } = await parseTestFiles('*.trx', fixtures);
  const stats = computeStats(tests);
  const status = deriveStatus(tests);

  const context = {
    repository: 'mzbrau/actions-insights',
    repositoryUrl: 'https://github.com/mzbrau/actions-insights',
    workflow: 'CI',
    workflowUrl: 'https://github.com/mzbrau/actions-insights/actions/runs/1',
    runId: 4829,
    runAttempt: 1,
    branch: 'main',
    ref: 'refs/heads/main',
    prNumber: 123,
    prUrl: 'https://github.com/mzbrau/actions-insights/pull/123',
    commitSha: 'abc123def456789',
    commitShortSha: 'abc123d',
    commitMessage: 'Add test report action',
    commitUrl: 'https://github.com/mzbrau/actions-insights/commit/abc123def456789',
    author: 'octocat',
    actor: 'octocat',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  const run: TestRun = {
    id: '4829',
    title: 'Actions Insights',
    status,
    stats,
    tests,
    context,
    sourceFiles,
    matchedFiles,
    reportPath: '_report',
  };

  const config = defaultLocalConfig({ testResults: '*.trx' });

  if (fs.existsSync('_report')) fs.rmSync('_report', { recursive: true, force: true });
  if (fs.existsSync('_site')) fs.rmSync('_site', { recursive: true, force: true });

  integrateReportIntoSite(run, config, '_site');
  console.log('Sample report generated at _report/report.html and _report/trends.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
