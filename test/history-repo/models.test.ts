import { describe, expect, it } from 'vitest';
import {
  decodeRepositoryTestsFile,
  deriveQualifiedClassName,
  encodeRepositoryTestsFile,
  encodeRunFailures,
  encodeRunTests,
  expandRunFailures,
  expandRunTests,
  normalizeMethodName,
  normalizeRunRecord,
  normalizeTestsFile,
  repositoryKeyFromName,
  repositoryNameFromKey,
  resolveTestFullName,
} from '@actions-insights/history-models';

describe('history-models', () => {
  it('converts repository name to key and back', () => {
    expect(repositoryKeyFromName('my-org/my-project')).toBe('my-org.my-project');
    expect(repositoryNameFromKey('my-org/my-project')).toBe('my-org/my-project');
  });
});

describe('encoding', () => {
  it('normalizes method names that duplicate the full name', () => {
    const fullName =
      'Notey.Tests.DocumentStoreIndexTests.GetDynamicValueSuggestionsAsync_reads_folder_values_for_command';
    expect(normalizeMethodName(fullName, fullName)).toBe(
      'GetDynamicValueSuggestionsAsync_reads_folder_values_for_command',
    );
  });

  it('derives qualified class name from full name and parts', () => {
    const method = 'GetFolderCommandsAsync_maps_notes_folders_to_singular_commands';
    const fullName = `Notey.Tests.DocumentStoreIndexTests.${method}`;
    expect(
      deriveQualifiedClassName({
        fullName,
        namespace: 'Notey.Tests',
        className: 'DocumentStoreIndexTests',
        method,
      }),
    ).toBe('Notey.Tests.DocumentStoreIndexTests');
  });

  it('encodes and expands run tests with a class dictionary', () => {
    const methodA = 'GetDynamicValueSuggestionsAsync_reads_folder_values_for_command';
    const methodB = 'GetFolderCommandsAsync_maps_notes_folders_to_singular_commands';
    const className = 'Notey.Tests.DocumentStoreIndexTests';

    const encoded = encodeRunTests([
      {
        fullName: `${className}.${methodA}`,
        outcomeCode: 0,
        durationMs: 6,
        namespace: 'Notey.Tests',
        className: 'DocumentStoreIndexTests',
        method: methodA,
      },
      {
        fullName: `${className}.${methodB}`,
        outcomeCode: 0,
        durationMs: 2,
        namespace: 'Notey.Tests',
        className: 'DocumentStoreIndexTests',
        method: methodB,
      },
    ]);

    expect(encoded.classes).toEqual([className]);
    expect(encoded.tests).toEqual([
      { c: 0, m: methodA, o: 0, d: 6 },
      { c: 0, m: methodB, o: 0, d: 2 },
    ]);

    const expanded = expandRunTests({
      classes: encoded.classes,
      tests: encoded.tests,
    });
    expect(expanded[0].n).toBe(`${className}.${methodA}`);
    expect(expanded[0].ns).toBe('Notey.Tests');
    expect(expanded[0].c).toBe('DocumentStoreIndexTests');
    expect(expanded[0].m).toBe(methodA);
    expect(expanded[1].n).toBe(`${className}.${methodB}`);
    expect(expanded[1].m).toBe(methodB);
  });

  it('compresses flat full names when namespace, class, and method are available', () => {
    const method = 'AcquireLockAsync_ShouldHandleHighConcurrency';
    const qualifiedClass = 'Fig.Unit.Test.DistributedLockTests';

    const encoded = encodeRunTests([
      {
        fullName: method,
        outcomeCode: 0,
        durationMs: 127,
        namespace: 'Fig.Unit.Test',
        className: 'DistributedLockTests',
        method,
      },
      {
        fullName: method.replace('HighConcurrency', 'MultipleDisposeCalls'),
        outcomeCode: 0,
        durationMs: 50,
        namespace: 'Fig.Unit.Test',
        className: 'DistributedLockTests',
        method: method.replace('HighConcurrency', 'MultipleDisposeCalls'),
      },
    ]);

    expect(encoded.classes).toEqual([qualifiedClass]);
    expect(encoded.tests).toEqual([
      { c: 0, m: method, o: 0, d: 127 },
      {
        c: 0,
        m: method.replace('HighConcurrency', 'MultipleDisposeCalls'),
        o: 0,
        d: 50,
      },
    ]);
  });

  it('falls back to full name when class decomposition is unavailable', () => {
    const encoded = encodeRunTests([
      {
        fullName: 'plain-test-name',
        outcomeCode: 1,
        durationMs: 10,
      },
    ]);

    expect(encoded.classes).toBeUndefined();
    expect(encoded.tests).toEqual([{ n: 'plain-test-name', o: 1, d: 10 }]);
    expect(resolveTestFullName(undefined, encoded.tests[0])).toBe('plain-test-name');
  });

  it('encodes and expands compact failures by test index', () => {
    const { classes, tests } = encodeRunTests([
      {
        fullName: 'SampleTests.ShouldPass',
        outcomeCode: 0,
        durationMs: 123,
        namespace: 'SampleTests',
        className: 'SampleTests',
        method: 'ShouldPass',
      },
      {
        fullName: 'SampleTests.ShouldFail',
        outcomeCode: 1,
        durationMs: 1500,
        namespace: 'SampleTests',
        className: 'SampleTests',
        method: 'ShouldFail',
        isNewFailure: true,
      },
    ]);

    const failures = encodeRunFailures([
      {
        testIndex: 1,
        message: 'Expected true but was false',
        stackTrace: 'at SampleTests.ShouldFail()',
      },
    ]);

    const expandedTests = expandRunTests({ classes, tests });
    const expandedFailures = expandRunFailures(failures, expandedTests);
    expect(expandedFailures).toEqual([
      {
        testName: 'ShouldFail',
        fullName: 'SampleTests.ShouldFail',
        message: 'Expected true but was false',
        stackTrace: 'at SampleTests.ShouldFail()',
      },
    ]);
  });

  it('normalizes a full run record', () => {
    const normalized = normalizeRunRecord({
      version: 2,
      runId: '1',
      workflowRunId: 1,
      status: 'failed',
      date: '2026-07-07T10:00:00.000Z',
      durationMs: 100,
      context: {} as never,
      stats: {} as never,
      classes: ['SampleTests'],
      tests: [{ c: 0, m: 'ShouldFail', o: 1, d: 50, nf: true }],
      failures: [{ t: 0, message: 'boom' }],
      links: {} as never,
    });

    expect(normalized.tests[0].n).toBe('SampleTests.ShouldFail');
    expect(normalized.tests[0].c).toBe('SampleTests');
    expect(normalized.tests[0].m).toBe('ShouldFail');
    expect(normalized.failures[0].fullName).toBe('SampleTests.ShouldFail');
  });

  it('round-trips repository tests file through name index', () => {
    const encoded = encodeRepositoryTestsFile({
      'SampleTests.ShouldPass': {
        passRate: 100,
        runCount: 1,
        points: [
          {
            runId: '1',
            date: '2026-07-07T10:00:00.000Z',
            o: 0,
            d: 123,
            commitShortSha: 'abc123d',
            branchKey: 'main',
            branchLabel: 'main',
          },
        ],
      },
      'SampleTests.ShouldFail': {
        passRate: 0,
        runCount: 1,
        points: [
          {
            runId: '1',
            date: '2026-07-07T10:00:00.000Z',
            o: 1,
            d: 1500,
            commitShortSha: 'abc123d',
            branchKey: 'pr-42',
            branchLabel: 'PR #42',
          },
        ],
      },
    });

    expect(encoded.names).toEqual(['SampleTests.ShouldPass', 'SampleTests.ShouldFail']);
    expect(encoded.entries['0'].runCount).toBe(1);

    const decoded = decodeRepositoryTestsFile(encoded);
    expect(decoded['SampleTests.ShouldFail'].runCount).toBe(1);
    expect(normalizeTestsFile(encoded)).toEqual(decoded);
  });

  it('preserves stable test ids when appending new tests', () => {
    const first = encodeRepositoryTestsFile({
      'SampleTests.ShouldPass': {
        passRate: 100,
        runCount: 1,
        points: [],
      },
    });

    const second = encodeRepositoryTestsFile(
      {
        'SampleTests.ShouldPass': {
          passRate: 100,
          runCount: 2,
          points: [],
        },
        'SampleTests.ShouldFail': {
          passRate: 0,
          runCount: 1,
          points: [],
        },
      },
      first,
    );

    expect(second.names).toEqual(['SampleTests.ShouldPass', 'SampleTests.ShouldFail']);
    expect(second.entries['0'].runCount).toBe(2);
    expect(second.entries['1'].runCount).toBe(1);
  });
});
