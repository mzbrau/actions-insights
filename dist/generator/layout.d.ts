import type { ThemeMode } from '../config';
import type { TestRun } from '../model/test-run';
export interface LayoutOptions {
    title: string;
    reportTitle: string;
    activeNav: 'summary' | 'all-tests' | 'history';
    run: TestRun;
    theme: ThemeMode;
    basePath?: string;
    failedCount?: number;
}
export declare function renderLayout(options: LayoutOptions, body: string): string;
//# sourceMappingURL=layout.d.ts.map