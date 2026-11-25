"use client";

import { formatPeso } from "@/features/sales-tracker/lib/money";

import type { Bucket } from "../lib/progress";
import { formatAxisPeso, niceTicks } from "../lib/progress";
import { bandAt, ChartTooltip, TooltipRow, useActiveIndex, useWidth } from "./chart-parts";

const TOP = 12;
const BOTTOM = 26;
const RIGHT = 8;

const linePath = (xs: number[], ys: number[]) => xs.map((x, index) => `${index ? "L" : "M"}${x},${ys[index]}`).join("");

/**
 * Cumulative revenue of this period (`--chart-1`, with a 10% wash) against the previous one
 * (`--chart-2`), bucket by bucket on one axis. A crosshair snaps to the nearest bucket and the
 * tooltip lists both series.
 */
export function PaceChart({
  current,
  previous,
  buckets,
  previousBuckets,
  height = 240,
}: {
  current: number[];
  previous: number[];
  buckets: Bucket[];
  previousBuckets: Bucket[];
  height?: number;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const count = buckets.length;
  const { active, setActive, focusProps } = useActiveIndex(count);

  const ticks = niceTicks(Math.max(0, ...current, ...previous));
  const top = ticks[ticks.length - 1];
  const left = Math.max(...ticks.map((tick) => formatAxisPeso(tick, top).length)) * 6.6 + 8;
  const plotWidth = Math.max(0, width - left - RIGHT);
  const plotHeight = height - TOP - BOTTOM;
  const step = count > 1 ? plotWidth / (count - 1) : 0;
  const xs = buckets.map((_, index) => left + step * index);
  const y = (value: number) => TOP + plotHeight - (value / top) * plotHeight;
  const currentYs = current.map(y);
  const previousYs = previous.map(y);
  const baseline = y(0);

  const labelStep = Math.max(1, Math.ceil((count * 52) / Math.max(plotWidth, 1)));
  const last = count - 1;
  const focus = active ?? null;

  return (
    <div ref={ref} className="relative min-w-0" style={{ height }}>
      {width > 0 && count > 1 && (
        <svg
          role="img"
          aria-label={`Running revenue: ${formatPeso(current[last] ?? 0)} this period, ${formatPeso(previous[last] ?? 0)} by the same point last period`}
          width={width}
          height={height}
          className="block touch-pan-y overflow-visible rounded-control outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          onPointerMove={(event) =>
            setActive(bandAt(event.clientX + step / 2, event.currentTarget, left, step || 1, count))
          }
          {...focusProps}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={left} x2={width - RIGHT} y1={y(tick)} y2={y(tick)} className="stroke-border" strokeWidth={1} />
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
          {buckets.map(
            (bucket, index) =>
              (last - index) % labelStep === 0 && (
                <text
                  key={bucket.from}
                  x={xs[index]}
                  y={height - 6}
                  textAnchor={index === last ? "end" : index === 0 ? "start" : "middle"}
                  className="fill-muted-foreground text-micro"
                >
                  {bucket.short}
                </text>
              ),
          )}

          <path
            d={`${linePath(xs, currentYs)}L${xs[last]},${baseline}L${xs[0]},${baseline}Z`}
            className="fill-chart-1 opacity-10"
          />
          <path
            d={linePath(xs, previousYs)}
            fill="none"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-chart-2"
          />
          <path
            d={linePath(xs, currentYs)}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-chart-1"
          />

          {focus !== null && (
            <line
              x1={xs[focus]}
              x2={xs[focus]}
              y1={TOP}
              y2={baseline}
              strokeWidth={1}
              className="stroke-muted-foreground"
            />
          )}
          {focus !== null && (
            <circle cx={xs[focus]} cy={previousYs[focus]} r={4} strokeWidth={2} className="fill-chart-2 stroke-card" />
          )}
          <circle
            cx={xs[focus ?? last]}
            cy={currentYs[focus ?? last]}
            r={4.5}
            strokeWidth={2}
            className="fill-chart-1 stroke-card"
          />
        </svg>
      )}
      {focus !== null && (
        <ChartTooltip x={xs[focus]} width={width}>
          <TooltipRow swatch="bg-chart-1" value={formatPeso(current[focus])} label={`by ${buckets[focus].long}`} />
          <TooltipRow
            swatch="bg-chart-2"
            value={formatPeso(previous[focus])}
            label={`by ${previousBuckets[focus].long}`}
          />
        </ChartTooltip>
      )}
    </div>
  );
}

/** Line keys for the two pace series, mirroring their strokes (solid and dashed). */
export const PaceLegend = () => (
  <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-label text-muted-foreground">
    <li className="flex items-center gap-2">
      <svg aria-hidden="true" width="18" height="4" className="overflow-visible">
        <line x1="1" x2="17" y1="2" y2="2" strokeWidth={2} strokeLinecap="round" className="stroke-chart-1" />
      </svg>
      This period
    </li>
    <li className="flex items-center gap-2">
      <svg aria-hidden="true" width="18" height="4" className="overflow-visible">
        <line
          x1="1"
          x2="17"
          y1="2"
          y2="2"
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinecap="round"
          className="stroke-chart-2"
        />
      </svg>
      Previous period
    </li>
  </ul>
);
