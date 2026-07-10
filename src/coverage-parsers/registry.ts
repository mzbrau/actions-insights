import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { create as createGlob } from '@actions/glob';
import type { CoverageReport } from '../model/coverage';
import { coberturaParser } from './cobertura';
import { jacocoParser } from './jacoco';
import { lcovParser } from './lcov';
import { mergeCoverageReports } from './merge';
import { opencoverParser } from './opencover';
import type { CoverageParser } from './types';
import { applyValidationWarnings, validateCoverageReport } from './validate';

const PARSERS: CoverageParser[] = [jacocoParser, coberturaParser, opencoverParser, lcovParser];

export function detectCoverageParser(filePath: string, content: string): CoverageParser | undefined {
  const peek = content.slice(0, 4096);
  for (const parser of PARSERS) {
    if (parser.canParse(filePath, peek)) {
      return parser;
    }
  }
  return undefined;
}

function splitPatterns(pattern: string): string[] {
  return pattern.split(',').map((p) => p.trim()).filter(Boolean);
}

export async function parseCoverageFiles(
  pattern: string,
  cwd = process.cwd(),
): Promise<CoverageReport | undefined> {
  const patterns = splitPatterns(pattern);
  const reports: CoverageReport[] = [];
  const matchedFiles: string[] = [];
  const errors: Array<{ file: string; message: string }> = [];

  for (const singlePattern of patterns) {
    const fullPattern = path.isAbsolute(singlePattern) ? singlePattern : path.join(cwd, singlePattern);
    const globber = await createGlob(fullPattern, { followSymbolicLinks: false });
    const files = await globber.glob();

    for (const file of files) {
      const absolute = path.isAbsolute(file) ? file : path.join(cwd, file);
      if (!fs.existsSync(absolute)) continue;
      matchedFiles.push(absolute);

      const content = fs.readFileSync(absolute, 'utf8');
      const parser = detectCoverageParser(absolute, content);
      if (!parser) {
        errors.push({ file: absolute, message: 'No matching coverage parser found' });
        continue;
      }

      try {
        const report = parser.parse(content, absolute);
        report.matchedFiles = matchedFiles;
        const issues = validateCoverageReport(report);
        for (const issue of issues.filter((i) => i.level === 'error')) {
          core.warning(`Coverage validation: ${issue.message}`);
        }
        reports.push(applyValidationWarnings(report, issues));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ file: absolute, message });
        core.warning(`Failed to parse coverage file ${absolute}: ${message}`);
      }
    }
  }

  if (reports.length === 0) {
    if (errors.length > 0) {
      return {
        summary: {},
        projects: [],
        sourceFiles: [],
        matchedFiles,
        errors,
      };
    }
    return undefined;
  }

  const merged = mergeCoverageReports(reports);
  merged.matchedFiles = [...new Set(matchedFiles)];
  if (errors.length > 0) {
    merged.errors = [...(merged.errors ?? []), ...errors];
  }
  return merged;
}

export { PARSERS };
