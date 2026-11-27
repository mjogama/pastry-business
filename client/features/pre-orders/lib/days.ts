import type { BusinessSettings } from "@common/modules/menu";
import type { PreOrder } from "@common/modules/pre-order";

import type { DateKey, PriceView } from "@/features/menu/types";

/** Must match `MAX_DAYS_AHEAD` in `server/src/modules/pre-order/pre-order.service.ts`. */
export const MAX_DAYS_AHEAD = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export const addDays = (day: DateKey, days: number): DateKey =>
  new Date(new Date(`${day}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

const weekday = (day: DateKey) => new Date(`${day}T00:00:00Z`).getUTCDay();

/** The owner's hand-over schedule, set on `/cms/pre-orders`. */
export type PreOrderSchedule = Pick<
  BusinessSettings,
  "preOrderDays" | "preOrderCutoffDays" | "preOrderCutoffTime" | "preOrderHandoffTime"
>;

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** `Thursday`, `Tuesday and Thursday`, `Monday, Wednesday and Friday`; `plural` gives `Thursdays`. */
export const weekdaysText = (days: number[], plural = false) => {
  const names = days.map((d) => `${WEEKDAY_NAMES[d]}${plural ? "s" : ""}`);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : (names[0] ?? "");
};

/** `18:00` → `6:00 PM`; `23:59` → `11:59 PM`. */
export const timeText = (time: string) => {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/** When orders close: `Wednesday, 6:00 PM` for one selling day, otherwise `6:00 PM, 2 days before`. */
export const cutoffText = ({ preOrderDays, preOrderCutoffDays, preOrderCutoffTime }: PreOrderSchedule) => {
  const time = timeText(preOrderCutoffTime);
  const [only] = preOrderDays;
  if (preOrderDays.length === 1 && only !== undefined) {
    return `${WEEKDAY_NAMES[(only - preOrderCutoffDays + 7) % 7]}, ${time}`;
  }
  return `${time}, ${preOrderCutoffDays === 1 ? "the day before" : `${preOrderCutoffDays} days before`}`;
};

/**
 * Hand-over days a customer can pick at `now` (Manila `YYYY-MM-DDTHH:mm`): the selling weekdays whose
 * cut-off (`preOrderCutoffDays` before, at `preOrderCutoffTime`) is still ahead, up to `MAX_DAYS_AHEAD`
 * days ahead. The server checks the same rule.
 */
export const pickupDays = (
  now: string,
  { preOrderDays, preOrderCutoffDays, preOrderCutoffTime }: PreOrderSchedule,
): DateKey[] => {
  const today = now.slice(0, 10);
  const minute = now.slice(0, 16);
  return Array.from({ length: MAX_DAYS_AHEAD }, (_, i) => addDays(today, i + 1)).filter(
    (day) =>
      preOrderDays.includes(weekday(day)) && `${addDays(day, -preOrderCutoffDays)}T${preOrderCutoffTime}` > minute,
  );
};

const shortDay = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** `Thu, Nov 26`; with `today`, the next day reads `Tomorrow, Nov 26`. */
export const dayLabel = (day: DateKey, today?: DateKey) => {
  const label = shortDay.format(new Date(`${day}T00:00:00Z`));
  if (today && day === today) return `Today, ${label.split(", ")[1]}`;
  if (today && day === addDays(today, 1)) return `Tomorrow, ${label.split(", ")[1]}`;
  return label;
};

/** The price per piece on the hand-over day, as the server works it out: the sale counts while that day ≤ its end. */
export const priceOnDay = (priced: PriceView, day: DateKey) =>
  priced.isOnSale && (!priced.discountEndsAt || day <= priced.discountEndsAt) ? priced.finalPrice : priced.price;

/** Whole-peso-safe sum of price × quantity. */
export const totalOf = (lines: { price: number; quantity: number }[]) =>
  Math.round(lines.reduce((sum, line) => sum + Math.round(line.price * 100) * line.quantity, 0)) / 100;

export const orderTotal = (order: Pick<PreOrder, "items">) => totalOf(order.items);
