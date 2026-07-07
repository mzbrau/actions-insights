import { describe, expect, it } from 'vitest';
import { repositoryKeyFromName, repositoryNameFromKey } from '../../src/history-repo/models';

describe('history-models', () => {
  it('converts repository name to key and back', () => {
    expect(repositoryKeyFromName('my-org/my-project')).toBe('my-org.my-project');
    expect(repositoryNameFromKey('my-org.my-project')).toBe('my-org/my-project');
  });
});
