import type { TestCase } from '../model/test-case';
import { truncateLines } from './truncate';

export interface StackLocation {
  path: string;
  line: number;
  column?: number;
}

export interface CheckAnnotation {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: 'failure' | 'warning';
  title: string;
  message: string;
}

const DOTNET_STACK = /at\s+.+?\s+in\s+(.+?):line\s+(\d+)/i;
const GENERIC_STACK = /at\s+.+?\((.+?):(\d+)(?::(\d+))?\)/;
const FILE_LINE = /([^\s:]+\.[a-zA-Z]{1,4}):(\d+)/;

export function parseStackLocation(stackTrace: string | undefined): StackLocation | undefined {
  if (!stackTrace) return undefined;

  for (const line of stackTrace.split(/\r?\n/)) {
    const dotnet = line.match(DOTNET_STACK);
    if (dotnet) {
      return { path: normalizePath(dotnet[1]), line: Number.parseInt(dotnet[2], 10) };
    }
    const generic = line.match(GENERIC_STACK);
    if (generic) {
      return {
        path: normalizePath(generic[1]),
        line: Number.parseInt(generic[2], 10),
        column: generic[3] ? Number.parseInt(generic[3], 10) : undefined,
      };
    }
    const simple = line.match(FILE_LINE);
    if (simple && looksLikeSourceFile(simple[1])) {
      return { path: normalizePath(simple[1]), line: Number.parseInt(simple[2], 10) };
    }
  }
  return undefined;
}

function normalizePath(filePath: string): string {
  const trimmed = filePath.trim();
  const workspace = process.env.GITHUB_WORKSPACE;
  if (workspace && trimmed.startsWith(workspace)) {
    return trimmed.slice(workspace.length + 1);
  }
  const srcIndex = trimmed.indexOf('/src/');
  if (srcIndex >= 0) return trimmed.slice(srcIndex + 1);
  const testsIndex = trimmed.indexOf('/tests/');
  if (testsIndex >= 0) return trimmed.slice(testsIndex + 1);
  return trimmed.replace(/^\/+/, '');
}

function looksLikeSourceFile(filePath: string): boolean {
  return /\.(cs|fs|vb|ts|tsx|js|jsx|py|go|rs|java|kt|swift|rb|php|cpp|c|h)$/i.test(filePath);
}

export function buildCheckAnnotations(
  failedTests: TestCase[],
  maxAnnotations: number,
  maxMessageLines: number,
): CheckAnnotation[] {
  const annotations: CheckAnnotation[] = [];
  const prioritized = [...failedTests].sort((a, b) => {
    if (a.isNewFailure && !b.isNewFailure) return -1;
    if (!a.isNewFailure && b.isNewFailure) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  for (const test of prioritized) {
    if (annotations.length >= maxAnnotations) break;
    const location = parseStackLocation(test.stackTrace);
    if (!location) continue;

    const stack = truncateLines(test.stackTrace, maxMessageLines);
    const messageParts = [test.message, stack.text].filter(Boolean).join('\n');

    annotations.push({
      path: location.path,
      start_line: location.line,
      end_line: location.line,
      annotation_level: 'failure',
      title: test.fullName.slice(0, 255),
      message: messageParts.slice(0, 65535),
    });
  }

  return annotations;
}
