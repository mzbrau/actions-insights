import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CoverageTrendChart } from './CoverageTrendChart';
import { DiagnosticsTrendChart } from './DiagnosticsTrendChart';
import { DonutChart } from './DonutChart';
import { DurationTrendChart } from './DurationTrendChart';
import { RunTrendsChart } from './RunTrendsChart';
import { StackedBarChart } from './StackedBarChart';
import { WorkflowDurationTrendChart } from './WorkflowDurationTrendChart';
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

describe('CoverageTrendChart', () => {
  it('renders empty state when no points', () => {
    render(<CoverageTrendChart points={[]} />);
    expect(screen.getByText('No coverage data')).toBeTruthy();
  });

  it('renders bar track and fill structure', () => {
    const { container } = render(
      <CoverageTrendChart
        points={[
          {
            runId: 'run-1',
            date: '2026-07-09T12:00:00.000Z',
            branchLabel: 'main',
            commitShortSha: 'abc1234',
            line: 75,
          },
        ]}
      />,
    );
    expect(container.querySelector('.duration-trend-bar-track')).toBeTruthy();
    expect(container.querySelector('.duration-trend-bar-fill')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('calls onBarClick with run id when a bar is clicked', () => {
    const onBarClick = vi.fn();
    render(
      <CoverageTrendChart
        points={[
          {
            runId: 'cov-run',
            date: '2026-07-09T12:00:00.000Z',
            branchLabel: 'main',
            commitShortSha: 'abc1234',
            line: 80,
          },
        ]}
        onBarClick={onBarClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /80\.0% line coverage/i }));
    expect(onBarClick).toHaveBeenCalledWith('cov-run');
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

describe('RunTrendsChart', () => {
  it('renders empty state when no runs', () => {
    const { container } = render(<RunTrendsChart runs={[]} />);
    expect(container.querySelector('.chart-empty')?.textContent).toBe('No run history yet');
  });

  it('renders bars and duration line for run history', () => {
    const { container } = render(
      <RunTrendsChart
        runs={[
          sampleRun({ runId: 'a', total: 10, durationMs: 5000 }),
          sampleRun({ runId: 'b', total: 8, durationMs: 8000, status: 'failed' }),
        ]}
      />,
    );
    expect(container.querySelectorAll('.run-trends-bar').length).toBe(2);
    expect(container.querySelector('.run-trends-duration-line')).toBeTruthy();
    expect(container.querySelectorAll('.run-trends-point').length).toBe(2);
  });

  it('applies passed and failed bar colors', () => {
    const { container } = render(
      <RunTrendsChart
        runs={[
          sampleRun({ runId: 'pass', status: 'passed' }),
          sampleRun({ runId: 'fail', status: 'failed' }),
        ]}
      />,
    );
    const bars = container.querySelectorAll('.run-trends-bar');
    expect(bars[0]?.getAttribute('fill')).toBe('#0a6e31');
    expect(bars[1]?.getAttribute('fill')).toBe('#ba1a1a');
  });

  it('shows date labels on the x-axis', () => {
    const { container } = render(
      <RunTrendsChart
        runs={[sampleRun({ date: '2026-07-09T12:00:00.000Z' })]}
      />,
    );
    expect(container.querySelectorAll('.run-trends-date-label').length).toBeGreaterThan(0);
    expect(container.querySelector('.run-trends-date-label')?.textContent).toBe('Jul 9');
  });

  it('calls onRunClick when a bar is clicked', () => {
    const onRunClick = vi.fn();
    const run = sampleRun({ runId: 'trend-click', date: '2026-07-09T12:00:00.000Z' });
    const { container } = render(<RunTrendsChart runs={[run]} onRunClick={onRunClick} />);
    const bar = container.querySelector('.run-trends-bar.clickable');
    expect(bar).toBeTruthy();
    fireEvent.click(bar!);
    expect(onRunClick).toHaveBeenCalledWith(run);
  });
});

describe('DiagnosticsTrendChart', () => {
  it('renders empty state when no points', () => {
    render(<DiagnosticsTrendChart points={[]} />);
    expect(screen.getByText('No diagnostic data')).toBeTruthy();
  });
});

describe('WorkflowDurationTrendChart', () => {
  it('renders workflow duration bars', () => {
    const { container } = render(
      <WorkflowDurationTrendChart
        points={[{
          runId: '1',
          date: '2026-07-09T12:00:00.000Z',
          branchLabel: 'main',
          commitShortSha: 'abc',
          workflowDurationMs: 120000,
          testDurationMs: 5000,
        }]}
      />,
    );
    expect(container.querySelector('.duration-trend-bar-fill')).toBeTruthy();
  });
});
