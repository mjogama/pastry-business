"use client";

import type { PreOrder, PreOrderStatus } from "@common/modules/pre-order";
import { CheckIcon, ChevronDownIcon, MailIcon, PhoneIcon, RefreshCwIcon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { refreshPublicMenu } from "@/features/admin/actions";
import { Switch } from "@/features/admin/components/switch";
import { CONTAINER } from "@/features/menu/lib/layout";
import { Money } from "@/features/sales-tracker/components/ui/primitives";
import { useNow } from "@/features/sales-tracker/hooks/use-environment";
import { apiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { deletePreOrder, getPreOrderSettings, listPreOrders, savePreOrderSettings, updatePreOrderStatus } from "../api";
import {
  addDays,
  cutoffText,
  dayLabel,
  orderTotal,
  type PreOrderSchedule,
  pickupDays,
  WEEKDAY_NAMES,
  weekdaysText,
} from "../lib/days";

/** How far back the page loads, so recent completed and cancelled orders stay in view. */
/** A label wrapping its field: text above, field below. */
const FIELD_LABEL = "flex-col items-stretch gap-1.5 text-base leading-normal font-normal select-auto";

const HISTORY_DAYS = 30;

type StatusFilter = "active" | PreOrderStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "To do" },
  { value: "pending", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Handed over" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_LABEL: Record<PreOrderStatus, string> = {
  pending: "New",
  confirmed: "Confirmed",
  completed: "Handed over",
  cancelled: "Cancelled",
};

const STATUS_CLASS: Record<PreOrderStatus, string> = {
  pending: "border-dashed border-input bg-surface-note text-foreground",
  confirmed: "border-primary bg-primary text-primary-foreground",
  completed: "border-border bg-muted text-foreground",
  cancelled: "border-border bg-muted text-muted-foreground line-through",
};

const isActive = (order: PreOrder) => order.status === "pending" || order.status === "confirmed";

const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Totals per product for the orders still to bake (new and confirmed). */
const bakeList = (orders: PreOrder[]) => {
  const rows = new Map<string, { name: string; confirmed: number; pending: number }>();
  for (const order of orders.filter(isActive)) {
    for (const item of order.items) {
      const key = item.productId ?? item.productName.toLowerCase();
      const row = rows.get(key) ?? { name: item.productName, confirmed: 0, pending: 0 };
      row[order.status === "confirmed" ? "confirmed" : "pending"] += item.quantity;
      rows.set(key, row);
    }
  }
  return [...rows.values()].sort((a, b) => b.confirmed + b.pending - (a.confirmed + a.pending));
};

type Dialogs = { kind: "cancel" | "delete"; order: PreOrder } | null;

/**
 * `/cms/pre-orders`: the open/closed switch, upcoming hand-over days, the bake list for a day and
 * every order with its actions. Loaded in the browser because the list needs the owner session.
 */
export function AdminPreOrders() {
  // Manila "today" from the browser clock; null while prerendering (a render can't read the clock).
  const now = useNow();
  const today = now?.slice(0, 10) ?? null;
  const [orders, setOrders] = useState<PreOrder[] | null>(null);
  const [open, setOpen] = useState<boolean | null>(null);
  const [schedule, setSchedule] = useState<PreOrderSchedule | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("active");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    if (!today) return;
    setLoading(true);
    try {
      const [list, settings] = await Promise.all([
        listPreOrders({ from: addDays(today, -HISTORY_DAYS) }),
        getPreOrderSettings(),
      ]);
      setOrders(list);
      setOpen(settings.preOrdersOpen);
      setSchedule({
        preOrderDays: settings.preOrderDays,
        preOrderCutoffDays: settings.preOrderCutoffDays,
        preOrderCutoffTime: settings.preOrderCutoffTime,
        preOrderHandoffTime: settings.preOrderHandoffTime,
      });
      setLoadFailed(false);
    } catch (e) {
      setLoadFailed(true);
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Days from today on with orders still to bake, and how many. */
  const upcoming = useMemo(() => {
    const counts = new Map<string, number>();
    for (const order of orders ?? []) {
      if (today && order.pickupDate >= today && isActive(order)) {
        counts.set(order.pickupDate, (counts.get(order.pickupDate) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [orders, today]);

  // Start on "All days" so every recent order shows.
  const selectedDay = day ?? "all";

  const dayOrders = useMemo(
    () => (orders ?? []).filter((order) => selectedDay === "all" || order.pickupDate === selectedDay),
    [orders, selectedDay],
  );
  const visible = dayOrders.filter((order) => (status === "active" ? isActive(order) : order.status === status));
  const bake = selectedDay === "all" ? [] : bakeList(dayOrders);
  const expected = dayOrders.filter(isActive).reduce((sum, order) => sum + orderTotal(order), 0);

  const replace = (order: PreOrder) => setOrders((all) => all?.map((o) => (o.id === order.id ? order : o)) ?? null);

  async function changeStatus(order: PreOrder, next: "confirmed" | "completed" | "cancelled", why?: string) {
    setBusyId(order.id);
    setError(null);
    try {
      replace(await updatePreOrderStatus(order.id, { status: next, ...(why?.trim() && { reason: why.trim() }) }));
      setDialog(null);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(order: PreOrder) {
    setBusyId(order.id);
    setError(null);
    try {
      await deletePreOrder(order.id);
      setOrders((all) => all?.filter((o) => o.id !== order.id) ?? null);
      setDialog(null);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleOpen(next: boolean) {
    setError(null);
    setOpen(next);
    try {
      setOpen((await savePreOrderSettings({ open: next })).preOrdersOpen);
      void refreshPublicMenu();
    } catch (e) {
      setOpen(!next);
      setError(apiErrorMessage(e));
    }
  }

  if (!today) {
    return <main className={cn(CONTAINER, "py-10 text-body-lg text-muted-foreground")}>Loading pre-orders…</main>;
  }

  if (loadFailed && !orders) {
    return (
      <main className={cn(CONTAINER, "flex flex-col items-start gap-4 py-10")}>
        <p className="text-body-lg text-muted-foreground">
          Pre-orders can’t be loaded right now. Check that the API is running, then try again.
        </p>
        <Button variant="nav" size="pill" onClick={() => void load()}>
          Try again
        </Button>
      </main>
    );
  }

  return (
    <main className={cn(CONTAINER, "flex flex-1 flex-col gap-7 pt-3 pb-page-end")}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-menu-title font-bold tracking-menu-title text-foreground">Pre-orders</h1>
          <p className="text-body-lg text-muted-foreground">Bake for what’s ordered, hand over at school.</p>
        </div>
        <div className="flex items-center gap-2">
          {open !== null && (
            <Switch label="Taking pre-orders" checked={open} onCheckedChange={(next) => void toggleOpen(next)} />
          )}
          <Button
            variant="nav"
            size="icon-touch"
            aria-label="Reload pre-orders"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCwIcon aria-hidden="true" className={cn(loading && "animate-spin motion-reduce:animate-none")} />
          </Button>
        </div>
      </div>

      {open === false && (
        <p className="rounded-card border border-dashed border-input bg-surface-note px-4 py-3 text-body text-foreground-2">
          Pre-orders are closed: customers don’t see the pre-order buttons on the menu.
        </p>
      )}

      {schedule && (
        <ScheduleForm
          saved={schedule}
          now={now ?? `${today}T00:00`}
          today={today}
          onSaved={(next) => {
            setSchedule(next);
            void refreshPublicMenu();
          }}
        />
      )}

      {error && (
        <p role="alert" className="flex items-center gap-3 text-label text-destructive">
          {error}
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </p>
      )}

      {orders === null ? (
        <p className="text-body-lg text-muted-foreground">Loading pre-orders…</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-2.5 sm:w-72">
              <span id="filter-day" className="text-label font-semibold tracking-label text-muted-foreground uppercase">
                Hand-over day
              </span>
              <NativeSelect
                aria-labelledby="filter-day"
                value={selectedDay}
                onChange={(e) => setDay(e.target.value)}
                className="text-body-lg"
                wrapperClassName="w-full"
              >
                <NativeSelectOption value="all">All days</NativeSelectOption>
                {/* A picked day stays listed after its last order is done. */}
                {(selectedDay === "all" || upcoming.some(([d]) => d === selectedDay)
                  ? upcoming
                  : [...upcoming, [selectedDay, 0] as const]
                ).map(([d, count]) => (
                  <NativeSelectOption key={d} value={d}>
                    {`${dayLabel(d, today)} · ${count} to do`}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2.5 sm:w-56">
              <span
                id="filter-status"
                className="text-label font-semibold tracking-label text-muted-foreground uppercase"
              >
                Status
              </span>
              <NativeSelect
                aria-labelledby="filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="text-body-lg"
                wrapperClassName="w-full"
              >
                {STATUS_FILTERS.map((f) => (
                  <NativeSelectOption key={f.value} value={f.value}>
                    {f.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          {selectedDay !== "all" && (
            <section
              aria-labelledby="bake-title"
              className="flex flex-col gap-3.5 rounded-card border border-border bg-surface-product px-5 py-4.5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="bake-title" className="font-display text-section font-bold text-foreground">
                  Bake list · {dayLabel(selectedDay, today)}
                </h2>
                <span className="text-body text-muted-foreground">
                  Expected <Money amount={Math.round(expected * 100) / 100} className="font-semibold text-foreground" />
                </span>
              </div>
              {bake.length === 0 ? (
                <p className="text-body text-muted-foreground">Nothing to bake for this day.</p>
              ) : (
                <table className="w-full text-left text-body">
                  <thead className="text-label text-muted-foreground">
                    <tr>
                      <th scope="col" className="py-1.5 font-medium">
                        Product
                      </th>
                      <th scope="col" className="py-1.5 text-right font-medium">
                        Confirmed
                      </th>
                      <th scope="col" className="py-1.5 text-right font-medium">
                        New
                      </th>
                      <th scope="col" className="py-1.5 text-right font-semibold text-foreground">
                        Bake
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bake.map((row) => (
                      <tr key={row.name}>
                        <th scope="row" className="py-2 pr-3 font-semibold text-foreground">
                          {row.name}
                        </th>
                        <td className="tabular py-2 text-right">{row.confirmed}</td>
                        <td className="tabular py-2 text-right text-muted-foreground">{row.pending}</td>
                        <td className="tabular py-2 text-right text-body-lg font-bold text-honey">
                          {row.confirmed + row.pending}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          <div className="flex flex-col gap-3.5">
            {visible.length === 0 ? (
              <p className="py-6 text-body-lg text-muted-foreground">No pre-orders here.</p>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(22rem,100%),1fr))] gap-4">
                {visible.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    today={today}
                    busy={busyId === order.id}
                    onConfirm={() => void changeStatus(order, "confirmed")}
                    onComplete={() => void changeStatus(order, "completed")}
                    onCancel={() => {
                      setReason("");
                      setDialog({ kind: "cancel", order });
                    }}
                    onDelete={() => setDialog({ kind: "delete", order })}
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <Dialog open={dialog !== null} onOpenChange={(next) => !next && setDialog(null)}>
        <DialogContent>
          {dialog?.kind === "cancel" && (
            <>
              <DialogHeader>
                <DialogTitle>Cancel pre-order {dialog.order.code}?</DialogTitle>
                <DialogDescription>
                  {dialog.order.customerName} gets an email saying it was cancelled, with your reason if you give one.
                </DialogDescription>
              </DialogHeader>
              <Label className={FIELD_LABEL}>
                <span className="text-label font-semibold">Reason (optional)</span>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} rows={3} />
              </Label>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Keep it
                </Button>
                <Button
                  variant="destructive"
                  disabled={busyId === dialog.order.id}
                  onClick={() => void changeStatus(dialog.order, "cancelled", reason)}
                >
                  Cancel pre-order
                </Button>
              </DialogFooter>
            </>
          )}
          {dialog?.kind === "delete" && (
            <>
              <DialogHeader>
                <DialogTitle>Delete pre-order {dialog.order.code}?</DialogTitle>
                <DialogDescription>This removes the cancelled order for good.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Keep it
                </Button>
                <Button
                  variant="destructive"
                  disabled={busyId === dialog.order.id}
                  onClick={() => void remove(dialog.order)}
                >
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

const OrderCard = ({
  order,
  today,
  busy,
  onConfirm,
  onComplete,
  onCancel,
  onDelete,
}: {
  order: PreOrder;
  today: string;
  busy: boolean;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) => (
  <li className="flex flex-col gap-3.5 rounded-card border border-border bg-surface-product px-5 py-4.5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-body-lg font-bold text-foreground">{order.customerName}</span>
        {order.handoff && <span className="truncate text-body text-foreground-2">{order.handoff}</span>}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-pill border px-2.5 py-1 text-label-sm font-semibold",
          STATUS_CLASS[order.status],
        )}
      >
        {STATUS_LABEL[order.status]}
      </span>
    </div>

    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-muted-foreground">
      <span className="font-mono font-semibold tracking-wider text-foreground">{order.code}</span>
      <span>{dayLabel(order.pickupDate, today)}</span>
      <a
        href={`mailto:${order.email}?subject=${encodeURIComponent(`Pre-order ${order.code}`)}`}
        className="inline-flex min-h-touch items-center gap-1.5 text-honey underline-offset-4 hover:underline"
      >
        <MailIcon aria-hidden="true" className="size-4" />
        {order.email}
      </a>
      {order.contactNumber && (
        <a
          href={`tel:${order.contactNumber.replace(/[^\d+]/g, "")}`}
          className="inline-flex min-h-touch items-center gap-1.5 text-honey underline-offset-4 hover:underline"
        >
          <PhoneIcon aria-hidden="true" className="size-4" />
          {order.contactNumber}
        </a>
      )}
    </div>

    <ul className="flex flex-col gap-1 text-body">
      {order.items.map((item) => (
        <li key={`${item.productName}-${item.price}`} className="flex justify-between gap-3">
          <span className="min-w-0 text-foreground">
            <span className="tabular font-bold">{item.quantity}×</span> {item.productName}
          </span>
          <Money amount={Math.round(item.price * 100 * item.quantity) / 100} className="text-foreground-2" />
        </li>
      ))}
      <li className="flex justify-between gap-3 border-t border-border pt-1.5 font-semibold text-foreground">
        <span>Total</span>
        <Money amount={orderTotal(order)} />
      </li>
    </ul>

    {order.note && (
      <p className="rounded-control bg-surface-note px-3 py-2 text-body whitespace-pre-line text-foreground-2">
        {order.note}
      </p>
    )}
    {order.status === "cancelled" && order.cancelReason && (
      <p className="text-label text-muted-foreground">Reason: {order.cancelReason}</p>
    )}

    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-label text-foreground-faint">Placed {timeFormat.format(new Date(order.createdAt))}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {order.status === "pending" && (
          <Button size="pill" disabled={busy} onClick={onConfirm}>
            Confirm
          </Button>
        )}
        {order.status === "confirmed" && (
          <Button size="pill" disabled={busy} onClick={onComplete}>
            Handed over
          </Button>
        )}
        {isActive(order) && (
          <Button variant="ghost" size="pill" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        )}
        {order.status === "cancelled" && (
          <Button variant="ghost" size="pill" disabled={busy} onClick={onDelete}>
            Delete
          </Button>
        )}
        {order.status === "completed" && (
          <span className="text-label text-muted-foreground">Added to the Sales Tracker</span>
        )}
      </div>
    </div>
  </li>
);

const FIELD =
  "h-auto min-h-touch rounded-control border border-border bg-surface-inset px-3 py-2.5 text-body-lg text-foreground placeholder:text-foreground-faint md:text-body-lg";

/** Monday to Friday, the days a school hand-over can be. */
const SCHOOL_DAYS = [1, 2, 3, 4, 5];

/** Hand-over days, cut-off and time: what customers see in "How it works" on /menu and can pick at checkout. */
const ScheduleForm = ({
  saved,
  now,
  today,
  onSaved,
}: {
  saved: PreOrderSchedule;
  now: string;
  today: string;
  onSaved: (schedule: PreOrderSchedule) => void;
}) => {
  const [days, setDays] = useState(saved.preOrderDays);
  const [cutoff, setCutoff] = useState(saved.preOrderCutoffDays);
  const [cutoffTime, setCutoffTime] = useState(saved.preOrderCutoffTime);
  const [time, setTime] = useState(saved.preOrderHandoffTime);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  /** Closed by default: the schedule rarely changes, so the orders stay near the top. */
  const [expanded, setExpanded] = useState(false);

  const draft: PreOrderSchedule = {
    preOrderDays: days,
    preOrderCutoffDays: cutoff,
    preOrderCutoffTime: cutoffTime,
    preOrderHandoffTime: time.trim(),
  };
  const changed = JSON.stringify(draft) !== JSON.stringify(saved);
  const next = days.length > 0 ? pickupDays(now, draft)[0] : undefined;

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const settings = await savePreOrderSettings({
        days,
        cutoffDays: cutoff,
        cutoffTime,
        handoffTime: time.trim(),
      });
      setMessage({ error: false, text: "Schedule saved. The menu shows it now." });
      onSaved({
        preOrderDays: settings.preOrderDays,
        preOrderCutoffDays: settings.preOrderCutoffDays,
        preOrderCutoffTime: settings.preOrderCutoffTime,
        preOrderHandoffTime: settings.preOrderHandoffTime,
      });
    } catch (e) {
      setMessage({ error: true, text: apiErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  const summary = [
    days.length > 0 ? weekdaysText(days, true) : "No days picked",
    cutoffTime && days.length > 0 ? `orders close ${cutoffText(draft)}` : null,
    time.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      aria-labelledby="schedule-title"
      className="flex flex-col rounded-card border border-border bg-surface-product"
    >
      <h2 id="schedule-title">
        <Button
          type="button"
          variant="bare"
          aria-expanded={expanded}
          aria-controls="schedule-body"
          onClick={() => setExpanded((open) => !open)}
          className="h-auto min-h-touch w-full justify-between gap-3 rounded-card px-5 py-3 text-left whitespace-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex min-w-0 flex-col">
            <span className="font-display text-section font-bold text-foreground">Hand-over schedule</span>
            <span className="truncate text-body font-normal text-muted-foreground">{summary}</span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
              expanded && "rotate-180",
            )}
          />
        </Button>
      </h2>

      {expanded && (
        <form
          id="schedule-body"
          onSubmit={save}
          className="flex flex-col gap-3.5 border-t border-border px-5 pt-3.5 pb-4"
        >
          <p className="text-body text-muted-foreground">
            Customers see this on the menu before they order, and can only pick these days.
          </p>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <div className={cn(FIELD_LABEL, "flex")}>
              <span id="schedule-days" className="text-label font-semibold text-foreground">
                Hand-over days
              </span>
              <DaysSelect labelledBy="schedule-days" value={days} onChange={setDays} />
              {days.length === 0 && <span className="text-label text-destructive">Pick at least one day.</span>}
            </div>

            <Label className={FIELD_LABEL}>
              <span className="text-label font-semibold text-foreground">Orders close</span>
              <div className="flex gap-2">
                <NativeSelect
                  value={String(cutoff)}
                  onChange={(e) => setCutoff(Number(e.target.value))}
                  className="text-body-lg"
                  wrapperClassName="min-w-0 flex-1"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <NativeSelectOption key={n} value={String(n)}>
                      {n === 1 ? "The day before" : `${n} days before`}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Input
                  type="time"
                  step={60}
                  required
                  aria-label="Closing time (Manila)"
                  className={cn(FIELD, "h-11 min-h-0 w-32 shrink-0 py-0")}
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value.slice(0, 5))}
                />
              </div>
            </Label>

            <Label className={cn(FIELD_LABEL, "sm:col-span-2 lg:col-span-1")}>
              <span className="text-label font-semibold text-foreground">
                Time and place <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <Input
                className={cn(FIELD, "h-11 min-h-0 py-0")}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 12:00–1:00 PM, canteen"
                maxLength={80}
              />
            </Label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              role={message ? (message.error ? "alert" : "status") : undefined}
              className={cn("min-w-0 flex-1 text-label", message?.error ? "text-destructive" : "text-foreground-2")}
            >
              {message
                ? message.text
                : next
                  ? `Next day customers can pick: ${dayLabel(next, today)} (Manila time).`
                  : null}
            </p>
            <Button type="submit" size="pill" disabled={saving || !changed || days.length === 0 || !cutoffTime}>
              {saving ? "Saving…" : "Save schedule"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
};

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** A select-style button that opens a checklist of school days, so the days take one field's space. */
const DaysSelect = ({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy: string;
  value: number[];
  onChange: (days: number[]) => void;
}) => {
  const label =
    value.length === 0
      ? "Pick days"
      : value.length === 1
        ? (WEEKDAY_NAMES[value[0] ?? 0] ?? "")
        : value.map((d) => DAY_SHORT[d]).join(", ");
  const toggle = (day: number, on: boolean) =>
    onChange((on ? [...value, day] : value.filter((d) => d !== day)).sort((a, b) => a - b));

  return (
    <Popover>
      <PopoverTrigger
        aria-labelledby={labelledBy}
        aria-describedby={`${labelledBy}-value`}
        className="relative flex h-11 w-full cursor-pointer items-center rounded-card border border-border bg-surface-inset pr-8 pl-3 text-left text-body-lg font-semibold text-honey outline-none transition-colors hover:border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span id={`${labelledBy}-value`} className="truncate">
          {label}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 gap-0 p-1.5">
        <fieldset className="m-0 flex min-w-0 flex-col border-0 p-0">
          <legend className="sr-only">Hand-over days</legend>
          {SCHOOL_DAYS.map((d) => {
            const on = value.includes(d);
            return (
              <Button
                key={d}
                type="button"
                variant="bare"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(d, !on)}
                className="h-auto min-h-touch justify-start gap-3 rounded-control px-2.5 text-body-lg font-normal text-foreground hover:bg-muted"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-sm border",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-surface-inset",
                  )}
                >
                  {on && <CheckIcon className="size-3.5" />}
                </span>
                {WEEKDAY_NAMES[d]}
              </Button>
            );
          })}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
};
