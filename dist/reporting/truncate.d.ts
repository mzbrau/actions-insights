export declare function escapeMarkdown(text: string): string;
export declare function truncateLines(text: string | undefined, maxLines: number): {
    text: string;
    truncated: boolean;
    totalLines: number;
};
export declare function truncateText(text: string | undefined, maxChars: number): {
    text: string;
    truncated: boolean;
};
export declare function fenceCode(text: string): string;
//# sourceMappingURL=truncate.d.ts.map