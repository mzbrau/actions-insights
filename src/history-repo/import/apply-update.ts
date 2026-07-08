import * as path from 'path';
import type { BranchHistory, BranchLatest, BranchesIndex, RepositoryMetadata, RepositoryTestsFile } from '../models';
import type { ExistingHistoryState, HistoryFileWrite, HistoryUpdateResult } from '../publisher/build-update';
import type { RepositoriesIndex } from '../models';
import { writeJsonFile } from '../../publisher/site-merger';

export function writeHistoryUpdate(
  workDir: string,
  update: HistoryUpdateResult,
): void {
  for (const file of update.files) {
    const absolute = path.isAbsolute(file.path) ? file.path : path.join(workDir, file.path);
    writeJsonFile(absolute, file.content);
  }
}

export function mergeUpdateIntoExisting(
  existing: ExistingHistoryState,
  update: HistoryUpdateResult,
): ExistingHistoryState {
  const next: ExistingHistoryState = { ...existing };

  for (const file of update.files) {
    const normalized = file.path.replace(/\\/g, '/');
    const content = file.content;

    if (normalized.endsWith('/repositories.json')) {
      next.repositoriesIndex = content as RepositoriesIndex;
      continue;
    }
    if (normalized.endsWith('/metadata.json')) {
      next.metadata = content as RepositoryMetadata;
      continue;
    }
    if (normalized.endsWith('/branches.json')) {
      next.branchesIndex = content as BranchesIndex;
      continue;
    }
    if (normalized.endsWith('/tests.json')) {
      next.repositoryTests = content as RepositoryTestsFile;
      continue;
    }
    if (normalized.endsWith('/history.json')) {
      next.branchHistory = content as BranchHistory;
      continue;
    }
    if (normalized.endsWith('/latest.json')) {
      next.branchLatest = content as BranchLatest;
    }
  }

  return next;
}

export function collectCommitPaths(workDir: string, files: HistoryFileWrite[]): string[] {
  return files.map((file) =>
    path.relative(workDir, path.isAbsolute(file.path) ? file.path : path.join(workDir, file.path)),
  );
}
