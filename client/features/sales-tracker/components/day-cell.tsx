import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HOLD_MS } from "../hooks/use-long-press";
import type { GridDay } from "../lib/dates";
import { dayLabel, formatShortDate } from "../lib/dates";
import { formatPeso } from "../lib/money";
import type { DayGroup } from "../lib/totals";
import { bakeLevel } from "../lib/totals";
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

/**
 * One day (§7.3, §8.2) on a shadcn `Button` with no variant, so only the grid's own styling
 * applies. Phone: date, 🦆, holiday dot and compact total; titles move to the Day agenda.
 * Tablet: 1 title. Desktop: 2 titles. Product names are never shown here.
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
  const total = group?.total ?? 0;
  const tint = bakeLevel(total, maxDayTotal);
  const label = dayLabel(day);

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
        "hold-surface relative flex h-cell-compact min-w-0 flex-col items-stretch justify-start gap-0 overflow-hidden rounded-none border-0 border-r border-b border-solid border-border bg-transparent bg-clip-border text-left text-body-lg leading-prototype font-normal whitespace-normal text-foreground transition-none focus-visible:z-10 focus-visible:border-border active:not-aria-[haspopup]:translate-y-0",
        "px-0.75 pt-1.5 pb-2 sm:gap-1 sm:px-2 lg:h-cell",
        isSelected ? "inset-ring-2 inset-ring-primary" : "hover:inset-ring hover:inset-ring-line-dashed",
        !day.inMonth && "opacity-50",
      )}
    >
      <span className="flex flex-none items-start justify-between gap-2">
        {/* Titles: left, 5px down so the first one sits level with the date */}
        <span className="hidden min-w-0 flex-1 flex-col gap-1 pt-1.25 sm:flex">
          {entries.slice(0, 2).map((entry, index) => (
            <span
              key={entry.id}
              className={cn(
                "truncate text-label leading-tight font-semibold text-foreground lg:text-cell",
                index === 1 && "hidden lg:block",
              )}
            >
              {entry.title}
            </span>
          ))}
          {entries.length > 1 && (
            <span className="text-label-sm text-muted-foreground lg:hidden">+{entries.length - 1} more</span>
          )}
          {entries.length > 2 && (
            <span className="hidden text-label-sm text-muted-foreground lg:block">+{entries.length - 2} more</span>
          )}
        </span>

        {/* Date, then 🦆 under it */}
        <span className="ml-auto flex flex-none flex-col items-end sm:gap-0.5 lg:gap-1.5">
          {isToday ? (
            <span className="tabular flex h-6 min-w-6 items-center justify-center rounded-pill bg-primary px-1 text-label font-bold text-primary-foreground sm:h-7.5 sm:min-w-7.5 sm:px-1.5 sm:text-cell">
              {label}
            </span>
          ) : (
            <span
              className={cn(
                "tabular flex h-6 items-center pr-0.5 text-label font-medium whitespace-nowrap sm:h-7.5 sm:text-cell",
                day.inMonth ? "text-foreground" : "text-foreground-outside",
              )}
            >
              {label}
            </span>
          )}
          {total > 0 && (
            <span aria-hidden="true" className="pr-0.5 text-body leading-none sm:text-sum-sm lg:text-sum">
              🦆
            </span>
          )}
        </span>
      </span>

      {holiday && (
        <span className="hidden flex-none truncate rounded-tag bg-holiday-bg px-1.75 py-0.5 text-nano font-medium text-holiday-text sm:block lg:text-micro">
          {holiday}
        </span>
      )}

      {/* Tablet and desktop: day total pinned to the bottom under a dashed rule */}
      {total > 0 && (
        <Money
          amount={total}
          className="mt-auto hidden flex-none border-t border-dashed border-line-dashed pt-1 text-label font-bold text-foreground sm:block lg:text-cell"
        />
      )}

      {/* Phone: holiday dot and compact total */}
      {(holiday || total > 0) && (
        <span className="mt-auto flex min-w-0 flex-none items-center gap-0.75 sm:hidden">
          {holiday && <span aria-hidden="true" className="size-1 flex-none rounded-pill bg-holiday-text" />}
          {total > 0 && (
            <Money amount={total} compact className="truncate text-micro leading-tight font-bold text-foreground" />
          )}
        </span>
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
