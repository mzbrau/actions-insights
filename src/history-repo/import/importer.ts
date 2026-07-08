import { execFileSync } from 'child_process';
import * as fs from 'fs';
import { applyNewFailureFlags } from '../../history/integrate';
import { computeStats, deriveStatus } from '../../model/test-run';
import type { TestRun } from '../../model/test-run';
import { parseTestFiles } from '../../parsers/registry';
import { buildHistoryUpdate, resolveBranchKey, type ExistingHistoryState } from '../publisher';
import type { PublishTestRun } from '../publisher/paths';
import {
  cleanupArtifactDir,
  findParseableArtifact,
  type ArtifactDownloadOptions,
} from './artifacts';
import { mergeUpdateIntoExisting, writeHistoryUpdate } from './apply-update';
import { isRunImported, readBaselineImportState, readExistingState } from './existing-state';
import { listWorkflowRuns, resolveWorkflowName } from './github-runs';
import { workflowRunToContext, type GitHubWorkflowRun } from './workflow-context';

export interface ImportHistoryOptions {
  token: string;
  sourceRepo: string;
  repoPath: string;
  dataPath: string;
  artifactNames: string[];
  artifactPatterns: string[];
  testResultsGlob: string;
  workflow?: string;
  branch?: string;
  since?: string;
  limit: number;
  historyLimit: number;
  retainDays: number;
  dryRun: boolean;
}

export interface ImportSkipReason {
  runId: number;
  reason: string;
}

export interface ImportHistoryResult {
  imported: number;
  skipped: number;
  skippedDetails: ImportSkipReason[];
  candidateCount: number;
  dryRun: boolean;
}

interface PreparedRun {
  workflowRun: GitHubWorkflowRun;
  branchKey: string;
  completedAt: string;
}

export async function importHistory(options: ImportHistoryOptions): Promise<ImportHistoryResult> {
  const { runs, workflows } = await listWorkflowRuns({
    token: options.token,
    repository: options.sourceRepo,
    workflow: options.workflow,
    branch: options.branch,
    since: options.since,
    limit: options.limit,
  });

  const skippedDetails: ImportSkipReason[] = [];
  const prepared: PreparedRun[] = [];

  for (const run of runs) {
    if (run.status !== 'completed') {
      skippedDetails.push({ runId: run.id, reason: 'run not completed' });
      continue;
    }

    if (isRunImported(options.repoPath, options.dataPath, options.sourceRepo, run.id)) {
      skippedDetails.push({ runId: run.id, reason: 'already imported' });
      continue;
    }

    const context = workflowRunToContext(
      options.sourceRepo,
      run,
      resolveWorkflowName(run, workflows),
    );
    const { branchKey } = resolveBranchKey(context);
    prepared.push({ workflowRun: run, branchKey, completedAt: context.completedAt });
  }

  prepared.sort((a, b) => {
    const branchCompare = a.branchKey.localeCompare(b.branchKey);
    if (branchCompare !== 0) return branchCompare;
    return Date.parse(a.completedAt) - Date.parse(b.completedAt);
  });

  if (options.dryRun) {
    return {
      imported: prepared.length,
      skipped: skippedDetails.length,
      skippedDetails,
      candidateCount: runs.length,
      dryRun: true,
    };
  }

  const baseline = readBaselineImportState(options.repoPath, options.dataPath, options.sourceRepo);
  let globalState: ExistingHistoryState = { ...baseline };
  const previousFailedByBranch = new Map<string, string[]>();
  let imported = 0;

  for (const item of prepared) {
    const run = item.workflowRun;
    const context = workflowRunToContext(
      options.sourceRepo,
      run,
      resolveWorkflowName(run, workflows),
    );
    const { branchKey } = resolveBranchKey(context);

    const branchExisting = readExistingState(
      options.repoPath,
      options.dataPath,
      options.sourceRepo,
      context,
      branchKey,
    );
    const existing: ExistingHistoryState = {
      ...globalState,
      branchHistory: branchExisting.branchHistory,
      branchLatest: branchExisting.branchLatest,
    };

    const artifactOptions: ArtifactDownloadOptions = {
      repository: options.sourceRepo,
      runId: run.id,
      artifactNames: options.artifactNames,
      artifactPatterns: options.artifactPatterns,
      testResultsGlob: options.testResultsGlob,
      token: options.token,
    };

    const artifact = await findParseableArtifact(artifactOptions);
    if (!artifact) {
      skippedDetails.push({ runId: run.id, reason: 'no parseable test-result artifact' });
      continue;
    }

    try {
      const { tests, sourceFiles } = await parseTestFiles(
        options.testResultsGlob,
        artifact.downloadDir,
      );
      if (tests.length === 0) {
        skippedDetails.push({ runId: run.id, reason: 'artifact contained no tests' });
        continue;
      }

      const stats = computeStats(tests);
      const status = deriveStatus(tests);
      const testRun: TestRun = {
        id: String(context.runId),
        title: 'Actions Insights',
        status,
        stats,
        tests,
        context: {
          ...context,
          runAttempt: run.run_attempt ?? 1,
        },
        sourceFiles,
        reportPath: '',
      };

      const previousFailed = previousFailedByBranch.get(branchKey);
      applyNewFailureFlags(testRun, previousFailed);

      const publishRun = testRun as PublishTestRun;
      const update = buildHistoryUpdate(publishRun, {
        dataPath: options.dataPath,
        repositoryName: options.sourceRepo,
        historyLimit: options.historyLimit,
        retainDays: options.retainDays,
        existing,
      });

      writeHistoryUpdate(options.repoPath, update);
      globalState = mergeUpdateIntoExisting(globalState, update);
      previousFailedByBranch.set(
        branchKey,
        testRun.tests.filter((t) => t.outcome === 'failed').map((t) => t.fullName),
      );
      imported += 1;
      console.log(`Imported run ${run.id} (${context.branch}) from artifact ${artifact.artifactName}`);
    } finally {
      cleanupArtifactDir(artifact.downloadDir);
    }
  }

  return {
    imported,
    skipped: skippedDetails.length,
    skippedDetails,
    candidateCount: runs.length,
    dryRun: false,
  };
}

export function resolveGitHubToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error('GitHub token required. Set GITHUB_TOKEN or authenticate with gh auth login.');
  }
}
