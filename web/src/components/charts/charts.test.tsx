import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CoverageTrendChart } from './CoverageTrendChart';
import { DiagnosticsTrendChart } from './DiagnosticsTrendChart';
import { DonutChart } from './DonutChart';
import { DurationTrendChart } from './DurationTrendChart';
import { RunTrendsChart } from './RunTrendsChart';
import { StackedBarChart } from './StackedBarChart';
import { WorkflowDurationTrendChart } from './WorkflowDurationTrendChart';
import { BUILD_PERFORMANCE_MAX_RUNS } from '../../utils/chart';
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
  const coverageRun = (overrides: Partial<EnrichedRun> = {}): EnrichedRun => ({
    ...sampleRun(overrides),
    coverage: {
      line: 75,
      projects: {
        'MyApp.Api': { line: 80 },
        'MyApp.Tests': { line: 60 },
      },
      ...overrides.coverage,
    },
  });

  it('renders empty state when no coverage runs', () => {
    render(<CoverageTrendChart runs={[]} />);
    expect(screen.getByText('No coverage data')).toBeTruthy();
  });

  it('renders SVG with overall and project polylines', () => {
    const { container } = render(
      <CoverageTrendChart
        runs={[
          coverageRun({ runId: 'run-1', date: '2026-07-09T12:00:00.000Z' }),
          coverageRun({ runId: 'run-2', date: '2026-07-10T12:00:00.000Z', coverage: { line: 80, projects: { 'MyApp.Api': { line: 85 }, 'MyApp.Tests': { line: 65 } } } }),
        ]}
      />,
    );
    expect(container.querySelector('.coverage-trend-svg')).toBeTruthy();
    expect(container.querySelectorAll('.coverage-trend-line').length).toBeGreaterThan(0);
    expect(container.querySelector('.coverage-trend-line--overall')).toBeTruthy();
  });

  it('overall line has thicker stroke than project lines', () => {
    const { container } = render(
      <CoverageTrendChart runs={[coverageRun()]} />,
    );
    const overall = container.querySelector('.coverage-trend-line--overall');
    const project = container.querySelector('.coverage-trend-line:not(.coverage-trend-line--overall)');
    expect(overall?.getAttribute('stroke-width')).toBe('3.5');
    expect(project?.getAttribute('stroke-width')).toBe('1.5');
  });

  it('legend lists overall and project names', () => {
    const { container } = render(<CoverageTrendChart runs={[coverageRun()]} />);
    const legend = container.querySelector('.coverage-trend-legend');
    expect(legend?.textContent).toMatch(/Application coverage/);
    expect(legend?.textContent).toMatch(/Api/);
    expect(legend?.textContent).toMatch(/Tests/);
  });

  it('clicking legend item hides the corresponding line', () => {
    const { container } = render(<CoverageTrendChart runs={[coverageRun()]} />);
    const apiButton = container.querySelector('[title="MyApp.Api"]');
    expect(apiButton).toBeTruthy();
    const linesBefore = container.querySelectorAll('.coverage-trend-line').length;
    fireEvent.click(apiButton!);
    const linesAfter = container.querySelectorAll('.coverage-trend-line').length;
    expect(linesAfter).toBeLessThan(linesBefore);
    expect(apiButton!.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows tooltip with series name and percentage on point hover', () => {
    const { container } = render(<CoverageTrendChart runs={[coverageRun()]} />);
    const point = container.querySelector('.coverage-trend-point');
    expect(point).toBeTruthy();
    fireEvent.mouseEnter(point!);
    expect(screen.getByRole('tooltip').textContent).toMatch(/Application coverage/);
    expect(screen.getByRole('tooltip').textContent).toMatch(/75\.0%/);
  });

  it('calls onPointClick with run id when a point is clicked', () => {
    const onPointClick = vi.fn();
    const { container } = render(
      <CoverageTrendChart runs={[coverageRun({ runId: 'cov-run' })]} onPointClick={onPointClick} />,
    );
    const point = container.querySelector('.coverage-trend-point.clickable');
    fireEvent.click(point!);
    expect(onPointClick).toHaveBeenCalledWith('cov-run');
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

  it('limits bars to BUILD_PERFORMANCE_MAX_RUNS and keeps the most recent runs', () => {
    const runs = Array.from({ length: BUILD_PERFORMANCE_MAX_RUNS + 5 }, (_, i) =>
      sampleRun({ runId: `run-${i}`, branchLabel: `branch-${i}` }),
    );
    const { container } = render(<DurationTrendChart runs={runs} />);
    expect(container.querySelectorAll('.duration-trend-bar')).toHaveLength(BUILD_PERFORMANCE_MAX_RUNS);
    expect(screen.queryByText('branch-0')).toBeNull();
    expect(screen.getByText(`branch-${BUILD_PERFORMANCE_MAX_RUNS + 4}`)).toBeTruthy();
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

  it('renders SVG with errors and warnings lines', () => {
    const { container } = render(
      <DiagnosticsTrendChart
        points={[
          {
            runId: 'run-1',
            date: '2026-07-09T12:00:00.000Z',
            branchLabel: 'main',
            commitShortSha: 'abc1234',
            errors: 1,
            warnings: 2,
          },
          {
            runId: 'run-2',
            date: '2026-07-10T12:00:00.000Z',
            branchLabel: 'main',
            commitShortSha: 'def5678',
            errors: 0,
            warnings: 3,
          },
        ]}
      />,
    );
    expect(container.querySelector('.coverage-trend-svg')).toBeTruthy();
    expect(container.querySelectorAll('.coverage-trend-line').length).toBe(2);
    expect(screen.getByText('Errors')).toBeTruthy();
    expect(screen.getByText('Warnings')).toBeTruthy();
  });

  it('calls onPointClick when a point is clicked', () => {
    const onPointClick = vi.fn();
    const { container } = render(
      <DiagnosticsTrendChart
        points={[{
          runId: 'run-1',
          date: '2026-07-09T12:00:00.000Z',
          branchLabel: 'main',
          commitShortSha: 'abc1234',
          errors: 1,
          warnings: 2,
        }]}
        onPointClick={onPointClick}
      />,
    );
    const point = container.querySelector('.coverage-trend-point.clickable');
    expect(point).toBeTruthy();
    fireEvent.click(point!);
    expect(onPointClick).toHaveBeenCalledWith('run-1');
  });
});

describe('WorkflowDurationTrendChart', () => {
  it('renders workflow duration line chart', () => {
    const { container } = render(
      <WorkflowDurationTrendChart
        points={[{
          runId: '1',
          date: '2026-07-09T12:00:00.000Z',
          branchLabel: 'main',
          commitShortSha: 'abc',
          workflowDurationMs: 120000,
        }]}
      />,
    );
    expect(container.querySelector('.coverage-trend-svg')).toBeTruthy();
    expect(container.querySelector('.coverage-trend-line')).toBeTruthy();
    expect(screen.getByText('Workflow run')).toBeTruthy();
  });

  it('calls onPointClick when a point is clicked', () => {
    const onPointClick = vi.fn();
    const { container } = render(
      <WorkflowDurationTrendChart
        points={[{
          runId: 'run-1',
          date: '2026-07-09T12:00:00.000Z',
          branchLabel: 'main',
          commitShortSha: 'abc1234',
          workflowDurationMs: 120000,
        }]}
        onPointClick={onPointClick}
      />,
    );
    const point = container.querySelector('.coverage-trend-point.clickable');
    expect(point).toBeTruthy();
    fireEvent.click(point!);
    expect(onPointClick).toHaveBeenCalledWith('run-1');
  });
});
