import * as fs from 'fs';

/** Format an ISO timestamp for markdown output in UTC. */
export function formatUtcTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
}

/** Use the latest test-result file mtime as the run completion time when available. */
export function resolveRunCompletedAt(sourceFiles: string[], fallback: string): string {
  let latest = 0;
  for (const file of sourceFiles) {
    try {
      const mtime = fs.statSync(file).mtimeMs;
      if (mtime > latest) latest = mtime;
    } catch {
      // ignore missing files
    }
  }
  return latest > 0 ? new Date(latest).toISOString() : fallback;
}
