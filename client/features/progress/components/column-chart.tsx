"use client";

import { formatPeso } from "@/features/sales-tracker/lib/money";
import { cn } from "@/lib/utils";

import { formatAxisPeso, niceTicks } from "../lib/progress";
import { bandAt, ChartTooltip, columnPath, TooltipRow, useActiveIndex, useWidth } from "./chart-parts";

export interface ColumnPoint {
  key: string;
  /** Axis label. */
  short: string;
  /** Tooltip heading. */
  long: string;
  value: number;
  /** Extra tooltip line, e.g. "3 entries". */
  detail?: string;
}

const TOP = 10;
const BOTTOM = 26;

/**
 * Single-series columns on one baseline, in `--chart-1`. Bars are at most 24px wide with a 4px rounded
 * top; the whole column band is the hover target. Axis labels thin out so they never collide.
 */
export function ColumnChart({
  points,
  height = 220,
  label,
}: {
  points: ColumnPoint[];
  height?: number;
  label: string;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const { active, setActive, focusProps } = useActiveIndex(points.length);

  const max = Math.max(0, ...points.map((point) => point.value));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const left = Math.max(...ticks.map((tick) => formatAxisPeso(tick, top).length)) * 6.6 + 8;
  const plotWidth = Math.max(0, width - left);
  const plotHeight = height - TOP - BOTTOM;
  const band = points.length ? plotWidth / points.length : 0;
  const barWidth = Math.max(2, Math.min(24, band - 2, band * 0.72));
  const y = (value: number) => TOP + plotHeight - (value / top) * plotHeight;

  // Keep the last label (today) and step back from it so labels never overlap.
  const labelStep = Math.max(1, Math.ceil((points.length * 52) / Math.max(plotWidth, 1)));
  const showLabel = (index: number) => (points.length - 1 - index) % labelStep === 0;

  const point = active !== null ? points[active] : null;

  return (
    <div ref={ref} className="relative min-w-0" style={{ height }}>
      {width > 0 && (
        <svg
          role="img"
          aria-label={label}
          width={width}
          height={height}
          className="block touch-pan-y overflow-visible rounded-control outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          onPointerMove={(event) => setActive(bandAt(event.clientX, event.currentTarget, left, band, points.length))}
          {...focusProps}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={left} x2={width} y1={y(tick)} y2={y(tick)} className="stroke-border" strokeWidth={1} />
              <text
                x={left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-micro tabular"
              >
                {formatAxisPeso(tick, top)}
              </text>
            </g>
          ))}
          {points.map((p, index) => {
            const x = left + band * index + (band - barWidth) / 2;
            const barHeight = (p.value / top) * plotHeight;
            return (
              <g key={p.key}>
                {active === index && (
                  <rect x={left + band * index} y={TOP} width={band} height={plotHeight} className="fill-muted" />
                )}
                {p.value > 0 && (
                  <path
                    d={columnPath(x, y(p.value), barWidth, barHeight)}
                    className={cn(
                      "fill-chart-1 transition-opacity duration-150",
                      active !== null && active !== index && "opacity-60",
                    )}
                  />
                )}
                {showLabel(index) && (
                  <text
                    x={left + band * index + band / 2}
                    y={height - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground text-micro"
                  >
                    {p.short}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {point && active !== null && (
        <ChartTooltip x={left + band * active + band / 2} width={width}>
          <div className="mb-1 font-medium text-foreground-2">{point.long}</div>
          <TooltipRow swatch="bg-chart-1" value={formatPeso(point.value)} label="revenue" />
          {point.detail && <div className="mt-0.5 text-muted-foreground">{point.detail}</div>}
        </ChartTooltip>
      )}
    </div>
  );
}
