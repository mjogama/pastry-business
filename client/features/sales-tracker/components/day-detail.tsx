"use client";

import { XIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatLongDate, formatTime12, timeOf } from "../lib/dates";
import { holidayOf } from "../lib/holidays";
import { lineRevenue } from "../lib/money";
import type { DayGroup } from "../lib/totals";
import { entryTotal } from "../lib/totals";
import type { DayKey, SalesEntry } from "../types";
import { DangerButton, IconButton, PrimaryButton, SecondaryButton } from "./ui/buttons";
import { Money, scrimProps } from "./ui/primitives";

export interface DayDetailProps {
  dayKey: DayKey;
  group: DayGroup | undefined;
  isFuture: boolean;
  onAdd: () => void;
  onEdit: (entry: SalesEntry) => void;
  onDelete: (entry: SalesEntry) => void;
}

/** 🦆 · Day total · amount (§7.6) */
const DayTotalLine = ({ total }: { total: number }) => (
  <>
    {total > 0 && (
      <span aria-hidden="true" className="text-sum-sm">
        🦆
      </span>
    )}
    <span>Day total</span>
    <Money amount={total} className="text-sum-sm font-bold text-primary" />
  </>
);

const EntryList = ({ group, isFuture, onEdit, onDelete }: Omit<DayDetailProps, "dayKey" | "onAdd">) => {
  const entries = group?.entries ?? [];
  if (entries.length === 0) {
    return (
      <p className="my-7 text-center text-cell text-muted-foreground">
        {isFuture ? "This day hasn’t happened yet." : "No sales recorded for this day."}
      </p>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-2.5 border-b border-dashed border-input py-4">
          <div className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-body-lg font-semibold break-words text-foreground">{entry.title}</span>
              <span className="tabular text-label-sm font-medium tracking-time text-muted-foreground">
                {formatTime12(timeOf(entry.date))}
              </span>
            </span>
            <Money amount={entryTotal(entry)} className="text-body-lg font-bold text-primary" />
          </div>
          {entry.items.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: items have no id and never reorder within an entry
            <div key={`${entry.id}-${index}`} className="flex items-baseline gap-2.5 text-body">
              <span className="min-w-0 flex-1 break-words text-foreground">{item.productName}</span>
              <span className="tabular text-muted-foreground">
                <Money amount={item.price} /> × {item.quantity}
              </span>
              <Money amount={lineRevenue(item.price, item.quantity)} className="min-w-18 text-right text-foreground" />
            </div>
          ))}
          {entry.note && (
            <p className="m-0 rounded-control bg-surface-note px-3 py-2.5 text-label leading-normal whitespace-pre-wrap text-foreground-2">
              {entry.note}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <SecondaryButton size="sm" outline onClick={() => onEdit(entry)} aria-label={`Edit ${entry.title}`}>
              Edit
            </SecondaryButton>
            <DangerButton size="sm" outline onClick={() => onDelete(entry)} aria-label={`Delete ${entry.title}`}>
              Delete
            </DangerButton>
          </div>
        </li>
      ))}
    </ul>
  );
};

/** §7.6 day details as a shadcn Sheet: right-hand drawer on tablet and desktop. */
export const DayPanel = ({ open, onClose, ...props }: DayDetailProps & { open: boolean; onClose: () => void }) => {
  const total = props.group?.total ?? 0;
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        overlayProps={scrimProps("panel", "Close day details")}
        className="gap-0 border-border bg-surface-2 p-0 text-foreground shadow-none data-[side=right]:w-drawer-tablet data-[side=right]:sm:max-w-none lg:data-[side=right]:w-drawer"
      >
        <SheetHeader className="flex-row items-start justify-between gap-3 border-b border-dashed border-input px-5.5 pt-[calc(22px+env(safe-area-inset-top))] pb-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <SheetTitle className="font-display text-heading font-semibold">{formatLongDate(props.dayKey)}</SheetTitle>
            <SheetDescription className="flex items-center gap-2 text-body">
              <DayTotalLine total={total} />
            </SheetDescription>
          </div>
          <SheetClose render={<IconButton aria-label="Close" />}>
            <XIcon />
          </SheetClose>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5.5 pt-2 pb-5.5">
          <EntryList {...props} />
        </div>
        {!props.isFuture && (
          <SheetFooter className="mt-0 border-t border-border px-5.5 pt-4 pb-[calc(22px+env(safe-area-inset-bottom))]">
            <PrimaryButton size="lg" onClick={props.onAdd}>
              + Add entry for this day
            </PrimaryButton>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

/** §8.3: the phone's inline Day agenda (a shadcn Card). Everything the panel shows, plus the holiday name. */
export const DayAgenda = (props: DayDetailProps) => {
  const holiday = holidayOf(props.dayKey);
  return (
    <Card
      id="day-agenda"
      role="region"
      aria-label={`Agenda for ${formatLongDate(props.dayKey)}`}
      className="gap-0 rounded-card bg-surface-2 p-4 text-base text-foreground ring-1 ring-border"
    >
      <div className="flex flex-col gap-1.5 border-b border-dashed border-input pb-4">
        <h2 className="m-0 font-display text-heading font-semibold text-foreground">{formatLongDate(props.dayKey)}</h2>
        <p className="m-0 flex items-center gap-2 text-body text-muted-foreground">
          <DayTotalLine total={props.group?.total ?? 0} />
        </p>
        {holiday && (
          <span className="self-start rounded-tag bg-holiday-bg px-1.75 py-0.5 text-micro font-medium text-holiday-text">
            {holiday}
          </span>
        )}
      </div>
      <EntryList {...props} />
      {!props.isFuture && (
        <div className="pt-4">
          <PrimaryButton size="lg" onClick={props.onAdd}>
            + Add entry for this day
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
};
