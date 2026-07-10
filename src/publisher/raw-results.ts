import * as fs from 'fs';
import * as path from 'path';
import { ensureDir } from './site-merger';

export interface RawManifestEntry {
  artifactPath: string;
  sourcePath: string;
  parsed: boolean;
}

export interface RawManifest {
  version: 1;
  files: RawManifestEntry[];
}

function resolveArtifactRelativePath(sourceFile: string, workspaceRoot: string): string {
  const relative = path.relative(workspaceRoot, sourceFile);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    return path.basename(sourceFile);
  }
  return relative;
}

function resolveUniqueDestPath(rawDir: string, relativePath: string, usedPaths: Set<string>): string {
  const normalized = relativePath.split(path.sep).join('/');
  let candidate = normalized;
  let suffix = 2;
  while (usedPaths.has(candidate)) {
    const ext = path.extname(normalized);
    const base = ext ? normalized.slice(0, -ext.length) : normalized;
    candidate = `${base}-${suffix}${ext}`;
    suffix += 1;
  }
  usedPaths.add(candidate);
  return path.join(rawDir, ...candidate.split('/'));
}

export function copyRawTestResults(
  matchedFiles: string[],
  sourceFiles: string[],
  artifactDir: string,
  workspaceRoot = process.cwd(),
): RawManifestEntry[] {
  if (matchedFiles.length === 0) return [];

  const rawDir = path.join(artifactDir, 'raw');
  const parsedSet = new Set(sourceFiles.map((file) => path.resolve(file)));
  const usedPaths = new Set<string>();
  const entries: RawManifestEntry[] = [];

  for (const sourceFile of matchedFiles) {
    const absolute = path.resolve(sourceFile);
    const relativePath = resolveArtifactRelativePath(absolute, workspaceRoot);
    const destPath = resolveUniqueDestPath(rawDir, relativePath, usedPaths);
    ensureDir(path.dirname(destPath));
    fs.copyFileSync(absolute, destPath);
    entries.push({
      artifactPath: path.relative(artifactDir, destPath).split(path.sep).join('/'),
      sourcePath: absolute,
      parsed: parsedSet.has(absolute),
    });
  }

  return entries;
}

export function writeRawManifest(artifactDir: string, entries: RawManifestEntry[]): void {
  if (entries.length === 0) return;

  const manifest: RawManifest = { version: 1, files: entries };
  const manifestPath = path.join(artifactDir, 'raw', 'manifest.json');
  ensureDir(path.dirname(manifestPath));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}
