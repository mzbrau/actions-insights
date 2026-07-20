import type { TestCase } from '../model/test-case';
import type { TestRun } from '../model/test-run';
import {
  formatAiAgentInstructions,
  type AiAgentContextInput,
  type AiAgentFailureInput,
  type FormatAiAgentInstructionsOptions,
} from '@actions-insights/history-models';
import { fenceCode } from './truncate';

export function toAiAgentFailureInput(test: TestCase): AiAgentFailureInput {
  return {
    fullName: test.fullName,
    message: test.message,
    stackTrace: test.stackTrace,
    stdout: test.stdout,
    stderr: test.stderr,
    durationMs: test.durationMs,
    assembly: test.assembly,
    isNewFailure: test.isNewFailure,
    traits: test.traits.length > 0 ? test.traits : undefined,
    retries: test.retries > 0 ? test.retries : undefined,
  };
}

export function toAiAgentContextInput(
  run: TestRun,
  counts?: { passed?: number; failed?: number; skipped?: number },
): AiAgentContextInput {
  const { context, stats } = run;
  return {
    repository: context.repository,
    branch: context.branch,
    workflow: context.workflow,
    commitShortSha: context.commitShortSha,
    commitMessage: context.commitMessage,
    author: context.author,
    passed: counts?.passed ?? stats.passed,
    failed: counts?.failed ?? stats.failed,
    skipped: counts?.skipped ?? stats.skipped,
  };
}

/** Markdown `<details>` block with a fenced code body for GitHub native copy. */
export function formatAiAgentMarkdownSection(
  failures: TestCase[],
  run: TestRun,
  options: FormatAiAgentInstructionsOptions = {},
  counts?: { passed?: number; failed?: number; skipped?: number },
): string {
  if (failures.length === 0) return '';

  const prompt = formatAiAgentInstructions(
    failures.map(toAiAgentFailureInput),
    toAiAgentContextInput(run, counts),
    options,
  );

  return [
    '<details>',
    '<summary>Instructions for an AI agent</summary>',
    '',
    fenceCode(prompt.trimEnd()),
    '',
    '</details>',
    '',
  ].join('\n');
}
