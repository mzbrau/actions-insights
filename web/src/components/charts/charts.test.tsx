import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DonutChart } from './DonutChart';
import { DurationTrendChart } from './DurationTrendChart';
import { StackedBarChart } from './StackedBarChart';
import type { EnrichedRun } from '../../utils/repositoryRuns';

const sampleRun = (overrides: Partial<EnrichedRun> = {}): EnrichedRun => ({
  runId: 'run-1',
  workflowRunId: 12345,
  status: 'passed',
  date: '2026-07-09T12:00:00.000Z',
  durationMs: 10000,
  total: 10,
  passed: 10,
  failed: 0,
  skipped: 0,
  commitSha: 'abc',
  commitShortSha: 'abc1234',
  commitMessage: 'test',
  author: 'dev',
  runFile: 'run.json',
  branchKey: 'main',
  branchLabel: 'main',
  branchType: 'branch',
  ...overrides,
});

describe('DonutChart', () => {
  it('renders empty state when no data', () => {
    render(<DonutChart passed={0} failed={0} skipped={0} />);
    expect(screen.getByText('No test data')).toBeTruthy();
  });

  it('renders svg for test outcomes', () => {
    const { container } = render(<DonutChart passed={10} failed={2} skipped={1} />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelector('path')).toBeTruthy();
  });
});

describe('StackedBarChart', () => {
  it('renders empty state when no runs', () => {
    render(<StackedBarChart runs={[]} />);
    expect(screen.getByText('No run history yet')).toBeTruthy();
  });

  it('renders bars for run history', () => {
    const { container } = render(
      <StackedBarChart
        runs={[
          { runId: '1', passed: 10, failed: 2 },
          { runId: '2', passed: 8, failed: 0 },
        ]}
      />,
    );
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(0);
  });
});

describe('DurationTrendChart', () => {
  it('renders empty state when no runs', () => {
    render(<DurationTrendChart runs={[]} />);
    expect(screen.getByText('No duration data')).toBeTruthy();
  });

  it('shows branch labels when multiple branches are in view', () => {
    render(
      <DurationTrendChart
        runs={[
          sampleRun({ runId: 'a', branchLabel: 'main' }),
          sampleRun({ runId: 'b', branchLabel: 'feature/x', status: 'failed' }),
        ]}
        singleBranchView={false}
      />,
    );
    expect(screen.getByText('main')).toBeTruthy();
    expect(screen.getByText('feature/x')).toBeTruthy();
  });

  it('shows run id labels when a single branch is selected', () => {
    render(
      <DurationTrendChart
        runs={[sampleRun({ runId: 'run-abc' })]}
        singleBranchView
      />,
    );
    expect(screen.getByText('run-abc')).toBeTruthy();
  });

  it('calls onBarClick with the run when a bar is clicked', () => {
    const onBarClick = vi.fn();
    const run = sampleRun({ runId: 'click-me', branchLabel: 'click-me' });
    render(<DurationTrendChart runs={[run]} onBarClick={onBarClick} />);
    fireEvent.click(screen.getByRole('button', { name: /click-me/i }));
    expect(onBarClick).toHaveBeenCalledWith(run);
  });
});
