import type { DiagnosticItem, DiagnosticReport } from '../model/diagnostics';
import { computeDiagnosticSummary } from '@actions-insights/history-models';
import type { DiagnosticParser } from './types';

interface SarifResult {
  ruleId?: string;
  level?: string;
  message?: { text?: string };
  locations?: Array<{
    physicalLocation?: {
      artifactLocation?: { uri?: string };
      region?: { startLine?: number; startColumn?: number };
    };
  }>;
}

interface SarifRun {
  tool?: { driver?: { name?: string } };
  results?: SarifResult[];
}

interface SarifLog {
  version?: string;
  runs?: SarifRun[];
}

function mapSarifLevel(level?: string): DiagnosticItem['severity'] {
  switch ((level ?? '').toLowerCase()) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'note':
    case 'none':
      return 'note';
    default:
      return 'warning';
  }
}

function parseSarif(content: string, filePath: string): DiagnosticReport {
  const log = JSON.parse(content) as SarifLog;
  const items: DiagnosticItem[] = [];

  for (const run of log.runs ?? []) {
    const source = run.tool?.driver?.name ?? 'sarif';
    for (const result of run.results ?? []) {
      const location = result.locations?.[0]?.physicalLocation;
      const uri = location?.artifactLocation?.uri;
      const region = location?.region;

      items.push({
        severity: mapSarifLevel(result.level),
        message: result.message?.text ?? result.ruleId ?? 'Diagnostic',
        file: uri,
        line: region?.startLine,
        column: region?.startColumn,
        code: result.ruleId,
        source,
      });
    }
  }

  return {
    summary: computeDiagnosticSummary(items),
    items,
    sourceFiles: [filePath],
  };
}

export const sarifParser: DiagnosticParser = {
  format: 'sarif',
  canParse(filePath, peek) {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.sarif') || lower.endsWith('.sarif.json')) return true;
    const trimmed = peek.trimStart();
    if (!trimmed.startsWith('{')) return false;
    return trimmed.includes('"version"') && trimmed.includes('"runs"');
  },
  parse(content, filePath) {
    return parseSarif(content, filePath);
  },
};
