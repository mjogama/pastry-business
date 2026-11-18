"use client";

import { type KeyboardEvent, type MouseEvent, useCallback, useMemo, useState } from "react";
import { ANCHOR_QUERY, PHONE_QUERY, readNow, useMediaQuery, useNow } from "../hooks/use-environment";
import { useLongPress } from "../hooks/use-long-press";
import type { YearMonth } from "../lib/dates";
import { addMonths, dayKeyOf, defaultDateTimeFor, monthPrefix, yearMonthOf } from "../lib/dates";
import { groupByDay, monthStats } from "../lib/totals";
import { deleteEntry, productSuggestions, useSalesEntries } from "../store/sales-store";
import type { DayKey, SalesEntry } from "../types";
import { MonthGrid, MonthRevenue, TitleRow } from "./calendar-parts";
import { DayAgenda, DayPanel } from "./day-detail";
import type { EntryRequest } from "./entry-popover";
import { EntryPopover } from "./entry-popover";

/**
 * Calendar page (§7): title row → month grid → (phone: Day agenda) → month revenue.
 *
 * Day cell gestures:
 * - tap / click / Enter → add an entry for that day (popover beside the cell, or a sheet on phones)
 * - press and hold 1 s / Shift+Enter → view the day (side panel; the Day agenda on phones)
 * Future days can't take entries, so a tap there does nothing; holding still shows the day.
 */
export const SalesTracker = () => {
  const now = useNow();
  // Dates depend on the clock, so the calendar renders in the browser only.
  if (!now) return <main className="page-padding min-h-dvh" />;
  return <Calendar now={now} />;
};

const Calendar = ({ now }: { now: string }) => {
  const entries = useSalesEntries();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const canAnchor = useMediaQuery(ANCHOR_QUERY);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const todayKey = dayKeyOf(now);
  const [viewState, setViewState] = useState<YearMonth | null>(null);
  const view = viewState ?? yearMonthOf(todayKey);
  const [panel, setPanel] = useState<{ key: DayKey; open: boolean } | null>(null);
  const [agendaKey, setAgendaKey] = useState<DayKey | null>(null);
  const [request, setRequest] = useState<EntryRequest | null>(null);

  const days = useMemo(() => groupByDay(entries), [entries]);
  const suggestions = useMemo(() => productSuggestions(entries), [entries]);
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

  const viewDay = (key: DayKey) => {
    if (!isPhone) {
      setPanel({ key, open: true });
      return;
    }
    setAgendaKey(key);
    requestAnimationFrame(() =>
      document
        .getElementById("day-agenda")
        ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" }),
    );
  };

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

  const onSaved = (entry: SalesEntry) => {
    const key = dayKeyOf(entry.date);
    setRequest(null);
    setViewState(yearMonthOf(key));
    setPanel((current) => (current?.open ? { key, open: true } : current));
    setAgendaKey(key);
  };

  const selectedKey = isPhone ? (agendaKey ?? todayKey) : null;
  const detailFor = (key: DayKey) => ({
    dayKey: key,
    group: days.get(key),
    isFuture: key > todayKey,
    onAdd: () => openCreate(key),
    onEdit: (entry: SalesEntry) => setRequest({ mode: "edit", entry }),
    onDelete: (entry: SalesEntry) => deleteEntry(entry.id),
  });

  const placement = request?.anchor && canAnchor ? "anchored" : isPhone ? "sheet" : "centered";

  return (
    <main className="page-padding mx-auto box-border flex min-h-dvh w-full max-w-content min-w-0 flex-col gap-section">
      <TitleRow
        view={view}
        onPrev={() => setViewState(addMonths(view, -1))}
        onToday={() => setViewState(null)}
        onNext={() => setViewState(addMonths(view, 1))}
      />
      <MonthGrid
        view={view}
        days={days}
        maxByMonth={maxByMonth}
        todayKey={todayKey}
        selectedKey={selectedKey}
        holdingKey={longPress.holdingKey}
        onCellClick={onCellClick}
        onCellKeyDown={onCellKeyDown}
        cellHandlers={longPress.cellHandlers}
      />
      {isPhone && selectedKey && <DayAgenda {...detailFor(selectedKey)} />}
      <MonthRevenue view={view} total={monthTotal} />

      {panel && !isPhone && (
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
          onSaved={onSaved}
        />
      )}
    </main>
  );
};
