import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { create as createGlob } from '@actions/glob';
import type { DiagnosticReport } from '../model/diagnostics';
import { gccClangParser } from './gcc-clang';
import { mergeDiagnosticReports } from './merge';
import { msbuildParser } from './msbuild';
import { sarifParser } from './sarif';
import type { DiagnosticParser } from './types';

const PARSERS: DiagnosticParser[] = [sarifParser, msbuildParser, gccClangParser];

export function detectDiagnosticParser(filePath: string, content: string): DiagnosticParser | undefined {
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

export async function parseDiagnosticFiles(
  pattern: string,
  cwd = process.cwd(),
): Promise<DiagnosticReport | undefined> {
  const patterns = splitPatterns(pattern);
  const reports: DiagnosticReport[] = [];
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
      const parser = detectDiagnosticParser(absolute, content);
      if (!parser) {
        errors.push({ file: absolute, message: 'No matching diagnostic parser found' });
        continue;
      }

      try {
        const report = parser.parse(content, absolute);
        reports.push(report);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ file: absolute, message });
        core.warning(`Failed to parse diagnostic file ${absolute}: ${message}`);
      }
    }
  }

  if (reports.length === 0) {
    if (errors.length > 0) {
      return {
        summary: { errors: 0, warnings: 0 },
        items: [],
        sourceFiles: [],
        matchedFiles,
        errors,
      };
    }
    return undefined;
  }

  const merged = mergeDiagnosticReports(reports);
  merged.matchedFiles = [...new Set(matchedFiles)];
  if (errors.length > 0) {
    merged.errors = [...(merged.errors ?? []), ...errors];
  }
  return merged;
}

export { PARSERS };
