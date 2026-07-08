import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectParser } from '../../parsers/registry';
import { listWorkflowRunArtifacts } from './github-runs';

export interface ArtifactDownloadOptions {
  repository: string;
  runId: number;
  artifactNames: string[];
  artifactPatterns: string[];
  testResultsGlob: string;
  token: string;
}

export interface ArtifactProbeResult {
  artifactName: string;
  downloadDir: string;
  sourceFiles: string[];
}

export async function findParseableArtifact(
  options: ArtifactDownloadOptions,
): Promise<ArtifactProbeResult | undefined> {
  const artifacts = await listWorkflowRunArtifacts(options.token, options.repository, options.runId);
  if (artifacts.length === 0) return undefined;

  const candidates = selectArtifactCandidates(artifacts, options.artifactNames, options.artifactPatterns);
  for (const artifact of candidates) {
    const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'actions-insights-artifact-'));
    try {
      downloadArtifact(options.repository, options.runId, downloadDir, artifact.name, options.artifactPatterns);
      const sourceFiles = findParseableFiles(downloadDir, options.testResultsGlob);
      if (sourceFiles.length > 0) {
        return { artifactName: artifact.name, downloadDir, sourceFiles };
      }
    } catch {
      // Try the next artifact.
    }
    fs.rmSync(downloadDir, { recursive: true, force: true });
  }

  return undefined;
}

function selectArtifactCandidates(
  artifacts: Array<{ name: string }>,
  names: string[],
  patterns: string[],
): Array<{ name: string }> {
  if (names.length > 0) {
    const selected = artifacts.filter((a) => names.includes(a.name));
    if (selected.length > 0) return selected;
  }

  if (patterns.length > 0) {
    const selected = artifacts.filter((a) => patterns.some((p) => matchGlob(a.name, p)));
    if (selected.length > 0) return selected;
  }

  return artifacts;
}

function matchGlob(value: string, pattern: string): boolean {
  const regex = new RegExp(
    `^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`,
  );
  return regex.test(value);
}

function downloadArtifact(
  repository: string,
  runId: number,
  downloadDir: string,
  artifactName: string,
  patterns: string[],
): void {
  const args = ['run', 'download', String(runId), '-R', repository, '-D', downloadDir];
  if (patterns.length > 0) {
    for (const pattern of patterns) {
      args.push('-p', pattern);
    }
  } else {
    args.push('-n', artifactName);
  }

  execFileSync('gh', args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env,
  });
}

function findParseableFiles(rootDir: string, globPattern: string): string[] {
  const extensions = extractExtensions(globPattern);
  const matches: string[] = [];
  walkDirectory(rootDir, (filePath) => {
    if (!extensions.some((ext) => filePath.endsWith(ext))) return;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (detectParser(filePath, content)) {
        matches.push(filePath);
      }
    } catch {
      // Skip unreadable files.
    }
  });
  return matches;
}

function extractExtensions(globPattern: string): string[] {
  const match = globPattern.match(/\{([^}]+)\}/);
  if (!match) {
    const ext = path.extname(globPattern);
    return ext ? [ext] : ['.trx', '.xml'];
  }
  return match[1].split(',').map((part) => (part.startsWith('.') ? part : `.${part}`));
}

function walkDirectory(dir: string, visit: (filePath: string) => void): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, visit);
    } else if (entry.isFile()) {
      visit(fullPath);
    }
  }
}

export function cleanupArtifactDir(downloadDir: string): void {
  if (fs.existsSync(downloadDir)) {
    fs.rmSync(downloadDir, { recursive: true, force: true });
  }
}
