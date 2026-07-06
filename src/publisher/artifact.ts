import * as artifact from '@actions/artifact';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

export const ARTIFACT_NAME = 'actions-insights-report';

export async function uploadReportArtifact(
  siteOutput: string,
  retentionDays: number,
): Promise<void> {
  if (!fs.existsSync(siteOutput)) {
    throw new Error(`Site output directory does not exist: ${siteOutput}`);
  }

  const files = collectFiles(siteOutput);
  if (files.length === 0) {
    throw new Error(`No files found in site output directory: ${siteOutput}`);
  }

  const client = new artifact.DefaultArtifactClient();
  await client.uploadArtifact(ARTIFACT_NAME, files, siteOutput, { retentionDays });
  core.info(`Uploaded ${ARTIFACT_NAME} artifact (${files.length} files, ${retentionDays} day retention)`);
}

function collectFiles(root: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}
