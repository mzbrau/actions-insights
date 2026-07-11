import type { DiagnosticItem, DiagnosticReport } from '../model/diagnostics';
import { computeDiagnosticSummary } from '@actions-insights/history-models';
import type { DiagnosticParser } from './types';

// file:line:col: warning|error: message
const GCC_CLANG_LINE =
  /^(.+?):(\d+):(\d+):\s*(warning|error|note):\s*(.+)$/;

// file:line: warning|error: message
const GCC_CLANG_NO_COL =
  /^(.+?):(\d+):\s*(warning|error|note):\s*(.+)$/;

function parseGccClang(content: string, filePath: string): DiagnosticReport {
  const items: DiagnosticItem[] = [];

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match = GCC_CLANG_LINE.exec(trimmed);
    if (match) {
      items.push({
        severity: match[4] as DiagnosticItem['severity'],
        file: match[1],
        line: Number.parseInt(match[2], 10),
        column: Number.parseInt(match[3], 10),
        message: match[5],
        source: 'gcc',
      });
      continue;
    }

    match = GCC_CLANG_NO_COL.exec(trimmed);
    if (match) {
      items.push({
        severity: match[3] as DiagnosticItem['severity'],
        file: match[1],
        line: Number.parseInt(match[2], 10),
        message: match[4],
        source: 'gcc',
      });
    }
  }

  return {
    summary: computeDiagnosticSummary(items),
    items,
    sourceFiles: [filePath],
  };
}

export const gccClangParser: DiagnosticParser = {
  format: 'gcc',
  canParse(filePath, peek) {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.sarif') || lower.endsWith('.sarif.json')) return false;
    if (MSBUILD_LIKE.test(peek)) return false;
    return GCC_CLANG_NO_COL.test(peek) || GCC_CLANG_LINE.test(peek);
  },
  parse(content, filePath) {
    return parseGccClang(content, filePath);
  },
};

const MSBUILD_LIKE = /\(\d+(?:,\d+)?\)\s*:\s*(warning|error)/i;
