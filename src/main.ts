import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig } from './config';
import { parseDiagnosticFiles } from './diagnostic-parsers/registry';
import { publishCheckRun } from './github/checks';
import { upsertPrComment } from './github/comment';
import { detectContext } from './github/context';
import { fetchWorkflowTiming, resolveCurrentJobUrl } from './github/jobs';
import { writeJobSummary } from './github/job-summary';
import { integrateReportIntoSite } from './history/integrate';
import { publishToHistoryRepository } from './history-repo/publish';
import {
  buildHistoryRepositoryUrl,
  buildHistoryRunUrl,
  resolveHistoryPagesBaseUrl,
} from './history-repo/dashboard-url';
import { computeStats, deriveStatus } from './model/test-run';
import type { TestRun } from './model/test-run';
import { parseCoverageFiles } from './coverage-parsers/registry';
import { parseTestFiles } from './parsers/registry';
import { uploadReportArtifact } from './publisher/artifact';
import { prepareSiteWorkspace, saveSiteCache } from './publisher/site-cache';
import { ensureDir } from './publisher/site-merger';
import { buildReportLinks } from './reporting/links';
import { resolveRunCompletedAt } from './reporting/time';

async function run(): Promise<void> {
  const actionPhases: Record<string, number> = {};
  const phaseStart = performance.now();

  const config = loadConfig();
  const context = detectContext();
  context.jobUrl = await resolveCurrentJobUrl(config.githubToken, context);
  let htmlArtifactUrl: string | undefined;

  core.info(`Parsing test results: ${config.testResults}`);
  const { tests, sourceFiles, matchedFiles } = await parseTestFiles(config.testResults);
  actionPhases.parseTests = Math.round(performance.now() - phaseStart);

  if (tests.length === 0) {
    core.warning('No test results found. Ensure test-results glob matches your output files.');
  }

  let coverage = undefined;
  if (config.coverage.enabled) {
    const coverageStart = performance.now();
    core.info(`Parsing coverage files: ${config.coverage.files}`);
    coverage = await parseCoverageFiles(config.coverage.files);
    actionPhases.parseCoverage = Math.round(performance.now() - coverageStart);
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

  let diagnostics = undefined;
  if (config.diagnostics.enabled) {
    const diagnosticsStart = performance.now();
    core.info(`Parsing diagnostic files: ${config.diagnostics.files}`);
    diagnostics = await parseDiagnosticFiles(config.diagnostics.files);
    actionPhases.parseDiagnostics = Math.round(performance.now() - diagnosticsStart);
    if (!diagnostics || diagnostics.sourceFiles.length === 0) {
      const message = 'No diagnostic files found or parsed. Ensure diagnostics-files glob matches your build output.';
      if (config.diagnostics.failIfMissing) {
        core.setFailed(message);
        return;
      }
      core.warning(message);
      diagnostics = undefined;
    } else {
      core.info(`Diagnostics: ${diagnostics.summary.errors} error(s), ${diagnostics.summary.warnings} warning(s)`);
    }
  }

  let workflowTiming = undefined;
  if (config.history.enabled && config.workflowTimingEnabled) {
    const timingStart = performance.now();
    workflowTiming = await fetchWorkflowTiming(config.githubToken, context);
    actionPhases.fetchWorkflowTiming = Math.round(performance.now() - timingStart);
    if (workflowTiming?.summary.workflowDurationMs !== undefined) {
      core.info(`Workflow duration: ${workflowTiming.summary.workflowDurationMs}ms`);
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
    diagnostics,
    workflowTiming: workflowTiming
      ? {
          ...workflowTiming,
          summary: {
            ...workflowTiming.summary,
            actionPhases: { ...actionPhases },
          },
        }
      : undefined,
  };

  ensureDir(config.siteOutput);
  const { owner, repo } = github.context.repo;

  await prepareSiteWorkspace(config.siteOutput, owner, repo);
  const integrateStart = performance.now();
  const { previousRun, baseBranchRun, previousCoverageRun, baseBranchCoverageRun, artifactDir, mergedRun } = integrateReportIntoSite(testRun, config, config.siteOutput);
  actionPhases.integrate = Math.round(performance.now() - integrateStart);

  if (mergedRun.workflowTiming) {
    mergedRun.workflowTiming = {
      ...mergedRun.workflowTiming,
      summary: {
        ...mergedRun.workflowTiming.summary,
        actionPhases: { ...actionPhases },
      },
    };
  }

  await saveSiteCache(config.siteOutput, owner, repo);

  if (config.history.enabled) {
    try {
      const publishStart = performance.now();
      await publishToHistoryRepository(mergedRun, config);
      actionPhases.publishHistory = Math.round(performance.now() - publishStart);
      if (mergedRun.workflowTiming) {
        mergedRun.workflowTiming.summary.actionPhases = { ...actionPhases };
      }
    } catch (error) {
      core.warning(`History repository publish failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (config.uploadHtmlReport) {
    try {
      const uploadStart = performance.now();
      const uploadResult = await uploadReportArtifact(
        artifactDir,
        config.artifactRetentionDays,
        context.commitShortSha,
        context.workflowUrl,
        {
          includeRawTestResults: config.includeRawTestResults,
          matchedFiles: mergedRun.matchedFiles ?? matchedFiles,
          sourceFiles: mergedRun.sourceFiles,
        },
      );
      htmlArtifactUrl = uploadResult.htmlArtifactUrl;
      actionPhases.uploadArtifact = Math.round(performance.now() - uploadStart);
      if (mergedRun.workflowTiming) {
        mergedRun.workflowTiming.summary.actionPhases = { ...actionPhases };
      }
    } catch (error) {
      core.warning(`Artifact upload failed: ${error instanceof Error ? error.message : String(error)}`);
      core.info(`Report files are available locally at ${config.siteOutput}`);
    }
  }

  const links = buildReportLinks(context, { artifactUrl: htmlArtifactUrl });

  if (config.commentMode === 'update' && context.prNumber) {
    let historyRepositoryUrl: string | undefined;
    let historyRunUrl: string | undefined;
    if (config.history.enabled && config.history.repositoryName) {
      const base = await resolveHistoryPagesBaseUrl(config.history);
      if (base) {
        historyRepositoryUrl = buildHistoryRepositoryUrl(base, config.history.repositoryName);
        historyRunUrl = buildHistoryRunUrl(base, config.history.repositoryName, testRun.context, testRun.id);
      }
    }
    await upsertPrComment(
      config.githubToken,
      mergedRun,
      config,
      previousRun,
      baseBranchRun,
      historyRepositoryUrl,
      historyRunUrl,
      previousCoverageRun,
      baseBranchCoverageRun,
      htmlArtifactUrl,
    );
  }

  await writeJobSummary(mergedRun, config, previousRun, previousCoverageRun, baseBranchCoverageRun, htmlArtifactUrl);

  if (config.publishChecks) {
    await publishCheckRun(config.githubToken, mergedRun, config, htmlArtifactUrl);
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
