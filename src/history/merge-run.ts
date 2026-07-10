import * as fs from 'fs';
import * as path from 'path';
import type { TestCase } from '../model/test-case';
import { mergeTestCases } from '../model/test-case';
import type { TestRun } from '../model/test-run';
import { computeStats, deriveStatus } from '../model/test-run';

interface PartialRunFile {
  tests: TestCase[];
  sourceFiles?: string[];
  matchedFiles?: string[];
}

function unionPaths(...lists: Array<string[] | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const list of lists) {
    if (!list) continue;
    for (const file of list) {
      const absolute = path.resolve(file);
      if (seen.has(absolute)) continue;
      seen.add(absolute);
      result.push(absolute);
    }
  }
  return result;
}

function readPartialRunFile(partialPath: string): PartialRunFile | undefined {
  try {
    if (!fs.existsSync(partialPath)) return undefined;
    return JSON.parse(fs.readFileSync(partialPath, 'utf8')) as PartialRunFile;
  } catch {
    return undefined;
  }
}

export function readPartialRun(partialPath: string): TestCase[] | undefined {
  return readPartialRunFile(partialPath)?.tests;
}

export function writePartialRun(
  partialPath: string,
  tests: TestCase[],
  sourceFiles?: string[],
  matchedFiles?: string[],
): void {
  fs.mkdirSync(path.dirname(partialPath), { recursive: true });
  const payload: PartialRunFile = { tests };
  if (sourceFiles && sourceFiles.length > 0) payload.sourceFiles = sourceFiles;
  if (matchedFiles && matchedFiles.length > 0) payload.matchedFiles = matchedFiles;
  fs.writeFileSync(partialPath, JSON.stringify(payload, null, 2));
}

export function mergePartialRun(run: TestRun, partialPath: string): TestRun {
  const existing = readPartialRunFile(partialPath);
  if (!existing || existing.tests.length === 0) {
    writePartialRun(partialPath, run.tests, run.sourceFiles, run.matchedFiles);
    return run;
  }

  const merged = new Map<string, TestCase>();
  for (const test of existing.tests) {
    merged.set(test.fullName, test);
  }
  for (const test of run.tests) {
    const prior = merged.get(test.fullName);
    merged.set(test.fullName, prior ? mergeTestCases(prior, test) : test);
  }

  const tests = [...merged.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  const sourceFiles = unionPaths(existing.sourceFiles, run.sourceFiles);
  const matchedFiles = unionPaths(existing.matchedFiles, run.matchedFiles, run.sourceFiles, existing.sourceFiles);

  writePartialRun(partialPath, tests, sourceFiles, matchedFiles);

  return {
    ...run,
    tests,
    sourceFiles,
    matchedFiles,
    stats: computeStats(tests),
    status: deriveStatus(tests),
  };
}
