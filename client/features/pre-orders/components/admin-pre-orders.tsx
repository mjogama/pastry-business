"use client";

import type { PreOrder, PreOrderStatus } from "@common/modules/pre-order";
import { MailIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { refreshPublicMenu } from "@/features/admin/actions";
import { Switch } from "@/features/admin/components/switch";
import { CONTAINER } from "@/features/menu/lib/layout";
import { Money } from "@/features/sales-tracker/components/ui/primitives";
import { useNow } from "@/features/sales-tracker/hooks/use-environment";
import { apiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { deletePreOrder, getPreOrderSettings, listPreOrders, setPreOrdersOpen, updatePreOrderStatus } from "../api";
import { addDays, dayLabel, orderTotal } from "../lib/days";

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

  // Start on the next day with orders; "all" when there are none.
  const selectedDay = day ?? upcoming[0]?.[0] ?? "all";

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
      setOpen((await setPreOrdersOpen(next)).preOrdersOpen);
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
          <div className="flex flex-col gap-2.5">
            <h2 className="text-label font-semibold tracking-label text-muted-foreground uppercase">Hand-over day</h2>
            <ToggleGroup
              aria-label="Hand-over day"
              variant="chip"
              size="chip"
              spacing={2.5}
              value={[selectedDay]}
              onValueChange={(next) => next[0] && setDay(next[0])}
              className="scrollbar-none max-w-full overflow-x-auto rounded-none p-1"
            >
              {upcoming.map(([d, count]) => (
                <ToggleGroupItem key={d} value={d} aria-label={`${dayLabel(d, today)}, ${count} to do`}>
                  {dayLabel(d, today)}
                  <span className="tabular ml-1.5 opacity-75">{count}</span>
                </ToggleGroupItem>
              ))}
              <ToggleGroupItem value="all">All days</ToggleGroupItem>
            </ToggleGroup>
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
            <ToggleGroup
              aria-label="Filter by status"
              variant="chip"
              size="chip"
              spacing={2.5}
              value={[status]}
              onValueChange={(next) => next[0] && setStatus(next[0] as StatusFilter)}
              className="scrollbar-none max-w-full overflow-x-auto rounded-none p-1"
            >
              {STATUS_FILTERS.map((f) => (
                <ToggleGroupItem key={f.value} value={f.value}>
                  {f.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

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
        <span className="truncate text-body text-foreground-2">{order.handoff}</span>
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
