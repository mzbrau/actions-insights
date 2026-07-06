import * as fs from 'fs';
import * as path from 'path';
import type { RunManifestEntry } from '../model/manifest';

export interface RetentionOptions {
  historyLimit: number;
  retainDays: number;
}

export function pruneRuns(
  runs: RunManifestEntry[],
  options: RetentionOptions,
  now = Date.now(),
): RunManifestEntry[] {
  const cutoff = now - options.retainDays * 24 * 60 * 60 * 1000;
  const sorted = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const retained: RunManifestEntry[] = [];
  for (const run of sorted) {
    const age = new Date(run.date).getTime();
    const withinAge = age >= cutoff;
    const withinCount = retained.length < options.historyLimit;
    if (withinAge && withinCount) {
      retained.push(run);
    }
  }

  return retained;
}

export function pruneRunDirectories(
  branchDir: string,
  retainedRunIds: Set<string>,
): string[] {
  const removed: string[] = [];
  if (!fs.existsSync(branchDir)) return removed;

  for (const entry of fs.readdirSync(branchDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'latest') continue;
    if (!entry.name.startsWith('run-')) continue;
    const runId = entry.name.replace(/^run-/, '');
    if (!retainedRunIds.has(runId)) {
      fs.rmSync(path.join(branchDir, entry.name), { recursive: true, force: true });
      removed.push(entry.name);
    }
  }

  return removed;
}

export function copyDirectorySync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function syncLatestDirectory(runDir: string, latestDir: string): void {
  if (fs.existsSync(latestDir)) {
    fs.rmSync(latestDir, { recursive: true, force: true });
  }
  copyDirectorySync(runDir, latestDir);
}
