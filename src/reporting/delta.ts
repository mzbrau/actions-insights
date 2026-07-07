import type { TestCase, TestOutcome } from '../model/test-case';
import type { PreviousRun } from '../history/previous-run';
import { formatDuration } from '../model/test-run';
import { getQualifiedClassName, getShortTestName } from './grouping';

export interface PerformanceRegression {
  test: TestCase;
  previousDurationMs: number;
  currentDurationMs: number;
}

export interface TestDelta {
  previousCommit?: { sha: string; shortSha: string };
  newFailures: TestCase[];
  fixedTests: TestCase[];
  performanceRegressions: PerformanceRegression[];
  newTests: TestCase[];
  removedTests: string[];
}

export interface TestDeltaOptions {
  slowdownRatio?: number;
  slowdownMinMs?: number;
}

function formatDeltaTestName(test: TestCase): string {
  const className = getQualifiedClassName(test);
  const shortName = getShortTestName(test);
  const classShort = className.includes('.')
    ? className.slice(className.lastIndexOf('.') + 1)
    : className;
  return `${classShort}.${shortName}`;
}

function isPerformanceRegression(
  current: TestCase,
  previousDurationMs: number,
  options: Required<TestDeltaOptions>,
): boolean {
  if (current.outcome === 'skipped') return false;
  const delta = current.durationMs - previousDurationMs;
  if (delta < options.slowdownMinMs) return false;
  if (previousDurationMs <= 0) return delta >= options.slowdownMinMs;
  return current.durationMs >= previousDurationMs * options.slowdownRatio;
}

export function computeTestDelta(
  current: TestCase[],
  previousRun: PreviousRun | undefined,
  currentCommitSha: string,
  options: TestDeltaOptions = {},
): TestDelta {
  const empty: TestDelta = {
    newFailures: [],
    fixedTests: [],
    performanceRegressions: [],
    newTests: [],
    removedTests: [],
  };

  if (!previousRun || previousRun.commitSha === currentCommitSha) {
    return empty;
  }

  const resolved: Required<TestDeltaOptions> = {
    slowdownRatio: options.slowdownRatio ?? 1.5,
    slowdownMinMs: options.slowdownMinMs ?? 100,
  };

  const newFailures: TestCase[] = [];
  const fixedTests: TestCase[] = [];
  const performanceRegressions: PerformanceRegression[] = [];
  const newTests: TestCase[] = [];
  const currentNames = new Set<string>();

  for (const test of current) {
    currentNames.add(test.fullName);
    const previousOutcome = previousRun.outcomes.get(test.fullName);

    if (!previousOutcome) {
      newTests.push(test);
      continue;
    }

    if (test.outcome === 'failed' && previousOutcome !== 'failed') {
      newFailures.push(test);
    } else if (test.outcome === 'passed' && previousOutcome === 'failed') {
      fixedTests.push(test);
    }

    const previousDurationMs = previousRun.durations.get(test.fullName);
    if (previousDurationMs !== undefined && isPerformanceRegression(test, previousDurationMs, resolved)) {
      performanceRegressions.push({
        test,
        previousDurationMs,
        currentDurationMs: test.durationMs,
      });
    }
  }

  const removedTests = [...previousRun.testNames]
    .filter((name) => !currentNames.has(name))
    .sort((a, b) => a.localeCompare(b));

  newFailures.sort((a, b) => a.fullName.localeCompare(b.fullName));
  fixedTests.sort((a, b) => a.fullName.localeCompare(b.fullName));
  performanceRegressions.sort(
    (a, b) => b.currentDurationMs - b.previousDurationMs - (a.currentDurationMs - a.previousDurationMs),
  );
  newTests.sort((a, b) => a.fullName.localeCompare(b.fullName));

  return {
    previousCommit: {
      sha: previousRun.commitSha,
      shortSha: previousRun.commitShortSha,
    },
    newFailures,
    fixedTests,
    performanceRegressions,
    newTests,
    removedTests,
  };
}

function previousOutcomeLabel(outcome: TestOutcome | undefined): string {
  if (outcome === 'passed') return 'passing';
  if (outcome === 'skipped') return 'skipped';
  if (outcome === 'failed') return 'failing';
  return 'unknown';
}

function formatRegressionLine(regression: PerformanceRegression): string {
  const { test, previousDurationMs, currentDurationMs } = regression;
  const ratio = previousDurationMs > 0
    ? (currentDurationMs / previousDurationMs).toFixed(1)
    : '∞';
  return `- \`${formatDeltaTestName(test)}\` · ${formatDuration(previousDurationMs)} → ${formatDuration(currentDurationMs)} (${ratio}× slower)`;
}

function formatRemovedTestName(fullName: string): string {
  const lastDot = fullName.lastIndexOf('.');
  return lastDot >= 0 ? fullName.slice(lastDot + 1) : fullName;
}

export function formatDeltaSection(
  delta: TestDelta,
  previousRun: PreviousRun | undefined,
  repositoryUrl: string,
): string | undefined {
  const hasChanges =
    delta.newFailures.length > 0
    || delta.fixedTests.length > 0
    || delta.performanceRegressions.length > 0
    || delta.newTests.length > 0
    || delta.removedTests.length > 0;

  if (!delta.previousCommit || !hasChanges) {
    return undefined;
  }

  const commitUrl = `${repositoryUrl}/commit/${delta.previousCommit.sha}`;
  const lines: string[] = [
    `## Changes since [${delta.previousCommit.shortSha}](${commitUrl})`,
    '',
  ];

  if (delta.newFailures.length > 0) {
    lines.push(`**🆕 New failures (${delta.newFailures.length.toLocaleString()})**`);
    for (const test of delta.newFailures) {
      const prev = previousRun?.outcomes.get(test.fullName);
      lines.push(`- \`${formatDeltaTestName(test)}\` (was ${previousOutcomeLabel(prev)})`);
    }
    lines.push('');
  }

  if (delta.fixedTests.length > 0) {
    lines.push(`**✅ Fixed failures (${delta.fixedTests.length.toLocaleString()})**`);
    for (const test of delta.fixedTests) {
      lines.push(`- \`${formatDeltaTestName(test)}\` (was failing)`);
    }
    lines.push('');
  }

  if (delta.performanceRegressions.length > 0) {
    lines.push(`**⏱️ Performance regressions (${delta.performanceRegressions.length.toLocaleString()})**`);
    for (const regression of delta.performanceRegressions) {
      lines.push(formatRegressionLine(regression));
    }
    lines.push('');
  }

  if (delta.newTests.length > 0) {
    lines.push(`**➕ New tests (${delta.newTests.length.toLocaleString()})**`);
    for (const test of delta.newTests) {
      lines.push(`- \`${formatDeltaTestName(test)}\``);
    }
    lines.push('');
  }

  if (delta.removedTests.length > 0) {
    lines.push(`**➖ Removed tests (${delta.removedTests.length.toLocaleString()})**`);
    for (const fullName of delta.removedTests) {
      lines.push(`- \`${formatRemovedTestName(fullName)}\``);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
