import { CHART_COLORS, maxValue } from '../../utils/chart';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ values, width = 120, height = 32, color = CHART_COLORS.passed }: SparklineProps) {
  if (values.length === 0) return null;

  const max = maxValue(values);
  const pad = 2;
  const step = (width - pad * 2) / Math.max(values.length - 1, 1);
  const barW = Math.max(2, step - 1);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {values.map((v, i) => {
        const barH = Math.max(2, (v / max) * (height - pad * 2));
        return (
          <rect
            key={i}
            x={pad + i * step}
            y={height - pad - barH}
            width={barW}
            height={barH}
            fill={color}
            rx={1}
            style={{ transition: 'height 0.3s ease' }}
          />
        );
      })}
    </svg>
  );
}
