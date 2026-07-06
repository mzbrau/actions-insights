import type { RunContext } from '../model/test-run';
export interface ReportLinks {
    workflowRun: string;
    artifacts: string;
    commit: string;
    repository: string;
    pullRequest?: string;
}
export declare function buildReportLinks(context: RunContext): ReportLinks;
export declare function formatFooterLinks(links: ReportLinks): string;
//# sourceMappingURL=links.d.ts.map