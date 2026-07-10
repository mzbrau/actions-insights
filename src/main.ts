import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig } from './config';
import { publishCheckRun } from './github/checks';
import { upsertPrComment } from './github/comment';
import { detectContext } from './github/context';
import { resolveCurrentJobUrl } from './github/jobs';
import { writeJobSummary } from './github/job-summary';
import { integrateReportIntoSite } from './history/integrate';
import { computeStats, deriveStatus } from './model/test-run';
import { parseTestFiles } from './parsers/registry';
import { parseCoverageFiles } from './coverage-parsers/registry';
import { uploadReportArtifact } from './publisher/artifact';
import { prepareSiteWorkspace, saveSiteCache } from './publisher/site-cache';
import { ensureDir } from './publisher/site-merger';
import { publishToHistoryRepository } from './history-repo/publish';
import { buildReportLinks } from './reporting/links';
import { resolveRunCompletedAt } from './reporting/time';
import type { TestRun } from './model/test-run';
import { buildHistoryRunUrl, resolveHistoryPagesBaseUrl } from './history-repo/dashboard-url';

async function run(): Promise<void> {
  const config = loadConfig();
  const context = detectContext();
  context.jobUrl = await resolveCurrentJobUrl(config.githubToken, context);
  const links = buildReportLinks(context);

  core.info(`Parsing test results: ${config.testResults}`);
  const { tests, sourceFiles, matchedFiles } = await parseTestFiles(config.testResults);

  if (tests.length === 0) {
    core.warning('No test results found. Ensure test-results glob matches your output files.');
  }

  let coverage = undefined;
  if (config.coverage.enabled) {
    core.info(`Parsing coverage files: ${config.coverage.files}`);
    coverage = await parseCoverageFiles(config.coverage.files);
    if (!coverage || coverage.sourceFiles.length === 0) {
      const message = 'No coverage files found or parsed. Ensure coverage-files glob matches your output files.';
      if (config.coverage.failIfMissing) {
        core.setFailed(message);
        return;
      }
      core.warning(message);
      coverage = undefined;
    } else if (coverage.summary.line !== undefined) {
      core.info(`Coverage: ${coverage.summary.line}% lines${coverage.summary.branch !== undefined ? `, ${coverage.summary.branch}% branches` : ''}`);
    }
  }

  context.completedAt = resolveRunCompletedAt(sourceFiles, new Date().toISOString());

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
    matchedFiles,
    reportPath: config.reportOutput,
    coverage,
  };

  ensureDir(config.siteOutput);
  const { owner, repo } = github.context.repo;

  await prepareSiteWorkspace(config.siteOutput, owner, repo);
  const { previousRun, baseBranchRun, previousCoverageRun, baseBranchCoverageRun, artifactDir, mergedRun } = integrateReportIntoSite(testRun, config, config.siteOutput);
  await saveSiteCache(config.siteOutput, owner, repo);

  if (config.history.enabled) {
    try {
      await publishToHistoryRepository(mergedRun, config);
    } catch (error) {
      core.warning(`History repository publish failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (config.uploadHtmlReport) {
    try {
      await uploadReportArtifact(artifactDir, config.artifactRetentionDays, context.commitShortSha, {
        includeRawTestResults: config.includeRawTestResults,
        matchedFiles: mergedRun.matchedFiles ?? matchedFiles,
        sourceFiles: mergedRun.sourceFiles,
      });
    } catch (error) {
      core.warning(`Artifact upload failed: ${error instanceof Error ? error.message : String(error)}`);
      core.info(`Report files are available locally at ${config.siteOutput}`);
    }
  }

  if (config.commentMode === 'update' && context.prNumber) {
    let historyRunUrl: string | undefined;
    if (config.history.enabled && config.history.repositoryName) {
      const base = await resolveHistoryPagesBaseUrl(config.history);
      if (base) {
        historyRunUrl = buildHistoryRunUrl(base, config.history.repositoryName, testRun.context, testRun.id);
      }
    }
    await upsertPrComment(config.githubToken, mergedRun, config, previousRun, baseBranchRun, historyRunUrl, previousCoverageRun, baseBranchCoverageRun);
  }

  await writeJobSummary(mergedRun, config, previousRun, previousCoverageRun, baseBranchCoverageRun);

  if (config.publishChecks) {
    await publishCheckRun(config.githubToken, mergedRun, config);
  }

  core.setOutput('workflow-url', links.workflowRun);
  core.setOutput('artifact-url', links.artifacts);
  core.setOutput('status', status);
  core.setOutput('total', String(stats.total));
  core.setOutput('passed', String(stats.passed));
  core.setOutput('failed', String(stats.failed));
  core.setOutput('skipped', String(stats.skipped));
  core.setOutput('coverage-line', mergedRun.coverage?.summary.line !== undefined ? String(mergedRun.coverage.summary.line) : '');
  core.setOutput('coverage-branch', mergedRun.coverage?.summary.branch !== undefined ? String(mergedRun.coverage.summary.branch) : '');
  core.setOutput('coverage-status', mergedRun.coverage?.sourceFiles.length ? 'present' : 'missing');

  if (status === 'failed') {
    core.setFailed(`${stats.failed} test(s) failed`);
  }
}

run().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
