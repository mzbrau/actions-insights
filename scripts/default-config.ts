import type { ActionConfig } from '../src/config';

export function defaultLocalConfig(overrides: Partial<ActionConfig> = {}): ActionConfig {
  return {
    testResults: '**/*.{trx,xml}',
    reportsSubdirectory: 'test-reports',
    commentMode: 'off',
    historyLimit: 20,
    retainDays: 30,
    reportTitle: 'Actions Insights',
    reportOutput: '_report',
    siteOutput: '_site',
    theme: 'auto',
    slowTestThresholdMs: 1000,
    githubToken: '',
    maxFailedTestsInComment: 10,
    maxFailedTestsInSummary: 20,
    maxStackTraceLines: 25,
    includeStdout: true,
    includeStderr: true,
    includeSlowestTests: 10,
    uploadHtmlReport: false,
    generateJobSummary: false,
    publishChecks: false,
    artifactRetentionDays: 30,
    includeRawTestResults: true,
    checkName: 'Actions Insights',
    history: {
      enabled: false,
      repository: '',
      token: '',
      branch: 'main',
      dataPath: 'data',
      repositoryName: 'owner/repo',
      mode: 'multi',
    },
    ...overrides,
  };
}
