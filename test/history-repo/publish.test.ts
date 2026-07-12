import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as childProcess from 'child_process';
import { sampleRun } from '../reporting/fixtures';
import { defaultLocalConfig } from '../../scripts/default-config';

vi.mock('child_process', () => ({
  execFileSync: vi.fn(),
}));

function historyConfig() {
  return defaultLocalConfig({
    history: {
      enabled: true,
      repository: 'org/history',
      token: 'test-token',
      branch: 'main',
      dataPath: 'data',
      repositoryName: 'owner/repo',
      mode: 'multi',
    },
  });
}

function setupCloneAndStatusMock(): void {
  vi.mocked(childProcess.execFileSync).mockImplementation((cmd, args) => {
    const gitArgs = args as string[];
    if (gitArgs[0] === 'clone') {
      const target = gitArgs[gitArgs.length - 1] as string;
      const fs = require('fs') as typeof import('fs');
      const path = require('path') as typeof import('path');
      fs.mkdirSync(path.join(target, 'data'), { recursive: true });
    }
    if (gitArgs[0] === 'status') return 'M data/repositories.json\n';
    return '';
  });
}

function gitCalls(): string[][] {
  return vi.mocked(childProcess.execFileSync).mock.calls.map((call) => call[1] as string[]);
}

describe('publishToHistoryRepository', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(childProcess.execFileSync).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips when history is disabled', async () => {
    const { publishToHistoryRepository } = await import('../../src/history-repo/publish');
    const config = defaultLocalConfig();
    await publishToHistoryRepository(sampleRun, config);
    expect(childProcess.execFileSync).not.toHaveBeenCalled();
  });

  it('skips when token is missing', async () => {
    const { publishToHistoryRepository } = await import('../../src/history-repo/publish');
    const config = defaultLocalConfig({
      history: {
        enabled: true,
        repository: 'org/history',
        token: '',
        branch: 'main',
        dataPath: 'data',
        repositoryName: 'owner/repo',
        mode: 'multi',
      },
    });
    await publishToHistoryRepository(sampleRun, config);
    expect(childProcess.execFileSync).not.toHaveBeenCalled();
  });

  it('invokes git when history publish is configured', async () => {
    setupCloneAndStatusMock();

    const { publishToHistoryRepository } = await import('../../src/history-repo/publish');
    await publishToHistoryRepository(sampleRun, historyConfig());

    expect(childProcess.execFileSync).toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['clone']),
      expect.any(Object),
    );
    expect(childProcess.execFileSync).toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['commit']),
      expect.any(Object),
    );
  });

  it('retries after rebase failure and succeeds on the next attempt', async () => {
    vi.useFakeTimers();
    setupCloneAndStatusMock();

    let pullRebaseCalls = 0;
    vi.mocked(childProcess.execFileSync).mockImplementation((cmd, args) => {
      const gitArgs = args as string[];
      if (gitArgs[0] === 'clone') {
        const target = gitArgs[gitArgs.length - 1] as string;
        const fs = require('fs') as typeof import('fs');
        const path = require('path') as typeof import('path');
        fs.mkdirSync(path.join(target, 'data'), { recursive: true });
      }
      if (gitArgs[0] === 'status') return 'M data/repositories.json\n';
      if (gitArgs[0] === 'pull' && gitArgs[1] === '--rebase') {
        pullRebaseCalls += 1;
        if (pullRebaseCalls === 1) {
          throw new Error('could not apply commit');
        }
      }
      return '';
    });

    const { publishToHistoryRepository } = await import('../../src/history-repo/publish');
    const publishPromise = publishToHistoryRepository(sampleRun, historyConfig());
    await vi.runAllTimersAsync();
    await publishPromise;

    expect(pullRebaseCalls).toBe(2);
    expect(gitCalls().filter((args) => args[0] === 'clone')).toHaveLength(2);
    expect(gitCalls().some((args) => args[0] === 'rebase' && args[1] === '--abort')).toBe(true);
  });

  it('re-clones before retrying pull --rebase', async () => {
    vi.useFakeTimers();
    setupCloneAndStatusMock();

    let pullRebaseCalls = 0;
    vi.mocked(childProcess.execFileSync).mockImplementation((cmd, args) => {
      const gitArgs = args as string[];
      if (gitArgs[0] === 'clone') {
        const target = gitArgs[gitArgs.length - 1] as string;
        const fs = require('fs') as typeof import('fs');
        const path = require('path') as typeof import('path');
        fs.mkdirSync(path.join(target, 'data'), { recursive: true });
      }
      if (gitArgs[0] === 'status') return 'M data/repositories.json\n';
      if (gitArgs[0] === 'pull' && gitArgs[1] === '--rebase') {
        pullRebaseCalls += 1;
        if (pullRebaseCalls === 1) {
          throw new Error('already a rebase-merge directory');
        }
      }
      return '';
    });

    const { publishToHistoryRepository } = await import('../../src/history-repo/publish');
    const publishPromise = publishToHistoryRepository(sampleRun, historyConfig());
    await vi.runAllTimersAsync();
    await publishPromise;

    const cloneIndices = gitCalls()
      .map((args, index) => (args[0] === 'clone' ? index : -1))
      .filter((index) => index >= 0);
    const abortIndex = gitCalls().findIndex((args) => args[0] === 'rebase' && args[1] === '--abort');
    const secondPullIndex = gitCalls().findIndex(
      (args, index) =>
        index > cloneIndices[1] && args[0] === 'pull' && args[1] === '--rebase',
    );

    expect(cloneIndices).toHaveLength(2);
    expect(abortIndex).toBeGreaterThan(-1);
    expect(secondPullIndex).toBeGreaterThan(cloneIndices[1]);
  });

  it('throws after exhausting all retry attempts', async () => {
    vi.useFakeTimers();
    setupCloneAndStatusMock();

    vi.mocked(childProcess.execFileSync).mockImplementation((cmd, args) => {
      const gitArgs = args as string[];
      if (gitArgs[0] === 'clone') {
        const target = gitArgs[gitArgs.length - 1] as string;
        const fs = require('fs') as typeof import('fs');
        const path = require('path') as typeof import('path');
        fs.mkdirSync(path.join(target, 'data'), { recursive: true });
      }
      if (gitArgs[0] === 'status') return 'M data/repositories.json\n';
      if (gitArgs[0] === 'pull' && gitArgs[1] === '--rebase') {
        throw new Error('could not apply commit');
      }
      return '';
    });

    const { publishToHistoryRepository } = await import('../../src/history-repo/publish');
    const publishPromise = publishToHistoryRepository(sampleRun, historyConfig());
    const expectation = expect(publishPromise).rejects.toThrow('could not apply commit');
    await vi.runAllTimersAsync();
    await expectation;

    expect(gitCalls().filter((args) => args[0] === 'clone')).toHaveLength(3);
    expect(gitCalls().filter((args) => args[0] === 'pull' && args[1] === '--rebase')).toHaveLength(3);
  });
});
