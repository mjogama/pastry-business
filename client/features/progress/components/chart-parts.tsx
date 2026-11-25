"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Width of an element, tracked with a ResizeObserver. 0 until it has been measured (and on the server). */
export const useWidth = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
};

/** Where an arrow, Home or End key moves the active index; `undefined` for other keys. */
const keyMove = (key: string, count: number): ((index: number) => number) | undefined => {
  if (key === "ArrowRight") return (index) => Math.min(count - 1, index + 1);
  if (key === "ArrowLeft") return (index) => Math.max(0, index - 1);
  if (key === "Home") return () => 0;
  if (key === "End") return () => count - 1;
  return undefined;
};

/**
 * The hovered or focused data position. Arrow keys, Home and End move it while the chart has focus,
 * so every tooltip is reachable without a pointer.
 */
export const useActiveIndex = (count: number) => {
  const [active, setActive] = useState<number | null>(null);
  const onKeyDown = (event: KeyboardEvent) => {
    const move = keyMove(event.key, count);
    if (!move) return;
    event.preventDefault();
    setActive((index) => move(index ?? count - 1));
  };
  return {
    active: active !== null && active < count ? active : null,
    setActive,
    focusProps: {
      tabIndex: 0,
      onKeyDown,
      onFocus: () => setActive((index) => index ?? count - 1),
      onBlur: () => setActive(null),
      onPointerLeave: () => setActive(null),
    },
  };
};

/** Index of the band under the pointer, for charts whose hit areas are whole columns. */
export const bandAt = (clientX: number, element: Element, left: number, bandWidth: number, count: number) => {
  const x = clientX - element.getBoundingClientRect().left - left;
  return Math.max(0, Math.min(count - 1, Math.floor(x / bandWidth)));
};

/** Bar with a 4px rounded data end and a square base. */
export const columnPath = (x: number, y: number, width: number, height: number) => {
  const r = Math.min(4, width / 2, height);
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
};

/** Floating readout above the plot, kept inside the chart's width. Values lead, labels follow. */
export const ChartTooltip = ({ x, width, children }: { x: number; width: number; children: ReactNode }) => {
  const half = 96;
  const left = Math.max(half, Math.min(width - half, x));
  return (
    <div
      role="status"
      style={{ left }}
      className="pointer-events-none absolute top-0 z-10 w-max max-w-48 -translate-x-1/2 -translate-y-[calc(100%+6px)] rounded-control bg-popover px-3 py-2 text-label text-popover-foreground shadow-popover ring-1 ring-border"
    >
      {children}
    </div>
  );
};

/** One tooltip row: a short line key in the series color, the value, then the label. */
export const TooltipRow = ({ swatch, value, label }: { swatch?: string; value: ReactNode; label: ReactNode }) => (
  <div className="flex items-center gap-2 whitespace-nowrap">
    {swatch && <span aria-hidden="true" className={cn("h-0.5 w-3 shrink-0 rounded-pill", swatch)} />}
    <span className="font-bold tabular text-foreground">{value}</span>
    <span className="text-muted-foreground">{label}</span>
  </div>
);

/** A titled card that holds one chart. */
export const ChartCard = ({
  title,
  subtitle,
  aside,
  className,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <Card className={cn("gap-4 overflow-visible rounded-card px-5 py-5 ring-1 ring-border sm:px-6", className)}>
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="m-0 text-cell font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="m-0 mt-0.5 text-label text-muted-foreground">{subtitle}</p>}
      </div>
      {aside}
    </div>
    {children}
  </Card>
);
