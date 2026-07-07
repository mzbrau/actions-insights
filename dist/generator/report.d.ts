import type { ThemeMode } from '../config';
import type { TrendsFile } from '../model/manifest';
import type { TestRun } from '../model/test-run';
declare function toCompactTests(run: TestRun, slowThresholdMs: number): {
    i: number;
    n: string;
    o: number;
    d: number;
    a: string | undefined;
    ns: string | undefined;
    c: string | undefined;
    m: string;
    sf: string;
    nf: boolean | undefined;
}[];
export declare function writeRunReport(run: TestRun, outputDir: string, config: {
    reportTitle: string;
    theme: ThemeMode;
    slowTestThresholdMs: number;
}, trends: TrendsFile): void;
export declare function renderReportHtml(run: TestRun, reportTitle: string, theme: ThemeMode, slowThresholdMs: number): string;
export { toCompactTests };
//# sourceMappingURL=report.d.ts.map