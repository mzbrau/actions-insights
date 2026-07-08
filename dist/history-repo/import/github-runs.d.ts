import type { GitHubWorkflowRun } from './workflow-context';
export interface ListWorkflowRunsOptions {
    token: string;
    repository: string;
    workflow?: string;
    branch?: string;
    since?: string;
    limit: number;
}
export interface ListWorkflowRunsResult {
    runs: GitHubWorkflowRun[];
    workflows: Map<number, string>;
}
export declare function listWorkflowRuns(options: ListWorkflowRunsOptions): Promise<ListWorkflowRunsResult>;
export declare function resolveWorkflowName(run: GitHubWorkflowRun, workflows: Map<number, string>): string;
export declare function listWorkflowRunArtifacts(token: string, repository: string, runId: number): Promise<Array<{
    id: number;
    name: string;
    size_in_bytes: number;
}>>;
//# sourceMappingURL=github-runs.d.ts.map