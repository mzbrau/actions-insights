import type { CoverageMetrics } from '@actions-insights/history-models';

interface CoverageProgressBarProps {
  label: string;
  value: number | undefined;
  variant?: 'line' | 'branch';
}

export function CoverageProgressBar({ label, value, variant = 'line' }: CoverageProgressBarProps) {
  if (value === undefined) return null;
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className="coverage-progress" role="group" aria-label={`${label} coverage`}>
      <div className="coverage-progress-header">
        <span className="coverage-progress-label">{label}</span>
        <span className="coverage-progress-value" aria-hidden="true">{pct.toFixed(1)}%</span>
      </div>
      <div
        className={`coverage-progress-track coverage-progress-${variant}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${label}: ${pct.toFixed(1)} percent`}
      >
        <div className="coverage-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function formatCoverageDelta(delta: number | undefined): string | null {
  if (delta === undefined) return null;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

export function coverageDeltaClass(delta: number | undefined): string {
  if (delta === undefined || Math.abs(delta) < 0.05) return 'neutral';
  return delta > 0 ? 'positive' : 'negative';
}

export function computeMetricsDelta(
  current: CoverageMetrics | undefined,
  previous: CoverageMetrics | undefined,
): { line?: number; branch?: number } {
  const result: { line?: number; branch?: number } = {};
  if (current?.line !== undefined && previous?.line !== undefined) {
    result.line = Math.round((current.line - previous.line) * 10) / 10;
  }
  if (current?.branch !== undefined && previous?.branch !== undefined) {
    result.branch = Math.round((current.branch - previous.branch) * 10) / 10;
  }
  return result;
}
