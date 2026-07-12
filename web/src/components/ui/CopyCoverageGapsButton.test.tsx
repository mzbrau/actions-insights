import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CopyCoverageGapsButton } from './CopyCoverageGapsButton';
import type { CoverageGapsScope } from '../../utils/coverageDisplay';

const scope: CoverageGapsScope = {
  title: 'MyApp',
  lineCoverage: 50,
  files: [{ path: 'src/A.cs', metrics: { line: 10 } }],
  methodsByFile: new Map([
    ['src/A.cs', [{ label: 'Run()', metrics: { line: 0 } }]],
  ]),
};

describe('CopyCoverageGapsButton', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
      this.open = false;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens dialog in document.body when clicked inside a summary', async () => {
    render(
      <details open>
        <summary>
          <CopyCoverageGapsButton scope={scope} />
        </summary>
      </details>,
    );

    fireEvent.click(screen.getByRole('button', { name: /copy gaps/i }));

    await waitFor(() => {
      expect(document.body.querySelector('.coverage-gaps-dialog')).toBeTruthy();
      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
    expect(document.querySelector('summary')?.querySelector('.coverage-gaps-dialog')).toBeNull();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/Copy coverage gaps/i)).toBeTruthy();
  });

  it('keeps dialog open under React StrictMode remount', async () => {
    render(
      <StrictMode>
        <CopyCoverageGapsButton scope={scope} />
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole('button', { name: /copy gaps/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });
});
