import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as childProcess from 'child_process';
import { sampleRun } from '../reporting/fixtures';
import { defaultLocalConfig } from '../../scripts/default-config';

vi.mock('child_process', () => ({
  execFileSync: vi.fn(),
}));

describe('publishToHistoryRepository', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(childProcess.execFileSync).mockReset();
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

    const { publishToHistoryRepository } = await import('../../src/history-repo/publish');
    const config = defaultLocalConfig({
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

    await publishToHistoryRepository(sampleRun, config);

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
});
