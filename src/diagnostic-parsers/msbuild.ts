import type { DiagnosticItem, DiagnosticReport } from '../model/diagnostics';
import { computeDiagnosticSummary } from '@actions-insights/history-models';
import type { DiagnosticParser } from './types';

// MSBuild/Roslyn: path(line,col): warning|error CODE: message
// Or: path(line): warning|error CODE: message
const MSBUILD_LINE =
  /^(.+?)\((\d+)(?:,(\d+))?\)\s*:\s*(warning|error)\s+([A-Za-z]+\d+)\s*:\s*(.+)$/i;

// Simpler: warning CS1234: message
const MSBUILD_SIMPLE = /^(warning|error)\s+([A-Za-z]+\d+)\s*:\s*(.+)$/i;

// Project-level: path : warning|error CODE: message (no parens)
const MSBUILD_PATH_LINE =
  /^(.+?)\s*:\s*(warning|error)\s+([A-Za-z]+\d+)\s*:\s*(.+)$/i;

function parseMsBuild(content: string, filePath: string): DiagnosticReport {
  const items: DiagnosticItem[] = [];

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match = MSBUILD_LINE.exec(trimmed);
    if (match) {
      items.push({
        severity: match[4].toLowerCase() as DiagnosticItem['severity'],
        file: match[1],
        line: Number.parseInt(match[2], 10),
        column: match[3] ? Number.parseInt(match[3], 10) : undefined,
        code: match[5],
        message: match[6],
        source: 'msbuild',
      });
      continue;
    }

    match = MSBUILD_PATH_LINE.exec(trimmed);
    if (match && !trimmed.includes('(')) {
      items.push({
        severity: match[2].toLowerCase() as DiagnosticItem['severity'],
        file: match[1],
        code: match[3],
        message: match[4],
        source: 'msbuild',
      });
      continue;
    }

    match = MSBUILD_SIMPLE.exec(trimmed);
    if (match) {
      items.push({
        severity: match[1].toLowerCase() as DiagnosticItem['severity'],
        code: match[2],
        message: match[3],
        source: 'msbuild',
      });
    }
  }

  return {
    summary: computeDiagnosticSummary(items),
    items,
    sourceFiles: [filePath],
  };
}

export const msbuildParser: DiagnosticParser = {
  format: 'msbuild',
  canParse(filePath, peek) {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.sarif') || lower.endsWith('.sarif.json')) return false;
    if (lower.endsWith('.log') || lower.includes('msbuild') || lower.includes('build')) return true;
    return (
      /:\s*(warning|error)\s+[A-Za-z]+\d+\s*:/i.test(peek) ||
      /\(\d+(?:,\d+)?\)\s*:\s*(warning|error)/i.test(peek)
    );
  },
  parse(content, filePath) {
    return parseMsBuild(content, filePath);
  },
};
