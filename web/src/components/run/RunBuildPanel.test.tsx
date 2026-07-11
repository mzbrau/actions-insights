import { fireEvent, render, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DiagnosticRunRecord, RunSummary } from '@actions-insights/history-models';
import { RunBuildPanel } from './RunBuildPanel';

const runSummary = { runId: '1' } as RunSummary;

const diagnosticsDetail: DiagnosticRunRecord = {
  version: 2,
  runId: '1',
  summary: { errors: 2, warnings: 2, notes: 1 },
  items: [
    { s: 0, m: 'Missing symbol', p: 0, l: 10, r: 'CS0103' },
    { s: 1, m: 'Unused variable', p: 0, l: 15, r: 'CS0168' },
    { s: 0, m: 'Type mismatch', p: 1, l: 5, r: 'TS2322' },
    { s: 1, m: 'Deprecated API', p: 1, l: 20, r: 'CS0618' },
    { s: 2, m: 'Declared here', p: 1, l: 1 },
  ],
  paths: ['src/Program.cs', 'src/Helper.cs'],
  sourceFiles: ['build.log'],
};

describe('RunBuildPanel diagnostics', () => {
  it('renders file list with error and warning badges', () => {
    const { container } = render(
      <RunBuildPanel
        runSummary={runSummary}
        diagnosticsSummary={{ errors: 2, warnings: 2, notes: 1 }}
        diagnosticsDetail={diagnosticsDetail}
        timingDetail={null}
        detailLoading={false}
        onRequestDetail={vi.fn()}
      />,
    );

    const view = within(container);
    expect(view.getAllByText('1E').length).toBeGreaterThan(0);
    expect(view.getAllByText('1W').length).toBeGreaterThan(0);
    expect(view.getByRole('option', { name: /src\/Program\.cs/i })).toBeTruthy();
    expect(view.getByRole('option', { name: /src\/Helper\.cs/i })).toBeTruthy();
  });

  it('shows selected file diagnostics in detail panel', () => {
    const { container } = render(
      <RunBuildPanel
        runSummary={runSummary}
        diagnosticsSummary={{ errors: 2, warnings: 2, notes: 1 }}
        diagnosticsDetail={diagnosticsDetail}
        timingDetail={null}
        detailLoading={false}
        onRequestDetail={vi.fn()}
      />,
    );

    const view = within(container);

    fireEvent.click(view.getByRole('option', { name: /src\/Program\.cs/i }));
    expect(view.getByText('Missing symbol')).toBeTruthy();
    expect(view.getByText('Unused variable')).toBeTruthy();
    expect(view.queryByText('Type mismatch')).toBeNull();

    fireEvent.click(view.getByRole('option', { name: /src\/Helper\.cs/i }));
    expect(view.getByText('Type mismatch')).toBeTruthy();
    expect(view.queryByText('Missing symbol')).toBeNull();
  });
});
