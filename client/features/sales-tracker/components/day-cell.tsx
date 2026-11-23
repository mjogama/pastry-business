import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HOLD_MS } from "../hooks/use-long-press";
import type { GridDay } from "../lib/dates";
import { dayLabel, formatShortDate, weekdayOf } from "../lib/dates";
import { formatPeso } from "../lib/money";
import type { DayGroup } from "../lib/totals";
import { bakeLevel, dayProducts } from "../lib/totals";
import { Money } from "./ui/primitives";

export interface DayCellHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (event: MouseEvent<HTMLElement>) => void;
}

interface DayCellProps {
  day: GridDay;
  group: DayGroup | undefined;
  maxDayTotal: number;
  holiday: string | undefined;
  isToday: boolean;
  isSelected: boolean;
  isHolding: boolean;
  /** Tap / click / Enter: add an entry for this day. */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Keyboard equivalent of the hold: Shift+Enter opens the day's details. */
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  handlers: DayCellHandlers;
}

/** Products listed before "+N more products". */
const MAX_PRODUCTS = 3;

const moreProducts = (n: number) => `+${n} more product${n === 1 ? "" : "s"}`;

/**
 * One day (§7.3) on a shadcn `Button` with no variant, so only the grid's own styling applies.
 * Same size on every device (`h-cell`, at least `cell-min` wide): titles, the first 3 products
 * with quantities then "+N more products", holiday, 🦆 and the day total. On narrow screens the
 * grid wraps to fewer columns instead of shrinking the cell (see `MonthGrid`).
 */
export const DayCell = ({
  day,
  group,
  maxDayTotal,
  holiday,
  isToday,
  isSelected,
  isHolding,
  onClick,
  onKeyDown,
  handlers,
}: DayCellProps) => {
  const entries = group?.entries ?? [];
  // A day normally has one title shared by all its entries (dayTitle); show each distinct one once.
  const titles = [...new Set(entries.map((entry) => entry.title))];
  const total = group?.total ?? 0;
  const tint = bakeLevel(total, maxDayTotal);
  const label = dayLabel(day);
  const products = group ? dayProducts(group) : [];

  return (
    <Button
      variant={null}
      size={null}
      data-slot="day-cell"
      data-day={day.key}
      aria-label={`${formatShortDate(day.key)}, ${total > 0 ? `revenue ${formatPeso(total)}` : "no sales"}`}
      aria-current={isToday ? "date" : undefined}
      aria-keyshortcuts="Shift+Enter"
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...handlers}
      style={
        tint
          ? { backgroundColor: `color-mix(in srgb, var(--primary) ${(tint * 100).toFixed(1)}%, transparent)` }
          : undefined
      }
      className={cn(
        // Reset the shadcn button base for a grid cell
        "hold-surface relative flex h-cell min-w-0 flex-col items-stretch justify-start gap-1 overflow-hidden rounded-none border-0 border-r border-b border-solid border-border bg-transparent bg-clip-border px-2 pt-1.5 pb-2 text-left text-body-lg leading-prototype font-normal whitespace-normal text-foreground transition-none focus-visible:z-10 focus-visible:border-border active:not-aria-[haspopup]:translate-y-0",
        isSelected ? "inset-ring-2 inset-ring-primary" : "hover:inset-ring hover:inset-ring-line-dashed",
        // Days from the next or previous month only fill out the weeks of the full 7-column grid.
        !day.inMonth && "hidden opacity-50 @min-[70rem]:flex",
      )}
    >
      <span className="flex flex-none items-start justify-between gap-2">
        {/* Titles and products: left, 5px down so the first title sits level with the date */}
        <span className="flex min-w-0 flex-1 flex-col gap-1 pt-1.25">
          {titles.slice(0, 2).map((title) => (
            <span key={title} className="truncate text-cell leading-tight font-semibold text-foreground">
              {title}
            </span>
          ))}
          {titles.length > 2 && <span className="text-label-sm text-muted-foreground">+{titles.length - 2} more</span>}
          {products.length > 0 && (
            <span className="flex min-w-0 flex-col text-label-sm leading-4 text-muted-foreground">
              {products.slice(0, MAX_PRODUCTS).map((product) => (
                <span key={product.productName} className="flex min-w-0 gap-1">
                  <span className="min-w-0 truncate">{product.productName}</span>
                  <span className="tabular flex-none">×{product.quantity}</span>
                </span>
              ))}
              {products.length > MAX_PRODUCTS && (
                <span className="truncate font-semibold text-foreground-2">
                  {moreProducts(products.length - MAX_PRODUCTS)}
                </span>
              )}
            </span>
          )}
        </span>

        {/* Weekday (only when the grid wraps, since there is no weekday header then), date, then 🦆 */}
        <span className="ml-auto flex flex-none flex-col items-end gap-1.5">
          <span className="flex items-center gap-1.5">
            <span className="text-label-sm font-medium text-muted-foreground @min-[70rem]:hidden">
              {weekdayOf(day.key)}
            </span>
            {isToday ? (
              <span className="tabular flex h-7.5 min-w-7.5 items-center justify-center rounded-pill bg-primary px-1.5 text-cell font-bold text-primary-foreground">
                {label}
              </span>
            ) : (
              <span
                className={cn(
                  "tabular flex h-7.5 items-center pr-0.5 text-cell font-medium whitespace-nowrap",
                  day.inMonth ? "text-foreground" : "text-foreground-outside",
                )}
              >
                {label}
              </span>
            )}
          </span>
          {total > 0 && (
            <span aria-hidden="true" className="pr-0.5 text-sum leading-none">
              🦆
            </span>
          )}
        </span>
      </span>

      {holiday && (
        <span className="flex-none truncate rounded-tag bg-holiday-bg px-1.75 py-0.5 text-micro font-medium text-holiday-text">
          {holiday}
        </span>
      )}

      {/* Day total pinned to the bottom under a dashed rule */}
      {total > 0 && (
        <Money
          amount={total}
          className="mt-auto flex-none border-t border-dashed border-line-dashed pt-1 text-cell font-bold text-foreground"
        />
      )}

      {isHolding && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-0.75 w-full origin-left animate-hold bg-primary"
          // Same clock as the hold timer, so the bar is full exactly when the panel opens.
          style={{ animationDuration: `${HOLD_MS}ms` }}
        />
      )}
    </Button>
  );
};
