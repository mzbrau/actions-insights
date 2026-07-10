import * as fs from 'fs';
import * as path from 'path';
import { parseTestFiles } from '../src/parsers/registry';
import { computeStats, deriveStatus } from '../src/model/test-run';
import { integrateReportIntoSite } from '../src/history/integrate';
import type { TestRun } from '../src/model/test-run';
import { defaultLocalConfig } from './default-config';

function usage(): never {
  console.error(`Usage: npm run generate-local -- <glob-or-path> [search-directory]

Examples:
  npm run generate-local -- .local-results/unit-test-results.trx
  npm run generate-local -- "**/*.trx" .local-results
  npm run generate-local -- .local-results/nunit-results.xml
`);
  process.exit(1);
}

async function main(): Promise<void> {
  const pattern = process.argv[2];
  if (!pattern) usage();

  const searchDir = process.argv[3] ? path.resolve(process.argv[3]) : process.cwd();
  const resolvedPattern = path.isAbsolute(pattern) ? pattern : pattern;

  console.log(`Parsing: ${resolvedPattern} (cwd: ${searchDir})`);
  const { tests, sourceFiles, matchedFiles } = await parseTestFiles(resolvedPattern, searchDir);

  if (sourceFiles.length === 0 && matchedFiles.length === 0) {
    console.error('No matching test result files found.');
    process.exit(1);
  }

  console.log(`Found ${sourceFiles.length} file(s), ${tests.length.toLocaleString()} test(s)`);
  for (const file of sourceFiles) {
    console.log(`  - ${path.relative(process.cwd(), file)}`);
  }

  const stats = computeStats(tests);
  const status = deriveStatus(tests);
  const now = new Date().toISOString();

  const context = {
    repository: 'local/dev',
    repositoryUrl: 'https://github.com/local/dev',
    workflow: 'local',
    workflowUrl: 'https://github.com/local/dev/actions/runs/1',
    runId: Date.now(),
    runAttempt: 1,
    branch: 'main',
    ref: 'refs/heads/main',
    commitSha: 'local000000000000000000000000000000000000',
    commitShortSha: 'local00',
    commitMessage: 'Local report generation',
    commitUrl: 'https://github.com/local/dev/commit/local00',
    author: 'local',
    actor: 'local',
    startedAt: now,
    completedAt: now,
  };

  const run: TestRun = {
    id: String(context.runId),
    title: 'Actions Insights',
    status,
    stats,
    tests,
    context,
    sourceFiles,
    matchedFiles,
    reportPath: '_report',
  };

  const config = defaultLocalConfig({ testResults: resolvedPattern });

  if (fs.existsSync('_report')) fs.rmSync('_report', { recursive: true, force: true });
  if (fs.existsSync('_site')) fs.rmSync('_site', { recursive: true, force: true });

  integrateReportIntoSite(run, config, '_site');
  console.log('\nReport generated:');
  console.log('  _report/report.html');
  console.log('  _report/trends.json');
  console.log(`  ${stats.total.toLocaleString()} total · ${stats.failed.toLocaleString()} failed · ${stats.passed.toLocaleString()} passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
