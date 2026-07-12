import type { RunContext } from '../model/test-run';
import type { TestCase } from '../model/test-case';
export interface ReportLinks {
    workflowRun: string;
    artifacts: string;
    commit: string;
    repository: string;
    pullRequest?: string;
    historyRepository?: string;
    historyRun?: string;
}
export declare function buildReportLinks(context: RunContext): ReportLinks;
export declare function buildTestCodeUrl(context: RunContext, test: TestCase): string | undefined;
export declare function formatTestNameWithLinks(context: RunContext, links: ReportLinks, shortName: string, test: TestCase): string;
/** Job summary: link test name directly to code search (user is already on the workflow page). */
export declare function formatTestNameWithCodeLink(context: RunContext, shortName: string, test: TestCase): string;
/** Job summary tables: link without backticks and escape pipes in link text. */
export declare function formatTestNameWithCodeLinkForTable(context: RunContext, shortName: string, test: TestCase): string;
export declare function formatHistoryDetailsLink(url: string): string;
export declare function formatFooterLinks(links: ReportLinks): string;
//# sourceMappingURL=links.d.ts.map