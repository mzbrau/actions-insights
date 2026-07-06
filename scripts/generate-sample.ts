import * as fs from 'fs';
import * as path from 'path';
import { parseTestFiles } from '../src/parsers/registry';
import { computeStats, deriveStatus } from '../src/model/test-run';
import { integrateReportIntoSite } from '../src/history/integrate';
import type { ActionConfig } from '../src/config';
import type { TestRun } from '../src/model/test-run';

async function main(): Promise<void> {
  const fixtures = path.join(__dirname, '..', 'test', 'fixtures');
  const { tests, sourceFiles } = await parseTestFiles('*.trx', fixtures);
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
    reportPath: '_report',
    pagesBaseUrl: 'https://mzbrau.github.io/actions-insights',
  };

  const config: ActionConfig = {
    testResults: '*.trx',
    pagesSubdirectory: 'test-reports',
    publishPages: false,
    pagesMode: 'none',
    commentPr: false,
    historyLimit: 20,
    retainDays: 30,
    reportTitle: 'Actions Insights',
    reportOutput: '_report',
    siteOutput: '_site',
    theme: 'auto',
    slowTestThresholdMs: 1000,
    seedFromGhPages: false,
    githubToken: '',
  };

  if (fs.existsSync('_report')) fs.rmSync('_report', { recursive: true, force: true });
  if (fs.existsSync('_site')) fs.rmSync('_site', { recursive: true, force: true });

  integrateReportIntoSite(run, config, '_site', run.pagesBaseUrl);
  console.log('Sample report generated at _report/ and _site/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
