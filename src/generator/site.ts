import * as fs from 'fs';
import * as path from 'path';
import type { ActionConfig } from '../config';
import type { BranchManifest, RunManifestEntry, SiteManifest } from '../model/manifest';
import type { TestRun } from '../model/test-run';
import { renderAllTestsPage, toCompactTests } from './pages/all-tests';
import { renderBranchHistoryPage, renderSiteIndex } from './pages/history';
import { renderSummaryPage } from './pages/summary';

const ASSET_FILES = ['tokens.css', 'report.css', 'report.js'] as const;

function resolveAssetsDir(): string {
  const candidates = [
    path.join(__dirname, 'assets'),
    path.join(__dirname, '..', 'src', 'generator', 'assets'),
    path.join(process.cwd(), 'dist', 'assets'),
    path.join(process.cwd(), 'src', 'generator', 'assets'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'tokens.css'))) {
      return candidate;
    }
  }
  throw new Error('Could not locate generator assets directory');
}

export interface GeneratedRunReport {
  outputDir: string;
  manifest: RunManifestEntry;
  failedTestNames: string[];
}

export function writeRunReport(
  run: TestRun,
  outputDir: string,
  config: ActionConfig,
  runPath: string,
): GeneratedRunReport {
  fs.mkdirSync(outputDir, { recursive: true });
  const assetsDir = path.join(outputDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  const sourceAssets = resolveAssetsDir();

  for (const file of ASSET_FILES) {
    fs.copyFileSync(path.join(sourceAssets, file), path.join(assetsDir, file));
  }

  fs.writeFileSync(path.join(outputDir, 'index.html'), renderSummaryPage(run, config.reportTitle, config.theme));
  fs.writeFileSync(
    path.join(outputDir, 'all-tests.html'),
    renderAllTestsPage(run, config.reportTitle, config.theme, config.slowTestThresholdMs),
  );

  const compact = toCompactTests(run, config.slowTestThresholdMs);
  fs.writeFileSync(path.join(outputDir, 'tests.json'), JSON.stringify({ tests: compact, slowThreshold: config.slowTestThresholdMs }));

  const failedTestNames = run.tests.filter((t) => t.outcome === 'failed').map((t) => t.fullName);
  const manifest: RunManifestEntry = {
    runId: String(run.context.runId),
    workflowRunId: run.context.runId,
    status: run.status,
    date: run.context.completedAt,
    durationMs: run.stats.durationMs,
    total: run.stats.total,
    passed: run.stats.passed,
    failed: run.stats.failed,
    skipped: run.stats.skipped,
    commitSha: run.context.commitSha,
    commitShortSha: run.context.commitShortSha,
    commitMessage: run.context.commitMessage,
    author: run.context.author,
    path: runPath.endsWith('/') ? runPath : `${runPath}/`,
    isLatest: true,
  };

  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify({ ...manifest, failedTests: failedTestNames }, null, 2),
  );

  fs.writeFileSync(
    path.join(outputDir, 'summary.json'),
    JSON.stringify({
      status: run.status,
      stats: run.stats,
      context: run.context,
      failedTests: failedTestNames,
    }, null, 2),
  );

  return { outputDir, manifest, failedTestNames };
}

export function writeBranchHistoryPage(
  siteDir: string,
  branchDir: string,
  run: TestRun,
  config: ActionConfig,
  branchManifest: BranchManifest,
  trend: import('../model/manifest').TrendData,
): void {
  const branchPath = path.join(siteDir, branchDir);
  fs.mkdirSync(branchPath, { recursive: true });
  const assetsDir = path.join(branchPath, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    const sourceAssets = resolveAssetsDir();
    for (const file of ASSET_FILES) {
      fs.copyFileSync(path.join(sourceAssets, file), path.join(assetsDir, file));
    }
  }
  fs.writeFileSync(
    path.join(branchPath, 'index.html'),
    renderBranchHistoryPage(run, config.reportTitle, config.theme, branchManifest, trend),
  );
}

export function writeSiteIndex(
  siteDir: string,
  reportsSubdirectory: string,
  manifest: SiteManifest,
  config: ActionConfig,
): void {
  const root = path.join(siteDir, reportsSubdirectory);
  fs.mkdirSync(root, { recursive: true });
  const assetsDir = path.join(root, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  const sourceAssets = resolveAssetsDir();
  for (const file of ASSET_FILES) {
    fs.copyFileSync(path.join(sourceAssets, file), path.join(assetsDir, file));
  }
  fs.writeFileSync(
    path.join(root, 'index.html'),
    renderSiteIndex(config.reportTitle, manifest.repository, manifest.branches),
  );
  fs.writeFileSync(path.join(root, 'index.json'), JSON.stringify(manifest, null, 2));
}
