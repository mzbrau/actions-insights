import type { TestOutcome } from '../model/test-case';
import { CODE_TO_OUTCOME } from '../model/manifest';
import type { CanonicalHistory } from '../model/manifest';
import { readPreviousRunFromCanonical } from './trends-store';

export interface PreviousRun {
  commitSha: string;
  commitShortSha: string;
  outcomes: Map<string, TestOutcome>;
  durations: Map<string, number>;
  testNames: Set<string>;
}

export function readPreviousRunFromHistory(
  history: CanonicalHistory,
  branchKey: string,
  currentRunId: string,
): PreviousRun | undefined {
  return readPreviousRunFromCanonical(history, branchKey, currentRunId);
}

export { CODE_TO_OUTCOME };
