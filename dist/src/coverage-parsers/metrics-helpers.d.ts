import type { CoverageMetrics } from '../model/coverage';
export declare function metricsFromCounts(coveredLines?: number, totalLines?: number, coveredBranches?: number, totalBranches?: number, coveredMethods?: number, totalMethods?: number, coveredClasses?: number, totalClasses?: number, coveredFiles?: number, totalFiles?: number): CoverageMetrics;
export declare function parseRate(value: unknown): number | undefined;
export declare function asArray<T>(value: T | T[] | unknown | undefined): T[];
export declare function attrString(node: Record<string, unknown>, key: string): string | undefined;
export declare function attrNumber(node: Record<string, unknown>, key: string): number | undefined;
export declare function normalizePath(filePath: string): string;
//# sourceMappingURL=metrics-helpers.d.ts.map