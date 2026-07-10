import type { CoverageReport } from '../model/coverage';
export interface CoverageValidationIssue {
    level: 'warning' | 'error';
    message: string;
}
export declare function validateCoverageReport(report: CoverageReport): CoverageValidationIssue[];
export declare function applyValidationWarnings(report: CoverageReport, issues: CoverageValidationIssue[]): CoverageReport;
//# sourceMappingURL=validate.d.ts.map