import { describe, expect, it } from 'vitest';
import { buildHistoryRunUrl, normalizePagesBaseUrl, resolveHistoryPagesBaseUrl } from '../../src/history-repo/dashboard-url';

describe('history-repo dashboard-url', () => {
  it('normalizePagesBaseUrl ensures trailing slash', () => {
    expect(normalizePagesBaseUrl('https://example.com/foo')).toBe('https://example.com/foo/');
    expect(normalizePagesBaseUrl('https://example.com/foo/')).toBe('https://example.com/foo/');
  });

  it('buildHistoryRunUrl builds a URL for a PR run', () => {
    const url = buildHistoryRunUrl(
      'https://my-org.github.io/test-history/',
      'owner/repo',
      {
        repository: 'owner/repo',
        repositoryUrl: 'https://github.com/owner/repo',
        workflow: 'CI',
        workflowUrl: 'https://github.com/owner/repo/actions/runs/1',
        runId: 1,
        runAttempt: 1,
        branch: 'main',
        ref: 'refs/heads/main',
        prNumber: 42,
        prUrl: 'https://github.com/owner/repo/pull/42',
        commitSha: 'abc',
        commitShortSha: 'abc',
        commitMessage: 'msg',
        commitUrl: 'https://github.com/owner/repo/commit/abc',
        author: 'octocat',
        actor: 'octocat',
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:01:00.000Z',
      },
      '1',
    );
    expect(url).toBe('https://my-org.github.io/test-history/#/r/owner.repo/b/pr-42/run/1');
  });

  it('resolveHistoryPagesBaseUrl prefers explicit history-pages-url', async () => {
    const base = await resolveHistoryPagesBaseUrl({
      enabled: true,
      repository: 'my-org/test-history',
      token: '',
      pagesUrl: 'https://history.example.com/test-history',
      branch: 'main',
      dataPath: 'data',
      repositoryName: 'owner/repo',
      mode: 'multi',
    });
    expect(base).toBe('https://history.example.com/test-history/');
  });

  it('resolveHistoryPagesBaseUrl falls back to convention when API is unavailable', async () => {
    const base = await resolveHistoryPagesBaseUrl({
      enabled: true,
      repository: 'my-org/test-history',
      token: '',
      branch: 'main',
      dataPath: 'data',
      repositoryName: 'owner/repo',
      mode: 'multi',
    });
    expect(base).toBe('https://my-org.github.io/test-history/');
  });
});

