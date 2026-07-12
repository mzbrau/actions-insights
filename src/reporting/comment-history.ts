export interface CommentResultSnapshot {
  completedAt: string;
  passed: number;
  failed: number;
  skipped: number;
}

export const COMMENT_STATE_MARKER = '<!-- actions-insights-state:';
export const PREVIOUS_RESULTS_MARKER = '<!-- actions-insights-previous-results:';

function parseJsonMarker<T>(body: string, marker: string): T | undefined {
  const start = body.indexOf(marker);
  if (start === -1) return undefined;
  const jsonStart = start + marker.length;
  const end = body.indexOf('-->', jsonStart);
  if (end === -1) return undefined;
  try {
    return JSON.parse(body.slice(jsonStart, end)) as T;
  } catch {
    return undefined;
  }
}

/** Parse the compact summary line: **✅ 1 passed · ❌ 1 failed · ⏭ 0 skipped · ...** */
function parseCompactSummaryCounts(body: string): Pick<CommentResultSnapshot, 'passed' | 'failed' | 'skipped'> | undefined {
  const match = body.match(
    /\*\*✅\s*([\d,]+)\s*passed\s*·\s*❌\s*([\d,]+)\s*failed\s*·\s*⏭\s*([\d,]+)\s*skipped/,
  );
  if (!match) return undefined;
  return {
    passed: Number.parseInt(match[1].replace(/,/g, ''), 10),
    failed: Number.parseInt(match[2].replace(/,/g, ''), 10),
    skipped: Number.parseInt(match[3].replace(/,/g, ''), 10),
  };
}

/** Parse timestamp from the commit metadata line ending with "· {timestamp}". */
function parseTimestampFromBody(body: string): string | undefined {
  for (const line of body.split('\n')) {
    const match = line.match(/·\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+UTC)\s*$/);
    if (match) return match[1];
  }
  return undefined;
}

export function parseCommentState(body: string): CommentResultSnapshot | undefined {
  const fromMarker = parseJsonMarker<CommentResultSnapshot>(body, COMMENT_STATE_MARKER);
  if (fromMarker) return fromMarker;

  const counts = parseCompactSummaryCounts(body);
  const completedAt = parseTimestampFromBody(body);
  if (!counts || !completedAt) return undefined;
  return { completedAt, ...counts };
}

export function parsePreviousResults(body: string): CommentResultSnapshot[] {
  const fromMarker = parseJsonMarker<CommentResultSnapshot[]>(body, PREVIOUS_RESULTS_MARKER);
  return Array.isArray(fromMarker) ? fromMarker : [];
}

export function archiveCommentResults(body: string): CommentResultSnapshot[] {
  const previousResults = parsePreviousResults(body);
  const currentState = parseCommentState(body);
  if (!currentState) return previousResults;
  return [...previousResults, currentState];
}

export function formatPreviousResultsSection(results: CommentResultSnapshot[]): string[] {
  if (results.length === 0) return [];
  const lines = ['### Previous results', ''];
  for (const result of results) {
    lines.push(
      `- ${result.completedAt} · ✅ ${result.passed.toLocaleString()} passed · ❌ ${result.failed.toLocaleString()} failed · ⏭ ${result.skipped.toLocaleString()} skipped`,
    );
  }
  return lines;
}

export function buildCommentHistoryMarkers(
  state: CommentResultSnapshot,
  previousResults: CommentResultSnapshot[],
): string[] {
  return [
    `${COMMENT_STATE_MARKER}${JSON.stringify(state)}-->`,
    `${PREVIOUS_RESULTS_MARKER}${JSON.stringify(previousResults)}-->`,
  ];
}
