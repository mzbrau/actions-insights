import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig } from './config';
import { publishCheckRun } from './github/checks';
import { upsertPrComment } from './github/comment';
import { detectContext } from './github/context';
import { writeJobSummary } from './github/job-summary';
import { integrateReportIntoSite } from './history/integrate';
import { computeStats, deriveStatus } from './model/test-run';
import { parseTestFiles } from './parsers/registry';
import { uploadReportArtifact } from './publisher/artifact';
import { prepareSiteWorkspace, saveSiteCache } from './publisher/site-cache';
import { ensureDir } from './publisher/site-merger';
import { buildReportLinks } from './reporting/links';
import type { TestRun } from './model/test-run';

async function run(): Promise<void> {
  const config = loadConfig();
  const context = detectContext();
  const links = buildReportLinks(context);

  core.info(`Parsing test results: ${config.testResults}`);
  const { tests, sourceFiles } = await parseTestFiles(config.testResults);

  if (tests.length === 0) {
    core.warning('No test results found. Ensure test-results glob matches your output files.');
  }

  const stats = computeStats(tests);
  const status = deriveStatus(tests);
  const testRun: TestRun = {
    id: String(context.runId),
    title: config.reportTitle,
    status,
    stats,
    tests,
    context,
    sourceFiles,
    reportPath: config.reportOutput,
  };

  ensureDir(config.siteOutput);
  const { owner, repo } = github.context.repo;

  await prepareSiteWorkspace(config.siteOutput, owner, repo);
  const { previousRun } = integrateReportIntoSite(testRun, config, config.siteOutput);
  await saveSiteCache(config.siteOutput, owner, repo);

  if (config.uploadHtmlReport) {
    try {
      await uploadReportArtifact(config.siteOutput, config.artifactRetentionDays);
    } catch (error) {
      core.warning(`Artifact upload failed: ${error instanceof Error ? error.message : String(error)}`);
      core.info(`Report files are available locally at ${config.siteOutput}`);
    }
  }

  if (config.commentMode === 'update' && context.prNumber) {
    await upsertPrComment(config.githubToken, testRun, config, previousRun);
  }

  await writeJobSummary(testRun, config, previousRun);

  if (config.publishChecks) {
    await publishCheckRun(config.githubToken, testRun, config);
  }

  core.setOutput('workflow-url', links.workflowRun);
  core.setOutput('artifact-url', links.artifacts);
  core.setOutput('status', status);
  core.setOutput('total', String(stats.total));
  core.setOutput('passed', String(stats.passed));
  core.setOutput('failed', String(stats.failed));
  core.setOutput('skipped', String(stats.skipped));

  if (status === 'failed') {
    core.setFailed(`${stats.failed} test(s) failed`);
  }
}

run().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
