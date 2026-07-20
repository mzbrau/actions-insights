/** Minimal failure payload for AI-agent handoff prompts. */
export interface AiAgentFailureInput {
  fullName: string;
  message?: string;
  stackTrace?: string;
  stdout?: string;
  stderr?: string;
  durationMs?: number;
  assembly?: string;
  isNewFailure?: boolean;
  traits?: string[];
  retries?: number;
}

/** Run-level context included in AI-agent handoff prompts. */
export interface AiAgentContextInput {
  repository?: string;
  branch?: string;
  workflow?: string;
  pullRequestUrl?: string;
  workflowRunUrl?: string;
  commitShortSha?: string;
  commitMessage?: string;
  author?: string;
  passed?: number;
  failed?: number;
  skipped?: number;
}

export interface FormatAiAgentInstructionsOptions {
  /** Cap how many failures are included; remaining count is noted. */
  maxFailures?: number;
  /** Truncate stack / stdout / stderr to this many lines when set. */
  maxStackTraceLines?: number;
  includeStdout?: boolean;
  includeStderr?: boolean;
}

function truncateLines(text: string, maxLines: number): string {
  const lines = text.split(/\r?\n/);
  if (lines.length <= maxLines) return text;
  return `${lines.slice(0, maxLines).join('\n')}\n… (${lines.length - maxLines} more lines)`;
}

function formatDurationMs(durationMs: number): string {
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  if (durationMs < 60_000) return `${(durationMs / 1000).toFixed(2)}s`;
  const minutes = Math.floor(durationMs / 60_000);
  const seconds = ((durationMs % 60_000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

function appendBlock(lines: string[], label: string, value: string | undefined, maxLines?: number): void {
  if (!value?.trim()) return;
  const body = maxLines !== undefined ? truncateLines(value, maxLines) : value;
  lines.push(`${label}:`);
  lines.push(body);
  lines.push('');
}

/**
 * Build a plain-text prompt summarizing failed tests for handoff to an AI agent.
 * Used by PR comments, job summaries, HTML reports, and the React dashboard.
 */
export function formatAiAgentInstructions(
  failures: AiAgentFailureInput[],
  context: AiAgentContextInput = {},
  options: FormatAiAgentInstructionsOptions = {},
): string {
  const includeStdout = options.includeStdout !== false;
  const includeStderr = options.includeStderr !== false;
  const maxLines = options.maxStackTraceLines;
  const maxFailures = options.maxFailures;
  const shown =
    maxFailures !== undefined && maxFailures >= 0
      ? failures.slice(0, maxFailures)
      : failures;
  const remaining = failures.length - shown.length;

  const lines: string[] = [
    'Investigate and fix the following failing tests from a CI run.',
    '',
    '## Run context',
  ];

  if (context.repository) lines.push(`- Repository: ${context.repository}`);
  if (context.branch) lines.push(`- Branch: ${context.branch}`);
  if (context.workflow) lines.push(`- Workflow: ${context.workflow}`);
  if (context.pullRequestUrl) lines.push(`- Pull request: ${context.pullRequestUrl}`);
  if (context.workflowRunUrl) lines.push(`- Workflow run: ${context.workflowRunUrl}`);
  if (context.commitShortSha || context.commitMessage) {
    const commit = [context.commitShortSha, context.commitMessage].filter(Boolean).join(' — ');
    lines.push(`- Commit: ${commit}`);
  }
  if (context.author) lines.push(`- Author: ${context.author}`);

  const counts = [
    context.passed !== undefined ? `${context.passed} passed` : undefined,
    context.failed !== undefined ? `${context.failed} failed` : undefined,
    context.skipped !== undefined ? `${context.skipped} skipped` : undefined,
  ].filter(Boolean);
  if (counts.length > 0) {
    lines.push(`- Results: ${counts.join(', ')}`);
  }

  lines.push('');
  lines.push(`## Failed tests (${failures.length})`);
  lines.push('');

  for (const failure of shown) {
    lines.push(`### ${failure.fullName}`);

    const meta: string[] = [];
    if (failure.durationMs !== undefined) {
      meta.push(`Duration: ${formatDurationMs(failure.durationMs)}`);
    }
    if (failure.isNewFailure) meta.push('New failure: yes');
    if (failure.assembly) meta.push(`Project: ${failure.assembly}`);
    if (failure.traits && failure.traits.length > 0) {
      meta.push(`Traits: ${failure.traits.join(', ')}`);
    }
    if (failure.retries !== undefined && failure.retries > 0) {
      meta.push(`Retries: ${failure.retries}`);
    }
    for (const item of meta) {
      lines.push(`- ${item}`);
    }
    if (meta.length > 0) lines.push('');

    appendBlock(lines, 'Message', failure.message, maxLines);
    appendBlock(lines, 'Stack trace', failure.stackTrace, maxLines);
    if (includeStdout) appendBlock(lines, 'Stdout', failure.stdout, maxLines);
    if (includeStderr) appendBlock(lines, 'Stderr', failure.stderr, maxLines);
  }

  if (remaining > 0) {
    lines.push(
      `…and ${remaining} additional failed test${remaining === 1 ? '' : 's'} not listed above.`,
      '',
    );
  }

  lines.push('Locate each test in the codebase, determine the root cause, and implement a fix.');
  return lines.join('\n').trimEnd() + '\n';
}
