import * as fs from 'fs';
import * as path from 'path';
import type {
  BranchHistory,
  BranchLatest,
  BranchesIndex,
  HistoryRepoConfig,
  RepositoriesIndex,
  RepositoryMetadata,
  RepositoryTestsFile,
  RunRecord,
} from '../models';
import { resolveRepositoryKey } from '../publisher/paths';
import type { ExistingHistoryState } from '../publisher/build-update';
import type { PublishRunContext } from '../publisher/paths';
import { readJsonFile } from '../../publisher/site-merger';

export function readExistingState(
  workDir: string,
  dataPath: string,
  repositoryName: string,
  context: Pick<PublishRunContext, 'branch' | 'ref' | 'tag' | 'prNumber' | 'baseBranch' | 'runId'>,
  branchKey: string,
): ExistingHistoryState {
  const repositoryKey = resolveRepositoryKey(repositoryName);
  const dataRoot = path.join(workDir, dataPath);
  const repoDir = path.join(dataRoot, 'repositories', repositoryKey);
  const branchDir = path.join(repoDir, 'branches', branchKey);

  return {
    repositoriesIndex: readJsonFile<RepositoriesIndex>(path.join(dataRoot, 'repositories.json')),
    repoConfig: readJsonFile<HistoryRepoConfig>(path.join(workDir, 'config.json')),
    metadata: readJsonFile<RepositoryMetadata>(path.join(repoDir, 'metadata.json')),
    branchesIndex: readJsonFile<BranchesIndex>(path.join(repoDir, 'branches.json')),
    branchHistory: readJsonFile<BranchHistory>(path.join(branchDir, 'history.json')),
    branchLatest: readJsonFile<BranchLatest>(path.join(branchDir, 'latest.json')),
    repositoryTests: readJsonFile<RepositoryTestsFile>(path.join(repoDir, 'tests.json')),
  };
}

export function readBaselineImportState(
  workDir: string,
  dataPath: string,
  repositoryName: string,
): Pick<
  ExistingHistoryState,
  'repositoriesIndex' | 'repoConfig' | 'metadata' | 'branchesIndex' | 'repositoryTests'
> {
  const repositoryKey = resolveRepositoryKey(repositoryName);
  const dataRoot = path.join(workDir, dataPath);
  const repoDir = path.join(dataRoot, 'repositories', repositoryKey);

  return {
    repositoriesIndex: readJsonFile<RepositoriesIndex>(path.join(dataRoot, 'repositories.json')),
    repoConfig: readJsonFile<HistoryRepoConfig>(path.join(workDir, 'config.json')),
    metadata: readJsonFile<RepositoryMetadata>(path.join(repoDir, 'metadata.json')),
    branchesIndex: readJsonFile<BranchesIndex>(path.join(repoDir, 'branches.json')),
    repositoryTests: readJsonFile<RepositoryTestsFile>(path.join(repoDir, 'tests.json')),
  };
}

export function isRunImported(
  workDir: string,
  dataPath: string,
  repositoryName: string,
  workflowRunId: number,
): boolean {
  const repositoryKey = resolveRepositoryKey(repositoryName);
  const repoDir = path.join(workDir, dataPath, 'repositories', repositoryKey);
  if (!fs.existsSync(repoDir)) {
    return false;
  }

  const branchesDir = path.join(repoDir, 'branches');
  if (!fs.existsSync(branchesDir)) {
    return false;
  }

  for (const branchKey of fs.readdirSync(branchesDir)) {
    const branchDir = path.join(branchesDir, branchKey);
    if (!fs.statSync(branchDir).isDirectory()) continue;

    const history = readJsonFile<BranchHistory>(path.join(branchDir, 'history.json'));
    if (history?.runs.some((r) => r.workflowRunId === workflowRunId)) {
      return true;
    }

    const runsDir = path.join(branchDir, 'runs');
    if (!fs.existsSync(runsDir)) continue;

    for (const file of fs.readdirSync(runsDir)) {
      if (!file.endsWith('.json')) continue;
      const record = readJsonFile<RunRecord>(path.join(runsDir, file));
      if (record?.workflowRunId === workflowRunId) {
        return true;
      }
    }
  }

  return false;
}
