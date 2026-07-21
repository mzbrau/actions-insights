import { useMemo, useState } from 'react';
import {
  formatAiAgentInstructions,
  type AiAgentFailureInput,
  type CompactTestRecord,
  type FailureRecord,
  type NormalizedRunRecord,
} from '@actions-insights/history-models';
import { copyTextToClipboard } from '../../utils/clipboard';

interface AiAgentInstructionsProps {
  run: NormalizedRunRecord;
}

function enrichFailures(
  failures: FailureRecord[],
  tests: CompactTestRecord[],
): AiAgentFailureInput[] {
  const byName = new Map(tests.map((t) => [t.n, t]));
  return failures.map((f) => {
    const test = byName.get(f.fullName);
    return {
      fullName: f.fullName,
      message: f.message,
      stackTrace: f.stackTrace,
      stdout: f.stdout,
      stderr: f.stderr,
      durationMs: test?.d,
      assembly: test?.a,
      isNewFailure: test?.nf,
    };
  });
}

export function AiAgentInstructions({ run }: AiAgentInstructionsProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const prompt = useMemo(() => {
    const failures = enrichFailures(run.failures, run.tests);
    return formatAiAgentInstructions(failures, {
      repository: run.context.repository,
      branch: run.context.branch,
      workflow: run.context.workflow,
      pullRequestUrl: run.links.prUrl ?? run.context.prUrl,
      workflowRunUrl: run.links.workflowUrl,
      commitShortSha: run.context.commitShortSha,
      commitMessage: run.context.commitMessage,
      author: run.context.author,
      passed: run.stats.passed,
      failed: run.stats.failed,
      skipped: run.stats.skipped,
    });
  }, [run]);

  if (run.failures.length === 0) return null;

  return (
    <details className="ai-agent-details">
      <summary>Instructions for an AI agent</summary>
      <pre className="ai-agent-prompt">{prompt.trimEnd()}</pre>
      <button
        type="button"
        className="copy-btn ai-agent-copy-btn"
        onClick={async () => {
          setCopyError(false);
          const ok = await copyTextToClipboard(prompt.trimEnd());
          if (!ok) {
            setCopyError(true);
            return;
          }
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      {copyError && (
        <p className="muted ai-agent-copy-error">
          Could not copy. Select the text above and copy manually.
        </p>
      )}
    </details>
  );
}
