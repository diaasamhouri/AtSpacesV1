"use client";

/* ---------- BarChart ---------- */
interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  colors?: [string, string]; // gradient from/to
  id?: string;
}

export function BarChart({ data, height = 192, colors = ["#14b8a6", "#f97316"], id = "bar" }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(100 / data.length - 2, 3);
  const gap = 100 / data.length;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height / 4 + 10}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[1]} stopOpacity="1" />
            <stop offset="100%" stopColor={colors[0]} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = (d.value / max) * (height / 4);
          const x = i * gap + (gap - barWidth) / 2;
          const y = height / 4 - barH;
          return (
            <g key={i} className="group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 0.5)}
                rx={barWidth > 4 ? 1.5 : 0.5}
                fill={`url(#${id}-grad)`}
                className="opacity-80 transition-opacity duration-200 hover:opacity-100"
              />
              <title>{`${d.label}: ${d.value}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-2 px-1">
        {data.length <= 14
          ? data.map((d, i) => (
              <span key={i} className="text-[10px] font-medium text-slate-500 truncate text-center" style={{ width: `${gap}%` }}>
                {d.label}
              </span>
            ))
          : [0, Math.floor(data.length / 2), data.length - 1].map((i) => (
              <span key={i} className="text-[10px] font-medium text-slate-500">
                {data[i]?.label}
              </span>
            ))}
      </div>
    </div>
  );
}

/* ---------- DonutChart ---------- */
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

export function DonutChart({ data, size = 160, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {data.map((segment, i) => {
          const pct = segment.value / total;
          const dashLength = pct * circumference;
          const dashOffset = -accumulated * circumference;
          accumulated += pct;
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="12"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className="transition-all duration-500"
            >
              <title>{`${segment.label}: ${segment.value}`}</title>
            </circle>
          );
        })}
        {centerValue !== undefined && (
          <>
            <text x="50" y="46" textAnchor="middle" className="fill-white text-[12px] font-extrabold">
              {centerValue}
            </text>
            {centerLabel && (
              <text x="50" y="58" textAnchor="middle" className="fill-slate-400 text-[6px] font-bold uppercase">
                {centerLabel}
              </text>
            )}
          </>
        )}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((segment, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {segment.label} <span className="text-gray-900 dark:text-white font-bold">{segment.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- MiniLineChart (sparkline) ---------- */
interface MiniLineChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function MiniLineChart({ data, color = "#14b8a6", height = 32, width = 80 }: MiniLineChartProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id={`mini-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#mini-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- ProgressBar ---------- */
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  sublabel?: string;
  colors?: [string, string];
}

export function ProgressBar({ value, max = 100, label, sublabel, colors = ["#14b8a6", "#f97316"] }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div>
      {(label || sublabel) && (
        <div className="flex justify-between text-sm mb-2 font-medium">
          <span className="text-slate-600 dark:text-slate-300">{label}</span>
          <span className="text-slate-500">
            {sublabel || `${value} (${pct.toFixed(0)}%)`}
          </span>
        </div>
      )}
      <div className="h-2.5 w-full rounded-full bg-dark-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
          }}
        />
      </div>
    </div>
  );
}
