import * as artifact from '@actions/artifact';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as github from '@actions/github';
import { loadConfig } from './config';
import { upsertPrComment } from './github/comment';
import { detectContext, getPagesBaseUrl } from './github/context';
import { writeJobSummary } from './github/job-summary';
import { integrateReportIntoSite } from './history/integrate';
import { computeStats, deriveStatus } from './model/test-run';
import { parseTestFiles } from './parsers/registry';
import { publishToGhPagesBranch } from './publisher/gh-pages';
import { prepareSiteWorkspace, saveSiteCache, uploadPagesArtifact } from './publisher/pages-artifact';
import { ensureDir } from './publisher/site-merger';
import type { TestRun } from './model/test-run';

async function run(): Promise<void> {
  const config = loadConfig();
  const context = detectContext();
  const pagesBaseUrl = getPagesBaseUrl();

  core.info(`Parsing test results: ${config.testResults}`);
  const { tests, sourceFiles } = await parseTestFiles(config.testResults);

  if (tests.length === 0) {
    core.warning('No test results found. Ensure test-results glob matches your output files.');
  }

  const stats = computeStats(tests);
  const status = deriveStatus(tests);
  const run: TestRun = {
    id: String(context.runId),
    title: config.reportTitle,
    status,
    stats,
    tests,
    context,
    sourceFiles,
    reportPath: config.reportOutput,
    pagesBaseUrl,
  };

  ensureDir(config.siteOutput);
  const { owner, repo } = github.context.repo;

  if (config.pagesMode !== 'none') {
    await prepareSiteWorkspace(config.siteOutput, owner, repo, config.seedFromGhPages, config.githubToken);
  }

  const { reportUrl } = integrateReportIntoSite(run, config, config.siteOutput, pagesBaseUrl);

  if (config.pagesMode !== 'none') {
    await saveSiteCache(config.siteOutput, owner, repo);
  }

  if (config.pagesMode === 'artifact') {
    try {
      await uploadPagesArtifact(config.siteOutput);
      core.info('Uploaded GitHub Pages artifact. Deploy with actions/deploy-pages in a subsequent job.');
    } catch (error) {
      core.warning(`Pages artifact upload failed: ${error}. Report files are available at ${config.siteOutput}`);
      await uploadWorkflowArtifact(config.siteOutput, 'actions-insights-site');
    }
  } else if (config.pagesMode === 'gh-pages') {
    await publishToGhPagesBranch(
      config.siteOutput,
      config.pagesSubdirectory,
      config.githubToken,
      `chore: update test reports for run ${context.runId}`,
    );
  }

  if (config.commentPr && context.prNumber) {
    await upsertPrComment(config.githubToken, run, reportUrl);
  }

  await writeJobSummary(run, reportUrl);

  core.setOutput('report-url', reportUrl ?? '');
  core.setOutput('page-url', pagesBaseUrl ?? '');
  core.setOutput('status', status);
  core.setOutput('total', String(stats.total));
  core.setOutput('passed', String(stats.passed));
  core.setOutput('failed', String(stats.failed));
  core.setOutput('skipped', String(stats.skipped));

  if (status === 'failed') {
    core.setFailed(`${stats.failed} test(s) failed`);
  }
}

async function uploadWorkflowArtifact(dir: string, name: string): Promise<void> {
  if (!fs.existsSync(dir)) return;
  const client = new artifact.DefaultArtifactClient();
  const files = collectFiles(dir);
  if (files.length > 0) {
    await client.uploadArtifact(name, files, dir);
  }
}

function collectFiles(root: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

run().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
