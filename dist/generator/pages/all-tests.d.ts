import type { ThemeMode } from '../../config';
import type { CompactTestRecord } from '../../model/manifest';
import type { TestRun } from '../../model/test-run';
export declare function toCompactTests(run: TestRun, slowThresholdMs: number): CompactTestRecord[];
export declare function renderAllTestsPage(run: TestRun, reportTitle: string, theme: ThemeMode, slowThresholdMs: number): string;
//# sourceMappingURL=all-tests.d.ts.map