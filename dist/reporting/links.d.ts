import type { RunContext } from '../model/test-run';
import type { TestCase } from '../model/test-case';
export interface ReportLinks {
    workflowRun: string;
    artifacts: string;
    commit: string;
    repository: string;
    pullRequest?: string;
}
export declare function buildReportLinks(context: RunContext): ReportLinks;
export declare function buildTestCodeUrl(context: RunContext, test: TestCase): string | undefined;
export declare function formatTestNameWithLinks(context: RunContext, links: ReportLinks, shortName: string, test: TestCase): string;
export declare function formatFooterLinks(links: ReportLinks): string;
//# sourceMappingURL=links.d.ts.map