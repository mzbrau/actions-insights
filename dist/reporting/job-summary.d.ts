import type { ActionConfig } from '../config';
import type { ReportingContext } from './context';
import { type ReportLinks } from './links';
export interface RenderJobSummaryOptions {
    /** Include hierarchical all-tests tables. Defaults to true. */
    includeAllTestsTables?: boolean;
    /** Truncate the final markdown to this length, appending a link to the full report. */
    maxLength?: number;
}
export declare function renderJobSummary(ctx: ReportingContext, config: ActionConfig, links: ReportLinks, options?: RenderJobSummaryOptions): string;
//# sourceMappingURL=job-summary.d.ts.map