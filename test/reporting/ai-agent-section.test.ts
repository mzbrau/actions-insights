import { describe, expect, it } from 'vitest';
import { formatAiAgentInstructions } from '@actions-insights/history-models';
import { formatAiAgentMarkdownSection } from '../../src/reporting/ai-agent-section';
import { sampleRun } from './fixtures';

describe('formatAiAgentInstructions', () => {
  it('builds a prompt with context and failure details', () => {
    const text = formatAiAgentInstructions(
      [
        {
          fullName: 'SampleTests.ShouldFail',
          message: 'Expected true but was false',
          stackTrace: 'at SampleTests.ShouldFail() in SampleTests.cs:line 42',
          durationMs: 1500,
          assembly: 'SampleTests.dll',
          isNewFailure: true,
        },
      ],
      {
        repository: 'acme/demo',
        branch: 'main',
        workflow: 'CI',
        pullRequestUrl: 'https://github.com/acme/demo/pull/42',
        workflowRunUrl: 'https://github.com/acme/demo/actions/runs/99',
        commitShortSha: 'abc1234',
        commitMessage: 'Fix tests',
        author: 'dev',
        passed: 1,
        failed: 1,
        skipped: 0,
      },
    );

    expect(text).toContain('Investigate and fix the following failing tests');
    expect(text).toContain('- Repository: acme/demo');
    expect(text).toContain('- Branch: main');
    expect(text).toContain('- Pull request: https://github.com/acme/demo/pull/42');
    expect(text).toContain('- Workflow run: https://github.com/acme/demo/actions/runs/99');
    expect(text).toContain('- Results: 1 passed, 1 failed, 0 skipped');
    expect(text).toContain('### SampleTests.ShouldFail');
    expect(text).toContain('- Duration: 1.50s');
    expect(text).toContain('- New failure: yes');
    expect(text).toContain('- Project: SampleTests.dll');
    expect(text).toContain('Message:');
    expect(text).toContain('Expected true but was false');
    expect(text).toContain('Stack trace:');
    expect(text).toContain('Locate each test in the codebase');
  });

  it('omits pull request when not provided but still includes workflow run', () => {
    const text = formatAiAgentInstructions(
      [{ fullName: 'A.One', message: 'm1' }],
      {
        workflowRunUrl: 'https://github.com/acme/demo/actions/runs/99',
      },
    );

    expect(text).toContain('- Workflow run: https://github.com/acme/demo/actions/runs/99');
    expect(text).not.toContain('- Pull request:');
  });

  it('respects maxFailures and stdout/stderr flags', () => {
    const text = formatAiAgentInstructions(
      [
        { fullName: 'A.One', message: 'm1', stdout: 'out1', stderr: 'err1' },
        { fullName: 'A.Two', message: 'm2' },
      ],
      {},
      { maxFailures: 1, includeStdout: false, includeStderr: false },
    );

    expect(text).toContain('### A.One');
    expect(text).not.toContain('### A.Two');
    expect(text).toContain('…and 1 additional failed test not listed above.');
    expect(text).not.toContain('Stdout:');
    expect(text).not.toContain('Stderr:');
  });

  it('truncates long stack traces when maxStackTraceLines is set', () => {
    const stack = Array.from({ length: 5 }, (_, i) => `line ${i + 1}`).join('\n');
    const text = formatAiAgentInstructions(
      [{ fullName: 'A.One', stackTrace: stack }],
      {},
      { maxStackTraceLines: 2 },
    );

    expect(text).toContain('line 1');
    expect(text).toContain('line 2');
    expect(text).toContain('… (3 more lines)');
    expect(text).not.toContain('line 5');
  });
});

describe('formatAiAgentMarkdownSection', () => {
  it('wraps the prompt in a details block with a fenced code body', () => {
    const failed = sampleRun.tests.filter((t) => t.outcome === 'failed');
    const md = formatAiAgentMarkdownSection(failed, sampleRun, { maxFailures: 10 });

    expect(md).toContain('<details>');
    expect(md).toContain('<summary>Instructions for an AI agent</summary>');
    expect(md).toContain('```');
    expect(md).toContain('SampleTests.ShouldFail');
    expect(md).toContain('- Pull request: https://github.com/owner/repo/pull/42');
    expect(md).toContain('- Workflow run: https://github.com/owner/repo/actions/runs/1');
    expect(md).toContain('</details>');
  });

  it('returns empty string when there are no failures', () => {
    expect(formatAiAgentMarkdownSection([], sampleRun)).toBe('');
  });
});
