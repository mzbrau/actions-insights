import * as fs from 'fs';
import * as path from 'path';
import type { ActionConfig } from '../config';
import type { TestRun } from '../model/test-run';
import { writeRunReport } from '../generator/report';
import { mergePartialRun } from '../history/merge-run';
import { resolveReportPaths } from '../history/paths';
import type { PreviousRun } from '../history/previous-run';
import { detectNewFailures } from '../history/trends';
import {
  appendRunToHistory,
  composeTrendsFile,
  pruneHistory,
  readCanonicalHistory,
  readPreviousFailedFromCanonical,
  readPreviousRunFromCanonical,
  writeCanonicalHistory,
} from '../history/trends-store';
import { ensureDir } from '../publisher/site-merger';

export function applyNewFailureFlags(run: TestRun, previousFailed: string[] | undefined): void {
  const newFailures = detectNewFailures(
    run.tests.filter((t) => t.outcome === 'failed').map((t) => t.fullName),
    previousFailed,
  );
  for (const test of run.tests) {
    if (newFailures.has(test.fullName)) {
      test.isNewFailure = true;
    }
  }
}

export function integrateReportIntoSite(
  run: TestRun,
  config: ActionConfig,
  siteDir: string,
): { relativeReportPath: string; previousRun?: PreviousRun; artifactDir: string } {
  const paths = resolveReportPaths(run.context, config.reportsSubdirectory);
  const partialPath = path.join(siteDir, paths.partialRunPath);
  const artifactDir = path.join(siteDir, paths.artifactDir);
  const branchCacheDir = path.join(siteDir, paths.branchDir);

  let history = readCanonicalHistory(siteDir, config.reportsSubdirectory);
  const currentRunId = String(run.context.runId);

  const previousRun = readPreviousRunFromCanonical(history, paths.branchKey, currentRunId);
  const previousFailed = readPreviousFailedFromCanonical(history, paths.branchKey, currentRunId);

  let mergedRun = mergePartialRun(run, partialPath);
  applyNewFailureFlags(mergedRun, previousFailed);

  history = appendRunToHistory(
    history,
    mergedRun,
    paths.branchKey,
    paths.branchLabel,
    paths.branchType,
  );
  history = pruneHistory(history, {
    historyLimit: config.historyLimit,
    retainDays: config.retainDays,
  });
  writeCanonicalHistory(siteDir, config.reportsSubdirectory, history);

  const trends = composeTrendsFile(history, mergedRun, paths.branchKey, paths.branchLabel);

  if (fs.existsSync(config.reportOutput)) {
    fs.rmSync(config.reportOutput, { recursive: true, force: true });
  }
  writeRunReport(mergedRun, config.reportOutput, config, trends);

  ensureDir(artifactDir);
  ensureDir(branchCacheDir);
  fs.copyFileSync(path.join(config.reportOutput, 'report.html'), path.join(artifactDir, 'report.html'));
  fs.copyFileSync(path.join(config.reportOutput, 'trends.json'), path.join(artifactDir, 'trends.json'));
  fs.copyFileSync(path.join(config.reportOutput, 'report.html'), path.join(branchCacheDir, 'report.html'));

  return { relativeReportPath: paths.relativeReportUrl, previousRun, artifactDir };
}
