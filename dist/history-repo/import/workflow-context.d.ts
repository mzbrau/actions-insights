import type { PublishRunContext } from '../publisher/paths';
export interface GitHubWorkflowRun {
    id: number;
    name?: string | null;
    head_branch?: string | null;
    head_sha: string;
    event: string;
    status: string;
    conclusion: string | null;
    created_at: string;
    updated_at: string;
    run_attempt?: number;
    path?: string;
    workflow_id?: number;
    display_title?: string;
    pull_requests?: Array<{
        number: number;
        base?: {
            ref?: string;
        };
        head?: {
            ref?: string;
        };
    }>;
    head_commit?: {
        message?: string;
        author?: {
            name?: string;
            email?: string;
        };
    };
}
export declare function workflowRunToContext(repository: string, run: GitHubWorkflowRun, workflowName?: string): PublishRunContext;
//# sourceMappingURL=workflow-context.d.ts.map