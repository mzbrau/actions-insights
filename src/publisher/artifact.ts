import * as artifact from '@actions/artifact';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { copyRawTestResults, writeRawManifest } from './raw-results';

export const ARTIFACT_NAME = 'actions-insights-report';

export function collectArtifactFiles(artifactDir: string): string[] {
  const files: string[] = [];

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  walk(artifactDir);
  return files;
}

export async function uploadReportArtifact(
  artifactDir: string,
  retentionDays: number,
  commitShortSha: string,
  options: {
    includeRawTestResults?: boolean;
    matchedFiles?: string[];
    sourceFiles?: string[];
  } = {},
): Promise<void> {
  if (!fs.existsSync(artifactDir)) {
    throw new Error(`Artifact directory does not exist: ${artifactDir}`);
  }

  const includeRaw = options.includeRawTestResults ?? true;
  if (includeRaw && options.matchedFiles && options.matchedFiles.length > 0) {
    const entries = copyRawTestResults(
      options.matchedFiles,
      options.sourceFiles ?? [],
      artifactDir,
    );
    writeRawManifest(artifactDir, entries);
    core.info(`Staged ${entries.length} raw test result file(s) for artifact upload`);
  }

  const reportPath = path.join(artifactDir, 'report.html');
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Required report file not found: ${reportPath}`);
  }

  const files = collectArtifactFiles(artifactDir);
  if (files.length === 0) {
    throw new Error(`No report files found in: ${artifactDir}`);
  }

  const trendsPath = path.join(artifactDir, 'trends.json');
  if (!fs.existsSync(trendsPath)) {
    core.warning(`Optional report file not found: ${trendsPath}`);
  }

  const name = `${ARTIFACT_NAME}-${commitShortSha}`;
  const client = new artifact.DefaultArtifactClient();
  await client.uploadArtifact(name, files, artifactDir, { retentionDays });
  core.info(`Uploaded ${name} artifact (${files.length} files, ${retentionDays} day retention)`);
}
