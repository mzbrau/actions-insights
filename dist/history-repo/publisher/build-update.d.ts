import type { BranchHistory, BranchLatest, BranchesIndex, HistoryRepoConfig, RepositoriesIndex, RepositoryMetadata, RepositoryTestsFile } from '../models';
import { type HistoryPaths, type PublishTestRun } from './paths';
export interface ExistingHistoryState {
    repositoriesIndex?: RepositoriesIndex;
    repoConfig?: HistoryRepoConfig;
    metadata?: RepositoryMetadata;
    branchesIndex?: BranchesIndex;
    branchHistory?: BranchHistory;
    branchLatest?: BranchLatest;
    repositoryTests?: RepositoryTestsFile;
}
export interface HistoryFileWrite {
    path: string;
    content: unknown;
}
export interface HistoryUpdateResult {
    repositoryKey: string;
    branchKey: string;
    runId: string;
    runFileName: string;
    paths: HistoryPaths;
    files: HistoryFileWrite[];
    commitPaths: string[];
}
export interface BuildHistoryUpdateOptions {
    dataPath: string;
    repositoryName: string;
    defaultRepository?: string;
    historyLimit: number;
    retainDays: number;
    existing: ExistingHistoryState;
}
export declare function buildHistoryUpdate(run: PublishTestRun, options: BuildHistoryUpdateOptions): HistoryUpdateResult;
export declare function createEmptyRepositoriesIndex(): RepositoriesIndex;
//# sourceMappingURL=build-update.d.ts.map