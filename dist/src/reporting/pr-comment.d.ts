import type { ActionConfig } from '../config';
import type { ReportingContext } from './context';
import { type CommentResultSnapshot } from './comment-history';
import { type ReportLinks } from './links';
export declare const COMMENT_MARKER = "<!-- actions-insights-report -->";
export declare function renderPrComment(ctx: ReportingContext, config: ActionConfig, links: ReportLinks, previousResults?: CommentResultSnapshot[]): string;
//# sourceMappingURL=pr-comment.d.ts.map