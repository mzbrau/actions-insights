import type { HistoryConfig } from '../config';
import type { RunContext } from '../model/test-run';
export declare function normalizePagesBaseUrl(url: string): string;
export declare function resolveHistoryPagesBaseUrl(history: HistoryConfig): Promise<string | undefined>;
export declare function buildHistoryRepositoryUrl(baseUrl: string, repositoryName: string): string;
export declare function buildHistoryRunUrl(baseUrl: string, repositoryName: string, context: RunContext, runId: string): string;
//# sourceMappingURL=dashboard-url.d.ts.map