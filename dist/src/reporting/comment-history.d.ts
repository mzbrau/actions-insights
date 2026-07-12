export interface CommentResultSnapshot {
    completedAt: string;
    passed: number;
    failed: number;
    skipped: number;
}
export declare const COMMENT_STATE_MARKER = "<!-- actions-insights-state:";
export declare const PREVIOUS_RESULTS_MARKER = "<!-- actions-insights-previous-results:";
export declare function parseCommentState(body: string): CommentResultSnapshot | undefined;
export declare function parsePreviousResults(body: string): CommentResultSnapshot[];
export declare function archiveCommentResults(body: string): CommentResultSnapshot[];
export declare function formatPreviousResultsSection(results: CommentResultSnapshot[]): string[];
export declare function buildCommentHistoryMarkers(state: CommentResultSnapshot, previousResults: CommentResultSnapshot[]): string[];
//# sourceMappingURL=comment-history.d.ts.map