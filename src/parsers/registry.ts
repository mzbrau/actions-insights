import * as fs from 'fs';
import * as path from 'path';
import { create as createGlob } from '@actions/glob';
import type { TestCase } from '../model/test-case';
import { mergeTestCases } from '../model/test-case';
import { trxParser } from './trx';
import { nunitParser } from './nunit';
import { xunitParser } from './xunit';
import { junitParser } from './junit';
import type { TestResultParser } from './types';

const PARSERS: TestResultParser[] = [trxParser, nunitParser, xunitParser, junitParser];

export function detectParser(filePath: string, content: string): TestResultParser | undefined {
  const peek = content.slice(0, 4096);
  for (const parser of PARSERS) {
    if (parser.canParse(filePath, peek)) {
      return parser;
    }
  }
  return undefined;
}

export async function parseTestFiles(pattern: string, cwd = process.cwd()): Promise<{
  tests: TestCase[];
  sourceFiles: string[];
}> {
  const fullPattern = path.isAbsolute(pattern) ? pattern : path.join(cwd, pattern);
  const globber = await createGlob(fullPattern, { followSymbolicLinks: false });
  const files = await globber.glob();
  const merged = new Map<string, TestCase>();
  const sourceFiles: string[] = [];

  for (const file of files) {
    const absolute = path.isAbsolute(file) ? file : path.join(cwd, file);
    if (!fs.existsSync(absolute)) continue;
    const content = fs.readFileSync(absolute, 'utf8');
    const parser = detectParser(absolute, content);
    if (!parser) continue;

    sourceFiles.push(absolute);
    const cases = parser.parse(content, absolute);
    for (const testCase of cases) {
      const existing = merged.get(testCase.fullName);
      if (existing) {
        merged.set(testCase.fullName, mergeTestCases(existing, testCase));
      } else {
        merged.set(testCase.fullName, testCase);
      }
    }
  }

  return {
    tests: [...merged.values()].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    sourceFiles,
  };
}

export { PARSERS };
