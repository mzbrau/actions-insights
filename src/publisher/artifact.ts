import * as artifact from '@actions/artifact';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

export const ARTIFACT_NAME = 'actions-insights-report';

const ARTIFACT_FILES = ['report.html', 'trends.json'] as const;

export async function uploadReportArtifact(
  artifactDir: string,
  retentionDays: number,
): Promise<void> {
  if (!fs.existsSync(artifactDir)) {
    throw new Error(`Artifact directory does not exist: ${artifactDir}`);
  }

  const files = ARTIFACT_FILES.map((name) => path.join(artifactDir, name)).filter((f) =>
    fs.existsSync(f),
  );

  if (files.length === 0) {
    throw new Error(`No report files found in: ${artifactDir}`);
  }

  const client = new artifact.DefaultArtifactClient();
  await client.uploadArtifact(ARTIFACT_NAME, files, artifactDir, { retentionDays });
  core.info(`Uploaded ${ARTIFACT_NAME} artifact (${files.length} files, ${retentionDays} day retention)`);
}
