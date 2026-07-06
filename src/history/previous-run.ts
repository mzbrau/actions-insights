import * as fs from 'fs';
import * as path from 'path';
import { CODE_TO_OUTCOME } from '../model/manifest';
import type { TestOutcome } from '../model/test-case';

export interface PreviousRun {
  commitSha: string;
  commitShortSha: string;
  outcomes: Map<string, TestOutcome>;
}

export function readPreviousRun(siteLatestDir: string): PreviousRun | undefined {
  const testsPath = path.join(siteLatestDir, 'tests.json');
  const manifestPath = path.join(siteLatestDir, 'manifest.json');

  if (!fs.existsSync(testsPath) || !fs.existsSync(manifestPath)) {
    return undefined;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      commitSha?: string;
      commitShortSha?: string;
    };
    const testsData = JSON.parse(fs.readFileSync(testsPath, 'utf8')) as {
      tests?: Array<{ n: string; o: number }>;
    };

    if (!manifest.commitSha) return undefined;

    const outcomes = new Map<string, TestOutcome>();
    for (const test of testsData.tests ?? []) {
      outcomes.set(test.n, CODE_TO_OUTCOME[test.o] ?? 'inconclusive');
    }

    return {
      commitSha: manifest.commitSha,
      commitShortSha: manifest.commitShortSha ?? manifest.commitSha.slice(0, 7),
      outcomes,
    };
  } catch {
    return undefined;
  }
}
