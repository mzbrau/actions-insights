import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  countGaps,
  formatCoverageGapsSummary,
  type CoverageGapsScope,
} from '../../utils/coverageDisplay';

const DEFAULT_THRESHOLD = 80;

interface CoverageGapsDialogProps {
  scope: CoverageGapsScope;
  onClose: () => void;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy copy
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

export function CoverageGapsDialog({ scope, onClose }: CoverageGapsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const dismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    try {
      dialog.showModal();
    } catch {
      // Ignore duplicate showModal (e.g. concurrent StrictMode effects).
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onCancel = (event: Event) => {
      event.preventDefault();
      dismiss();
    };

    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, [dismiss]);

  const clampedThreshold = Math.min(100, Math.max(0, threshold));
  const { fileCount, methodCount } = useMemo(
    () => countGaps(scope, clampedThreshold),
    [scope, clampedThreshold],
  );
  const summary = useMemo(
    () => formatCoverageGapsSummary(scope, clampedThreshold),
    [scope, clampedThreshold],
  );

  const handleCopy = async () => {
    setCopyError(false);
    const ok = await copyTextToClipboard(summary);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    setCopyError(true);
  };

  const dialog = (
    <dialog
      ref={dialogRef}
      className="coverage-gaps-dialog"
      onClick={(e) => {
        if (e.target === dialogRef.current) dismiss();
      }}
    >
      <div className="coverage-gaps-dialog-panel">
        <header className="coverage-gaps-dialog-header">
          <h3 className="coverage-gaps-dialog-title">Copy coverage gaps</h3>
          <button type="button" className="coverage-gaps-dialog-close" onClick={dismiss} aria-label="Close">
            ×
          </button>
        </header>

        <p className="muted coverage-gaps-dialog-desc">
          Copy a text summary of files and methods below the line-coverage threshold for use in test-generation prompts.
        </p>

        <label className="coverage-gaps-dialog-field">
          <span className="coverage-gaps-dialog-label">Line coverage threshold (%)</span>
          <input
            type="number"
            className="coverage-gaps-threshold-input"
            min={0}
            max={100}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number.parseInt(e.target.value, 10) || 0)}
          />
        </label>

        <p className="coverage-gaps-preview-count muted">
          {fileCount} file{fileCount === 1 ? '' : 's'}
          {methodCount > 0 ? `, ${methodCount} method${methodCount === 1 ? '' : 's'}` : ''} below {clampedThreshold}%
        </p>

        <pre className="coverage-gaps-preview" aria-label="Coverage gaps preview">{summary}</pre>

        {copyError && (
          <p className="coverage-gaps-copy-error" role="alert">
            Could not copy to clipboard. Select the preview text and copy manually.
          </p>
        )}

        <footer className="coverage-gaps-dialog-actions">
          <button type="button" className="btn" onClick={dismiss}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </footer>
      </div>
    </dialog>
  );

  return createPortal(dialog, document.body);
}
