import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RunContext } from '../../src/model/test-run';

const listJobsForWorkflowRun = vi.fn();
const getWorkflowRun = vi.fn();

vi.mock('@actions/github', () => ({
  context: {
    repo: { owner: 'mzbrau', repo: 'fig' },
  },
  getOctokit: () => ({
    rest: {
      actions: {
        listJobsForWorkflowRun,
        getWorkflowRun,
      },
    },
  }),
}));

import { fetchWorkflowTiming } from '../../src/github/jobs';

const context: RunContext = {
  repository: 'mzbrau/fig',
  repositoryUrl: 'https://github.com/mzbrau/fig',
  workflow: 'build and test',
  workflowUrl: 'https://github.com/mzbrau/fig/actions/runs/29162699578',
  runId: 29162699578,
  runAttempt: 2,
  branch: 'feature/actions-insights/1',
  ref: 'refs/heads/feature/actions-insights/1',
  commitSha: 'bd5c0bc56862b88f70fd57586df79309e96868f7',
  commitShortSha: 'bd5c0bc',
  commitMessage: 'test',
  commitUrl: 'https://github.com/mzbrau/fig/commit/bd5c0bc',
  author: 'dev',
  actor: 'dev',
  startedAt: '2026-07-11T18:33:44Z',
  completedAt: '2026-07-11T18:57:06Z',
};

describe('fetchWorkflowTiming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GITHUB_JOB;
  });

  it('uses workflow run timestamps for parallel jobs', async () => {
    listJobsForWorkflowRun.mockResolvedValue({
      data: {
        jobs: [
          {
            name: 'build',
            started_at: '2026-07-11T10:00:00Z',
            completed_at: '2026-07-11T10:05:00Z',
            steps: [{ name: 'Build', number: 1, started_at: '2026-07-11T10:00:00Z', completed_at: '2026-07-11T10:05:00Z', status: 'completed', conclusion: 'success' }],
          },
          {
            name: 'test',
            started_at: '2026-07-11T10:00:00Z',
            completed_at: '2026-07-11T10:08:00Z',
            steps: [{ name: 'Test', number: 1, started_at: '2026-07-11T10:00:00Z', completed_at: '2026-07-11T10:08:00Z', status: 'completed', conclusion: 'success' }],
          },
        ],
      },
    });
    getWorkflowRun.mockResolvedValue({
      data: {
        status: 'completed',
        created_at: '2026-07-11T10:00:00Z',
        run_started_at: '2026-07-11T10:00:00Z',
        updated_at: '2026-07-11T10:08:00Z',
      },
    });

    const result = await fetchWorkflowTiming('token', context);

    expect(result?.summary.workflowDurationMs).toBe(8 * 60 * 1000);
    expect(result?.summary.jobs).toHaveLength(2);
    expect(result?.summary.steps).toHaveLength(2);
  });

  it('uses current attempt timestamps on re-run workflows', async () => {
    listJobsForWorkflowRun.mockResolvedValue({
      data: {
        jobs: [
          {
            name: 'build',
            started_at: '2026-07-11T18:01:54Z',
            completed_at: '2026-07-11T18:04:20Z',
            steps: [{ name: 'Build', number: 1, started_at: '2026-07-11T18:02:28Z', completed_at: '2026-07-11T18:03:37Z', status: 'completed', conclusion: 'success' }],
          },
          {
            name: 'unit-tests',
            started_at: '2026-07-11T18:04:23Z',
            completed_at: '2026-07-11T18:05:23Z',
            steps: [{ name: 'Run Unit Tests', number: 1, started_at: '2026-07-11T18:04:49Z', completed_at: '2026-07-11T18:05:19Z', status: 'completed', conclusion: 'success' }],
          },
          {
            name: 'integration-tests',
            started_at: '2026-07-11T18:33:48Z',
            completed_at: '2026-07-11T18:56:22Z',
            steps: [{ name: 'Run Integration Tests', number: 1, started_at: '2026-07-11T18:34:24Z', completed_at: '2026-07-11T18:56:18Z', status: 'completed', conclusion: 'failure' }],
          },
          {
            name: 'test-report',
            started_at: '2026-07-11T18:56:25Z',
            completed_at: '2026-07-11T18:57:05Z',
            steps: [{ name: 'Publish test report', number: 1, started_at: '2026-07-11T18:56:49Z', completed_at: '2026-07-11T18:57:02Z', status: 'completed', conclusion: 'success' }],
          },
        ],
      },
    });
    getWorkflowRun.mockResolvedValue({
      data: {
        status: 'completed',
        created_at: '2026-07-11T18:01:49Z',
        run_started_at: '2026-07-11T18:33:44Z',
        updated_at: '2026-07-11T18:57:06Z',
      },
    });

    const result = await fetchWorkflowTiming('token', context);

    const minMaxAcrossJobsMs = Date.parse('2026-07-11T18:57:05Z') - Date.parse('2026-07-11T18:01:54Z');
    const attemptDurationMs = Date.parse('2026-07-11T18:57:06Z') - Date.parse('2026-07-11T18:33:44Z');

    expect(result?.summary.workflowDurationMs).toBe(attemptDurationMs);
    expect(result?.summary.workflowDurationMs).toBeLessThan(minMaxAcrossJobsMs);
    expect(result?.summary.workflowDurationMs).toBe(1_402_000);
  });
});
