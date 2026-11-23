"use client";

import { type KeyboardEvent, type MouseEvent, useCallback, useMemo, useState } from "react";
import { apiErrorMessage } from "@/lib/api/client";
import { createSalesEntry, deleteSalesEntry, getProductSuggestions, updateSalesEntry } from "../api";
import { ANCHOR_QUERY, PHONE_QUERY, readNow, useMediaQuery, useNow } from "../hooks/use-environment";
import { useLongPress } from "../hooks/use-long-press";
import type { YearMonth } from "../lib/dates";
import { addMonths, dayKeyOf, defaultDateTimeFor, monthPrefix, yearMonthOf } from "../lib/dates";
import { dayTitle, groupByDay, monthStats } from "../lib/totals";
import type { CreateSalesEntryInput, DayKey, ProductSuggestion, SalesEntry } from "../types";
import { MonthGrid, TitleRow } from "./calendar-parts";
import { DayPanel } from "./day-detail";
import type { EntryRequest } from "./entry-popover";
import { EntryPopover } from "./entry-popover";

/**
 * Calendar page (§7): title row (with the month revenue on the right) → month grid.
 *
 * Day cell gestures:
 * - tap / click / Enter → add an entry for that day (popover beside the cell, or a sheet on phones)
 * - press and hold 1 s / Shift+Enter → view the day in the side panel (full width on phones)
 * Future days can't take entries, so a tap there does nothing; holding still shows the day.
 *
 * `initialEntries` is `null` when loading them from the server failed.
 */
export const SalesTracker = (props: SalesTrackerProps) => {
  const now = useNow();
  // Dates depend on the clock, so the calendar renders in the browser only.
  if (!now) return <main className="page-padding min-h-dvh" />;
  return <Calendar now={now} {...props} />;
};

interface SalesTrackerProps {
  initialEntries: SalesEntry[] | null;
  initialSuggestions: ProductSuggestion[];
}

const Calendar = ({ now, initialEntries, initialSuggestions }: SalesTrackerProps & { now: string }) => {
  const [entries, setEntries] = useState<SalesEntry[]>(initialEntries ?? []);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [actionError, setActionError] = useState<string | null>(null);
  const isPhone = useMediaQuery(PHONE_QUERY);
  const canAnchor = useMediaQuery(ANCHOR_QUERY);

  const todayKey = dayKeyOf(now);
  const [viewState, setViewState] = useState<YearMonth | null>(null);
  const view = viewState ?? yearMonthOf(todayKey);
  const [panel, setPanel] = useState<{ key: DayKey; open: boolean } | null>(null);
  const [request, setRequest] = useState<EntryRequest | null>(null);

  const days = useMemo(() => groupByDay(entries), [entries]);
  const maxByMonth = useMemo(() => {
    const cache = new Map<string, number>();
    return (prefix: string) => {
      if (!cache.has(prefix)) cache.set(prefix, monthStats(days, prefix).maxDayTotal);
      return cache.get(prefix) ?? 0;
    };
  }, [days]);
  const monthTotal = monthStats(days, monthPrefix(view)).total;

  const openCreate = useCallback((key: DayKey, anchor?: HTMLElement) => {
    setRequest({ mode: "create", date: defaultDateTimeFor(key, readNow()), anchor });
  }, []);

  // The side panel on every device (phones too, full width), never an agenda under the grid.
  const viewDay = (key: DayKey) => setPanel({ key, open: true });

  const longPress = useLongPress((key) => viewDay(key));

  const onCellClick = (key: DayKey, event: MouseEvent<HTMLButtonElement>) => {
    if (longPress.swallowClick(event)) return;
    if (key > todayKey) return;
    openCreate(key, event.currentTarget);
  };

  const onCellKeyDown = (key: DayKey, event: KeyboardEvent<HTMLButtonElement>) => {
    if (!event.shiftKey || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    viewDay(key);
  };

  // Suggestions follow the saved entries; if the refresh fails, the old list is still usable.
  const refreshSuggestions = () =>
    getProductSuggestions()
      .then(setSuggestions)
      .catch(() => {});

  // Failed requests throw, so the popover that called these can show the error and stay open.
  const saveEntry = async (input: CreateSalesEntryInput) => {
    const saved =
      request?.mode === "edit" ? await updateSalesEntry(request.entry.id, input) : await createSalesEntry(input);
    setEntries((current) => [...current.filter((entry) => entry.id !== saved.id), saved]);
    refreshSuggestions();
    onSaved(saved);
  };

  const removeEntry = async (entry: SalesEntry) => {
    await deleteSalesEntry(entry.id);
    setEntries((current) => current.filter((existing) => existing.id !== entry.id));
    refreshSuggestions();
  };

  /** Gives every entry of the day the new title, one PUT per entry that differs. */
  const renameDay = async (key: DayKey, title: string) => {
    const stale = (days.get(key)?.entries ?? []).filter((entry) => entry.title !== title);
    const saved = await Promise.all(
      stale.map(({ id, date, items, note }) => updateSalesEntry(id, { date, title, items, note })),
    );
    const byId = new Map(saved.map((entry) => [entry.id, entry]));
    setEntries((current) => current.map((entry) => byId.get(entry.id) ?? entry));
  };

  // Delete from the day list is immediate (§4), so a failure is shown on the page instead of in a popover.
  const removeFromList = (entry: SalesEntry) => {
    setActionError(null);
    removeEntry(entry).catch((error: unknown) => setActionError(apiErrorMessage(error)));
  };

  const onSaved = (entry: SalesEntry) => {
    const key = dayKeyOf(entry.date);
    setRequest(null);
    setViewState(yearMonthOf(key));
    setPanel((current) => (current?.open ? { key, open: true } : current));
  };

  const detailFor = (key: DayKey) => ({
    dayKey: key,
    group: days.get(key),
    isFuture: key > todayKey,
    onAdd: () => openCreate(key),
    onEdit: (entry: SalesEntry) => setRequest({ mode: "edit", entry }),
    onDelete: removeFromList,
    onRename: (title: string) => renameDay(key, title),
  });

  const placement = request?.anchor && canAnchor ? "anchored" : isPhone ? "sheet" : "centered";

  return (
    <main className="page-padding mx-auto box-border flex min-h-dvh w-full max-w-content min-w-0 flex-col gap-section">
      <TitleRow
        view={view}
        total={monthTotal}
        onPrev={() => setViewState(addMonths(view, -1))}
        onToday={() => setViewState(null)}
        onNext={() => setViewState(addMonths(view, 1))}
      />
      <MonthGrid
        view={view}
        days={days}
        maxByMonth={maxByMonth}
        todayKey={todayKey}
        selectedKey={panel?.open ? panel.key : null}
        holdingKey={longPress.holdingKey}
        onCellClick={onCellClick}
        onCellKeyDown={onCellKeyDown}
        cellHandlers={longPress.cellHandlers}
      />
      {(initialEntries === null || actionError) && (
        <p role="alert" className="m-0 rounded-control bg-danger-bg px-3 py-2.5 text-body text-danger-alert-text">
          {actionError ?? "Couldn’t load sales. Is the server running?"}
        </p>
      )}

      {panel && (
        <DayPanel
          {...detailFor(panel.key)}
          open={panel.open}
          onClose={() => setPanel((current) => current && { ...current, open: false })}
        />
      )}
      {request && (
        <EntryPopover
          key={request.mode === "edit" ? request.entry.id : `${request.date}-${request.anchor?.dataset.day ?? ""}`}
          request={request}
          placement={placement}
          suggestions={suggestions}
          now={now}
          onClose={() => setRequest(null)}
          onSave={saveEntry}
          onDelete={request.mode === "edit" ? () => removeEntry(request.entry) : undefined}
          titleFor={(key) => dayTitle(days.get(key), request.mode === "edit" ? request.entry.id : undefined)}
        />
      )}
    </main>
  );
};
