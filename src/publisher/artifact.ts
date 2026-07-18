import { DefaultArtifactClient } from '@actions/artifact';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { copyRawTestResults, writeRawManifest } from './raw-results';

export const ARTIFACT_NAME = 'actions-insights-report';

export interface UploadReportArtifactResult {
  htmlArtifactUrl?: string;
}

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

export function buildHtmlArtifactFileName(commitShortSha: string): string {
  return `${ARTIFACT_NAME}-${commitShortSha}.html`;
}

export function buildArtifactDownloadUrl(workflowUrl: string, artifactId: number): string {
  return `${workflowUrl}/artifacts/${artifactId}`;
}

export async function uploadReportArtifact(
  artifactDir: string,
  retentionDays: number,
  commitShortSha: string,
  workflowUrl: string,
  options: {
    includeRawTestResults?: boolean;
    matchedFiles?: string[];
    sourceFiles?: string[];
  } = {},
): Promise<UploadReportArtifactResult> {
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

  const client = new DefaultArtifactClient();
  const result: UploadReportArtifactResult = {};

  const htmlFileName = buildHtmlArtifactFileName(commitShortSha);
  const htmlUploadPath = path.join(artifactDir, htmlFileName);
  fs.copyFileSync(reportPath, htmlUploadPath);

  try {
    const htmlUpload = await client.uploadArtifact(
      htmlFileName,
      [htmlUploadPath],
      artifactDir,
      { retentionDays, skipArchive: true },
    );
    if (htmlUpload.id !== undefined) {
      result.htmlArtifactUrl = buildArtifactDownloadUrl(workflowUrl, htmlUpload.id);
      core.info(
        `Uploaded unzipped HTML artifact ${htmlFileName} (id ${htmlUpload.id}, ${retentionDays} day retention)`,
      );
    } else {
      core.warning('Unzipped HTML artifact upload succeeded but returned no artifact id');
    }
  } catch (error) {
    core.warning(
      `Unzipped HTML artifact upload failed: ${error instanceof Error ? error.message : String(error)}. Falling back to zipped artifact links.`,
    );
  } finally {
    try {
      fs.unlinkSync(htmlUploadPath);
    } catch {
      // ignore cleanup failures
    }
  }

  const bundleName = `${ARTIFACT_NAME}-${commitShortSha}`;
  const bundleFiles = collectArtifactFiles(artifactDir).filter(
    (file) => path.basename(file) !== htmlFileName,
  );
  await client.uploadArtifact(bundleName, bundleFiles, artifactDir, { retentionDays });
  core.info(`Uploaded ${bundleName} artifact (${bundleFiles.length} files, ${retentionDays} day retention)`);

  return result;
}
