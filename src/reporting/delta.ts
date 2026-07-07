import type { TestCase, TestOutcome } from '../model/test-case';
import type { PreviousRun } from '../history/previous-run';
import { getQualifiedClassName, getShortTestName } from './grouping';

export interface TestDelta {
  previousCommit?: { sha: string; shortSha: string };
  newFailures: TestCase[];
  fixedTests: TestCase[];
}

function formatDeltaTestName(test: TestCase): string {
  const className = getQualifiedClassName(test);
  const shortName = getShortTestName(test);
  const classShort = className.includes('.')
    ? className.slice(className.lastIndexOf('.') + 1)
    : className;
  return `${classShort}.${shortName}`;
}

export function computeTestDelta(
  current: TestCase[],
  previousRun: PreviousRun | undefined,
  currentCommitSha: string,
): TestDelta {
  const empty: TestDelta = { newFailures: [], fixedTests: [] };

  if (!previousRun || previousRun.commitSha === currentCommitSha) {
    return empty;
  }

  const newFailures: TestCase[] = [];
  const fixedTests: TestCase[] = [];

  for (const test of current) {
    const previousOutcome = previousRun.outcomes.get(test.fullName);
    if (!previousOutcome) continue;

    if (test.outcome === 'failed' && previousOutcome !== 'failed') {
      newFailures.push(test);
    } else if (test.outcome === 'passed' && previousOutcome === 'failed') {
      fixedTests.push(test);
    }
  }

  newFailures.sort((a, b) => a.fullName.localeCompare(b.fullName));
  fixedTests.sort((a, b) => a.fullName.localeCompare(b.fullName));

  return {
    previousCommit: {
      sha: previousRun.commitSha,
      shortSha: previousRun.commitShortSha,
    },
    newFailures,
    fixedTests,
  };
}

function previousOutcomeLabel(outcome: TestOutcome | undefined): string {
  if (outcome === 'passed') return 'passing';
  if (outcome === 'skipped') return 'skipped';
  if (outcome === 'failed') return 'failing';
  return 'unknown';
}

export function formatDeltaSection(
  delta: TestDelta,
  previousRun: PreviousRun | undefined,
  repositoryUrl: string,
): string | undefined {
  if (!delta.previousCommit || (delta.newFailures.length === 0 && delta.fixedTests.length === 0)) {
    return undefined;
  }

  const commitUrl = `${repositoryUrl}/commit/${delta.previousCommit.sha}`;
  const lines: string[] = [
    `## Changes since [${delta.previousCommit.shortSha}](${commitUrl})`,
    '',
  ];

  if (delta.newFailures.length > 0) {
    lines.push(`**New failures (${delta.newFailures.length.toLocaleString()})**`);
    for (const test of delta.newFailures) {
      const prev = previousRun?.outcomes.get(test.fullName);
      lines.push(`- \`${formatDeltaTestName(test)}\` (was ${previousOutcomeLabel(prev)})`);
    }
    lines.push('');
  }

  if (delta.fixedTests.length > 0) {
    lines.push(`**Fixed (${delta.fixedTests.length.toLocaleString()})**`);
    for (const test of delta.fixedTests) {
      lines.push(`- \`${formatDeltaTestName(test)}\` (was failing)`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
