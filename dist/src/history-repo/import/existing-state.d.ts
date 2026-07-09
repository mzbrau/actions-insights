import type { ExistingHistoryState } from '../publisher/build-update';
import type { PublishRunContext } from '../publisher/paths';
export declare function readExistingState(workDir: string, dataPath: string, repositoryName: string, context: Pick<PublishRunContext, 'branch' | 'ref' | 'tag' | 'prNumber' | 'baseBranch' | 'runId'>, branchKey: string): ExistingHistoryState;
export declare function readBaselineImportState(workDir: string, dataPath: string, repositoryName: string): Pick<ExistingHistoryState, 'repositoriesIndex' | 'repoConfig' | 'metadata' | 'branchesIndex' | 'repositoryTests'>;
export declare function isRunImported(workDir: string, dataPath: string, repositoryName: string, workflowRunId: number): boolean;
//# sourceMappingURL=existing-state.d.ts.map