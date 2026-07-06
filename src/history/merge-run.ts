import * as fs from 'fs';
import * as path from 'path';
import type { TestCase } from '../model/test-case';
import { mergeTestCases } from '../model/test-case';
import type { TestRun } from '../model/test-run';
import { computeStats, deriveStatus } from '../model/test-run';

interface PartialRunFile {
  tests: TestCase[];
}

export function readPartialRun(partialPath: string): TestCase[] | undefined {
  try {
    if (!fs.existsSync(partialPath)) return undefined;
    const data = JSON.parse(fs.readFileSync(partialPath, 'utf8')) as PartialRunFile;
    return data.tests;
  } catch {
    return undefined;
  }
}

export function writePartialRun(partialPath: string, tests: TestCase[]): void {
  fs.mkdirSync(path.dirname(partialPath), { recursive: true });
  fs.writeFileSync(partialPath, JSON.stringify({ tests }, null, 2));
}

export function mergePartialRun(run: TestRun, partialPath: string): TestRun {
  const existing = readPartialRun(partialPath);
  if (!existing || existing.length === 0) {
    writePartialRun(partialPath, run.tests);
    return run;
  }

  const merged = new Map<string, TestCase>();
  for (const test of existing) {
    merged.set(test.fullName, test);
  }
  for (const test of run.tests) {
    const prior = merged.get(test.fullName);
    merged.set(test.fullName, prior ? mergeTestCases(prior, test) : test);
  }

  const tests = [...merged.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  writePartialRun(partialPath, tests);

  return {
    ...run,
    tests,
    stats: computeStats(tests),
    status: deriveStatus(tests),
  };
}
