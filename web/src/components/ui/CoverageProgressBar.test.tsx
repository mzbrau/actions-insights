import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CoverageProgressBar } from './CoverageProgressBar';

describe('CoverageProgressBar', () => {
  it('renders accessible progress bar with percentage', () => {
    render(<CoverageProgressBar label="Line" value={82.5} variant="line" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('82.5');
    expect(screen.getByText('82.5%')).toBeTruthy();
  });

  it('returns null when value is undefined', () => {
    const { container } = render(<CoverageProgressBar label="Line" value={undefined} />);
    expect(container.firstChild).toBeNull();
  });
});
