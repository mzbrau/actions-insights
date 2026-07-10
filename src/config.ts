import * as core from '@actions/core';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type CommentMode = 'update' | 'off';
export type HistoryMode = 'multi';

export interface HistoryConfig {
  enabled: boolean;
  repository: string;
  token: string;
  pagesUrl?: string;
  branch: string;
  dataPath: string;
  repositoryName: string;
  mode: HistoryMode;
  defaultRepository?: string;
}

export interface ActionConfig {
  testResults: string;
  reportsSubdirectory: string;
  commentMode: CommentMode;
  historyLimit: number;
  retainDays: number;
  reportTitle: string;
  reportOutput: string;
  siteOutput: string;
  theme: ThemeMode;
  slowTestThresholdMs: number;
  githubToken: string;
  maxFailedTestsInComment: number;
  maxFailedTestsInSummary: number;
  maxStackTraceLines: number;
  includeStdout: boolean;
  includeStderr: boolean;
  includeSlowestTests: number;
  uploadHtmlReport: boolean;
  generateJobSummary: boolean;
  publishChecks: boolean;
  artifactRetentionDays: number;
  checkName: string;
  history: HistoryConfig;
}

export function loadConfig(): ActionConfig {
  const reportsSubdirectory = normalizeSubdirectory(
    core.getInput('reports-subdirectory') || 'test-reports',
  );

  const commentMode = (core.getInput('comment-mode') || 'update') as CommentMode;

  return {
    testResults: core.getInput('test-results') || '**/*.{trx,xml}',
    reportsSubdirectory,
    commentMode,
    historyLimit: parsePositiveInt(core.getInput('history'), 20),
    retainDays: parsePositiveInt(core.getInput('retain-days'), 30),
    reportTitle: core.getInput('report-title') || 'Actions Insights',
    reportOutput: core.getInput('report-output') || '_report',
    siteOutput: core.getInput('site-output') || '_site',
    theme: (core.getInput('theme') || 'auto') as ThemeMode,
    slowTestThresholdMs: parsePositiveInt(core.getInput('slow-test-threshold-ms'), 1000),
    githubToken: core.getInput('github-token'),
    maxFailedTestsInComment: parseNonNegativeInt(core.getInput('max-failed-tests-in-comment'), 10),
    maxFailedTestsInSummary: parseNonNegativeInt(core.getInput('max-failed-tests-in-summary'), 20),
    maxStackTraceLines: parsePositiveInt(core.getInput('max-stack-trace-lines'), 25),
    includeStdout: getBooleanOr('include-stdout', true),
    includeStderr: getBooleanOr('include-stderr', true),
    includeSlowestTests: parseNonNegativeInt(core.getInput('include-slowest-tests'), 18),
    uploadHtmlReport: getBooleanOr('upload-html-report', true),
    generateJobSummary: getBooleanOr('generate-job-summary', true),
    publishChecks: getBooleanOr('publish-checks', true),
    artifactRetentionDays: parsePositiveInt(core.getInput('artifact-retention-days'), 30),
    checkName: core.getInput('check-name') || 'Actions Insights',
    history: loadHistoryConfig(),
  };
}

function loadHistoryConfig(): HistoryConfig {
  const enabled = getBooleanOr('history-enabled', false);
  const repositoryNameInput = core.getInput('history-repository-name') || 'auto';
  const repositoryFromEnv = process.env.GITHUB_REPOSITORY ?? '';
  const repositoryName = repositoryNameInput === 'auto'
    ? repositoryFromEnv
    : repositoryNameInput;

  const defaultRepository = core.getInput('history-default-repository') || undefined;
  const pagesUrl = (core.getInput('history-pages-url') || '').trim() || undefined;

  return {
    enabled,
    repository: core.getInput('history-repository') || '',
    token: core.getInput('history-token') || '',
    pagesUrl,
    branch: core.getInput('history-branch') || 'main',
    dataPath: normalizeSubdirectory(core.getInput('history-path') || 'data'),
    repositoryName,
    mode: 'multi',
    defaultRepository,
  };
}

function normalizeSubdirectory(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getBooleanOr(name: string, fallback: boolean): boolean {
  const value = core.getInput(name);
  if (!value) return fallback;
  return value === 'true';
}
