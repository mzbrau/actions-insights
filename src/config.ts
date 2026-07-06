import * as core from '@actions/core';

export type PagesMode = 'artifact' | 'gh-pages' | 'none';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ActionConfig {
  testResults: string;
  pagesSubdirectory: string;
  publishPages: boolean;
  pagesMode: PagesMode;
  commentPr: boolean;
  historyLimit: number;
  retainDays: number;
  reportTitle: string;
  reportOutput: string;
  siteOutput: string;
  theme: ThemeMode;
  slowTestThresholdMs: number;
  seedFromGhPages: boolean;
  githubToken: string;
}

export function loadConfig(): ActionConfig {
  const publishPages = core.getBooleanInput('publish-pages');
  let pagesMode = core.getInput('pages-mode') as PagesMode;
  if (!publishPages) {
    pagesMode = 'none';
  }

  return {
    testResults: core.getInput('test-results') || '**/*.{trx,xml}',
    pagesSubdirectory: normalizeSubdirectory(core.getInput('pages-subdirectory') || 'test-reports'),
    publishPages,
    pagesMode,
    commentPr: core.getBooleanInput('comment-pr'),
    historyLimit: parsePositiveInt(core.getInput('history'), 20),
    retainDays: parsePositiveInt(core.getInput('retain-days'), 30),
    reportTitle: core.getInput('report-title') || 'Actions Insights',
    reportOutput: core.getInput('report-output') || '_report',
    siteOutput: core.getInput('site-output') || '_site',
    theme: (core.getInput('theme') || 'auto') as ThemeMode,
    slowTestThresholdMs: parsePositiveInt(core.getInput('slow-test-threshold-ms'), 1000),
    seedFromGhPages: core.getBooleanInput('seed-from-gh-pages'),
    githubToken: core.getInput('github-token'),
  };
}

function normalizeSubdirectory(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
