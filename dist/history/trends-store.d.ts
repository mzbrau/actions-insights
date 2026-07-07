import type { CanonicalHistory, CanonicalRunEntry, RunManifestEntry, TrendsFile } from '../model/manifest';
import type { TestRun } from '../model/test-run';
import { type RetentionOptions } from './retention';
import type { PreviousRun } from './previous-run';
export declare const MAIN_BRANCH_KEY = "main";
export declare function historyDir(siteDir: string, reportsSubdirectory: string): string;
export declare function readCanonicalHistory(siteDir: string, reportsSubdirectory: string): CanonicalHistory;
export declare function writeCanonicalHistory(siteDir: string, reportsSubdirectory: string, history: CanonicalHistory): void;
export declare function createRunEntry(run: TestRun, branchKey: string, branchLabel: string, branchType: CanonicalRunEntry['branchType']): CanonicalRunEntry;
export declare function appendRunToHistory(history: CanonicalHistory, run: TestRun, branchKey: string, branchLabel: string, branchType: CanonicalRunEntry['branchType']): CanonicalHistory;
export declare function pruneHistory(history: CanonicalHistory, options: RetentionOptions): CanonicalHistory;
export declare function branchRuns(history: CanonicalHistory, branchKey: string): RunManifestEntry[];
export declare function composeTrendsFile(history: CanonicalHistory, run: TestRun, branchKey: string, branchLabel: string): TrendsFile;
export declare function readLatestRunFromCanonical(history: CanonicalHistory, branchKey: string): PreviousRun | undefined;
export declare function readPreviousRunFromCanonical(history: CanonicalHistory, branchKey: string, currentRunId: string): PreviousRun | undefined;
export declare function readPreviousFailedFromCanonical(history: CanonicalHistory, branchKey: string, currentRunId: string): string[] | undefined;
//# sourceMappingURL=trends-store.d.ts.map