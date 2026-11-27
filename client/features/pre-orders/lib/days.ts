import type { PreOrder } from "@common/modules/pre-order";

import type { DateKey, PriceView } from "@/features/menu/types";

/** Must match `MAX_DAYS_AHEAD` in `server/src/modules/pre-order/pre-order.service.ts`. */
export const MAX_DAYS_AHEAD = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export const addDays = (day: DateKey, days: number): DateKey =>
  new Date(new Date(`${day}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

const weekday = (day: DateKey) => new Date(`${day}T00:00:00Z`).getUTCDay();

/** Hand-over days a customer can pick: weekdays from tomorrow up to `MAX_DAYS_AHEAD` days ahead (the server checks too). */
export const pickupDays = (today: DateKey): DateKey[] =>
  Array.from({ length: MAX_DAYS_AHEAD }, (_, i) => addDays(today, i + 1)).filter(
    (day) => weekday(day) !== 0 && weekday(day) !== 6,
  );

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
