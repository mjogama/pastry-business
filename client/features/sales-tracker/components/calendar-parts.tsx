import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";

import { Card } from "@/components/ui/card";
import type { YearMonth } from "../lib/dates";
import { MONTH_NAMES, monthGrid, WEEKDAYS } from "../lib/dates";
import { holidayOf } from "../lib/holidays";
import type { DayGroup } from "../lib/totals";
import type { DayKey } from "../types";
import type { DayCellHandlers } from "./day-cell";
import { DayCell } from "./day-cell";
import { IconButton, PillButton } from "./ui/buttons";
import { Money } from "./ui/primitives";

/** §7.1, §8.1: month 700 + year 400 on the left; ‹ Today › on the right. */
export const TitleRow = ({ view, onPrev, onToday, onNext }: { view: YearMonth; onPrev: () => void; onToday: () => void; onNext: () => void }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 min-[340px]:flex-nowrap">
    <h1 className="m-0 min-w-0 font-display text-display-fluid tracking-display text-foreground">
      <span className="font-bold">{MONTH_NAMES[view.month]}</span> <span className="font-normal text-foreground-2">{view.year}</span>
    </h1>
    <nav aria-label="Month" className="flex flex-none items-center gap-1.5">
      <IconButton aria-label="Previous month" onClick={onPrev}>
        <ChevronLeftIcon />
      </IconButton>
      <PillButton onClick={onToday}>Today</PillButton>
      <IconButton aria-label="Next month" onClick={onNext}>
        <ChevronRightIcon />
      </IconButton>
    </nav>
  </div>
);

interface MonthGridProps {
  view: YearMonth;
  days: Map<DayKey, DayGroup>;
  maxByMonth: (prefix: string) => number;
  todayKey: DayKey;
  selectedKey: DayKey | null;
  holdingKey: DayKey | null;
  onCellClick: (key: DayKey, event: MouseEvent<HTMLButtonElement>) => void;
  onCellKeyDown: (key: DayKey, event: KeyboardEvent<HTMLButtonElement>) => void;
  cellHandlers: (key: DayKey) => DayCellHandlers;
}

/** §7.2–7.3: Sunday-first weekday header and a 5- or 6-week grid. */
export const MonthGrid = ({ view, days, maxByMonth, todayKey, selectedKey, holdingKey, onCellClick, onCellKeyDown, cellHandlers }: MonthGridProps) => (
  <div className="flex min-w-0 flex-col">
    <div aria-hidden="true" className="grid grid-cols-7 border-b border-border pb-2">
      {WEEKDAYS.map((weekday) => (
        <span key={weekday} className="pr-1 text-right text-micro font-medium text-muted-foreground sm:pr-2.5 sm:text-body">
          {weekday}
        </span>
      ))}
    </div>
    <div className="grid grid-cols-7 border-l border-border">
      {monthGrid(view).map((day) => (
        <DayCell
          key={day.key}
          day={day}
          group={days.get(day.key)}
          maxDayTotal={maxByMonth(day.key.slice(0, 7))}
          holiday={holidayOf(day.key)}
          isToday={day.key === todayKey}
          isSelected={day.key === selectedKey}
          isHolding={day.key === holdingKey}
          onClick={(event) => onCellClick(day.key, event)}
          onKeyDown={(event) => onCellKeyDown(day.key, event)}
          handlers={cellHandlers(day.key)}
        />
      ))}
    </div>
  </div>
);

/** §7.5, §8.6: shadcn Card. 537px pill on desktop; full width, radius 24 on tablet and phone. */
export const MonthRevenue = ({ view, total }: { view: YearMonth; total: number }) => (
  <Card
    role="region"
    aria-label={`${MONTH_NAMES[view.month]} revenue`}
    className="box-border min-h-revenue-h w-full justify-center gap-1 rounded-revenue bg-muted px-8 py-3.5 ring-1 ring-border lg:w-revenue-w lg:max-w-full lg:rounded-pill">
    <div className="flex items-center gap-4">
      <span className="text-2xl font-medium tracking-label text-muted-foreground">{MONTH_NAMES[view.month]} revenue: </span>
      <Money amount={total} className="text-amount-fluid font-bold tracking-display text-primary lg:text-display" />
    </div>
  </Card>
);
