import * as core from '@actions/core';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type CommentMode = 'update' | 'off';

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
}

export function loadConfig(): ActionConfig {
  warnDeprecatedInputs();

  const reportsSubdirectory = normalizeSubdirectory(
    core.getInput('reports-subdirectory')
      || core.getInput('pages-subdirectory')
      || 'test-reports',
  );

  let commentMode = (core.getInput('comment-mode') || 'update') as CommentMode;
  if (core.getInput('comment-pr') === 'false') {
    commentMode = 'off';
  }

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
    includeSlowestTests: parseNonNegativeInt(core.getInput('include-slowest-tests'), 10),
    uploadHtmlReport: getBooleanOr('upload-html-report', true),
    generateJobSummary: getBooleanOr('generate-job-summary', true),
    publishChecks: getBooleanOr('publish-checks', true),
    artifactRetentionDays: parsePositiveInt(core.getInput('artifact-retention-days'), 30),
    checkName: core.getInput('check-name') || 'Actions Insights',
  };
}

function warnDeprecatedInputs(): void {
  const deprecated = ['publish-pages', 'pages-mode', 'seed-from-gh-pages'];
  for (const name of deprecated) {
    const value = core.getInput(name);
    if (value) {
      core.warning(`Input '${name}' is deprecated and ignored. GitHub Pages publishing has been removed.`);
    }
  }
  if (core.getInput('pages-subdirectory') && !core.getInput('reports-subdirectory')) {
    core.warning("Input 'pages-subdirectory' is deprecated. Use 'reports-subdirectory' instead.");
  }
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
