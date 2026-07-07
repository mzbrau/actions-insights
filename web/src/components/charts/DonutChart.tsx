import { buildDonutSegments } from '../../utils/chart';

interface DonutChartProps {
  passed: number;
  failed: number;
  skipped: number;
  inconclusive?: number;
  size?: number;
}

export function DonutChart({ passed, failed, skipped, inconclusive = 0, size = 160 }: DonutChartProps) {
  const segments = buildDonutSegments({ passed, failed, skipped, inconclusive });
  const total = passed + failed + skipped + inconclusive;

  if (total === 0) {
    return <p className="chart-empty">No test data</p>;
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.375;
  const innerR = size * 0.1875;
  let offset = 0;

  const paths = segments.map(({ value, color, label }) => {
    const pct = value / total;
    const angle = pct * 2 * Math.PI;
    const x1 = cx + r * Math.sin(offset);
    const y1 = cy - r * Math.cos(offset);
    offset += angle;
    const x2 = cx + r * Math.sin(offset);
    const y2 = cy - r * Math.cos(offset);
    const large = angle > Math.PI ? 1 : 0;
    return (
      <path
        key={label}
        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
        fill={color}
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Test outcome distribution">
      {paths}
      <circle cx={cx} cy={cy} r={innerR} fill="var(--surface-container-lowest)" />
    </svg>
  );
}
