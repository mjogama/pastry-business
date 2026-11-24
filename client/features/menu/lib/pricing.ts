import type { DateKey, Product } from "../types";

/** Every menu date is a calendar day in Manila (§3), whatever the server's or device's zone. */
export const TIME_ZONE = "Asia/Manila";

const manilaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today in Manila as `YYYY-MM-DD`. */
export const manilaToday = (instant: Date = new Date()): DateKey => manilaDate.format(instant);

type Priced = Pick<Product, "price" | "discountPrice" | "discountEndsAt">;

/**
 * `discountPrice` is the amount taken off the price (₱40 with ₱15 off sells for ₱25).
 * §3: on sale while the discount is valid and today ≤ `discountEndsAt` (Manila). It drops off on
 * its own the day after the end date (§4), so nothing has to clean it up.
 */
export const isOnSale = (product: Priced, today: DateKey): boolean =>
  product.discountPrice != null &&
  product.discountPrice > 0 &&
  product.discountPrice < product.price &&
  (product.discountEndsAt == null || today <= product.discountEndsAt);

export const finalPrice = (product: Priced, today: DateKey): number =>
  isOnSale(product, today)
    ? Math.round((product.price - (product.discountPrice as number)) * 100) / 100
    : product.price;

/** `price − finalPrice`, without float drift. */
export const savings = (product: Priced, today: DateKey): number =>
  Math.round((product.price - finalPrice(product, today)) * 100) / 100;

const endsFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" });

/** `Sale ends Nov 30`, or `Limited time` with no end date (§7.4). */
export const saleEndsText = (endsAt: DateKey | undefined): string =>
  endsAt ? `Sale ends ${endsFormat.format(new Date(`${endsAt}T00:00:00Z`))}` : "Limited time";
