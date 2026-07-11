import { coverageBarColor } from '../../utils/coverageDisplay';

interface CoverageMetricRowProps {
  label: string;
  value: number | undefined;
  title?: string;
  compact?: boolean;
}

export function CoverageMetricRow({ label, value, title, compact = false }: CoverageMetricRowProps) {
  if (value === undefined) return null;
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={`coverage-metric-row${compact ? ' coverage-metric-row--compact' : ''}`}>
      <span className="coverage-metric-row-label" title={title ?? label}>{label}</span>
      <div
        className="coverage-metric-row-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${label}: ${pct.toFixed(1)} percent`}
      >
        <div
          className="coverage-metric-row-fill"
          style={{ width: `${pct}%`, background: coverageBarColor(pct) }}
        />
      </div>
      <span className="coverage-metric-row-value">{pct.toFixed(1)}%</span>
    </div>
  );
}
