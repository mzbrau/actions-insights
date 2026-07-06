import * as fs from 'fs';
import * as path from 'path';
import type { ActionConfig } from '../config';
import type { BranchManifest, RunManifestEntry, SiteManifest } from '../model/manifest';
import type { TestRun } from '../model/test-run';
import { resolveReportPaths } from '../history/paths';
import { pruneRunDirectories, pruneRuns, syncLatestDirectory } from '../history/retention';
import { buildTrendData, detectNewFailures, readPreviousFailedTests } from '../history/trends';
import { readPreviousRun, type PreviousRun } from '../history/previous-run';
import { writeBranchHistoryPage, writeRunReport, writeSiteIndex } from '../generator/site';
import { copyDirSync, ensureDir, mergeDirectoryIntoSite, readJsonFile } from '../publisher/site-merger';

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

export function updateBranchManifest(
  existing: BranchManifest | undefined,
  entry: RunManifestEntry,
  branchKey: string,
  branchLabel: string,
  branchType: BranchManifest['type'],
  latestPath: string,
  options: { historyLimit: number; retainDays: number },
): BranchManifest {
  const runs = existing?.runs ?? [];
  const withoutCurrent = runs.filter((r) => r.runId !== entry.runId);
  const updated = pruneRuns([{ ...entry, isLatest: true }, ...withoutCurrent], {
    historyLimit: options.historyLimit,
    retainDays: options.retainDays,
  }).map((r) => ({ ...r, isLatest: r.runId === entry.runId }));

  return {
    key: branchKey,
    label: branchLabel,
    type: branchType,
    runs: updated,
    latestPath,
  };
}

export function integrateReportIntoSite(
  run: TestRun,
  config: ActionConfig,
  siteDir: string,
): { relativeReportPath: string; siteManifest: SiteManifest; previousRun?: PreviousRun } {
  const paths = resolveReportPaths(run.context, config.reportsSubdirectory);
  const runOutputDir = path.join(config.reportOutput);
  const siteBranchDir = path.join(siteDir, paths.branchDir);
  const siteRunDir = path.join(siteDir, paths.runDir);
  const siteLatestDir = path.join(siteDir, paths.latestDir);

  const previousRun = readPreviousRun(siteLatestDir);
  const previousManifestPath = path.join(siteLatestDir, 'manifest.json');
  const previousFailed = readPreviousFailedTests(previousManifestPath);
  applyNewFailureFlags(run, previousFailed);

  if (fs.existsSync(runOutputDir)) {
    fs.rmSync(runOutputDir, { recursive: true, force: true });
  }

  const generated = writeRunReport(run, runOutputDir, config, `${paths.runDir}/`);
  copyDirSync(runOutputDir, siteRunDir);
  syncLatestDirectory(siteRunDir, siteLatestDir);

  const siteManifestPath = path.join(siteDir, config.reportsSubdirectory, 'index.json');
  const existingSite = readJsonFile<SiteManifest>(siteManifestPath);
  const existingBranch = existingSite?.branches.find((b) => b.key === paths.branchKey);

  const branchManifest = updateBranchManifest(
    existingBranch,
    generated.manifest,
    paths.branchKey,
    paths.branchLabel,
    paths.branchType,
    paths.latestDir,
    { historyLimit: config.historyLimit, retainDays: config.retainDays },
  );

  const retainedIds = new Set(branchManifest.runs.map((r) => r.runId));
  pruneRunDirectories(siteBranchDir, retainedIds);

  const branches = (existingSite?.branches ?? []).filter((b) => b.key !== paths.branchKey);
  branches.push(branchManifest);

  const siteManifest: SiteManifest = {
    updatedAt: new Date().toISOString(),
    repository: run.context.repository,
    branches: branches.sort((a, b) => a.label.localeCompare(b.label)),
  };

  const trend = buildTrendData(paths.branchKey, branchManifest.runs);
  writeBranchHistoryPage(siteDir, paths.branchDir, run, config, branchManifest, trend);

  ensureDir(path.join(siteDir, config.reportsSubdirectory));
  mergeDirectoryIntoSite(siteDir, runOutputDir, paths.latestDir);
  writeSiteIndex(siteDir, config.reportsSubdirectory, siteManifest, config);

  const trendsPath = path.join(siteDir, paths.branchDir, 'trends.json');
  fs.writeFileSync(trendsPath, JSON.stringify(trend, null, 2));

  return { relativeReportPath: paths.relativeReportUrl, siteManifest, previousRun };
}
