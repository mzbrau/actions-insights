import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DonutChart } from './DonutChart';
import { StackedBarChart } from './StackedBarChart';

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
