import { MONTH_NAMES, WEEKDAYS } from "@/features/sales-tracker/lib/dates";
import { lineRevenue, sumMoney } from "@/features/sales-tracker/lib/money";
import type { DayGroup } from "@/features/sales-tracker/lib/totals";
import type { DayKey } from "@/features/sales-tracker/types";

/** Everything here is derived from the Sales Tracker's entries, grouped by Manila day. Nothing is stored. */

export type RangeId = "7d" | "30d" | "90d" | "12m";

export const RANGES: { id: RangeId; label: string; previous: string }[] = [
  { id: "7d", label: "7 days", previous: "previous 7 days" },
  { id: "30d", label: "30 days", previous: "previous 30 days" },
  { id: "90d", label: "90 days", previous: "previous 90 days" },
  { id: "12m", label: "12 months", previous: "previous 12 months" },
];

export interface Bucket {
  /** Inclusive first and last day. */
  from: DayKey;
  to: DayKey;
  /** Axis label: `Nov 18`, `Nov`. */
  short: string;
  /** Tooltip and table label: `Wed, Nov 18`, `Week of Nov 16`, `November 2026`. */
  long: string;
}

const pad = (value: number) => String(value).padStart(2, "0");
const utc = (key: DayKey) => new Date(`${key}T00:00:00Z`);
const keyOf = (date: Date): DayKey =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

export const addDays = (key: DayKey, days: number): DayKey => {
  const date = utc(key);
  date.setUTCDate(date.getUTCDate() + days);
  return keyOf(date);
};

const monthDay = (key: DayKey) => `${MONTH_NAMES[Number(key.slice(5, 7)) - 1].slice(0, 3)} ${Number(key.slice(8, 10))}`;
const weekday = (key: DayKey) => WEEKDAYS[utc(key).getUTCDay()];

const dayBuckets = (end: DayKey, count: number): Bucket[] =>
  Array.from({ length: count }, (_, index) => {
    const key = addDays(end, index - count + 1);
    return { from: key, to: key, short: monthDay(key), long: `${weekday(key)}, ${monthDay(key)}` };
  });

const weekBuckets = (end: DayKey, count: number): Bucket[] =>
  Array.from({ length: count }, (_, index) => {
    const to = addDays(end, (index - count + 1) * 7);
    const from = addDays(to, -6);
    return { from, to, short: monthDay(from), long: `${monthDay(from)} – ${monthDay(to)}` };
  });

const monthBuckets = (end: DayKey, count: number): Bucket[] => {
  const year = Number(end.slice(0, 4));
  const month = Number(end.slice(5, 7)) - 1;
  return Array.from({ length: count }, (_, index) => {
    const first = new Date(Date.UTC(year, month - count + 1 + index, 1));
    const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
    const name = MONTH_NAMES[first.getUTCMonth()];
    return {
      from: keyOf(first),
      to: keyOf(last),
      short: name.slice(0, 3),
      long: `${name} ${first.getUTCFullYear()}`,
    };
  });
};

/** The range's buckets ending on `today`, and the same buckets one range-length earlier. */
export const bucketsFor = (range: RangeId, today: DayKey): { current: Bucket[]; previous: Bucket[] } => {
  switch (range) {
    case "7d":
      return { current: dayBuckets(today, 7), previous: dayBuckets(addDays(today, -7), 7) };
    case "30d":
      return { current: dayBuckets(today, 30), previous: dayBuckets(addDays(today, -30), 30) };
    case "90d":
      // 13 weeks (91 days) ending today, so every bucket is a whole week.
      return { current: weekBuckets(today, 13), previous: weekBuckets(addDays(today, -91), 13) };
    case "12m": {
      const current = monthBuckets(today, 12);
      return { current, previous: monthBuckets(addDays(current[0].from, -1), 12) };
    }
  }
};

export interface BucketTotal {
  bucket: Bucket;
  revenue: number;
  entries: number;
  items: number;
}

/** Revenue, entry count and items sold per bucket. Days outside every bucket are ignored. */
export const totalsPerBucket = (days: Map<DayKey, DayGroup>, buckets: Bucket[]): BucketTotal[] => {
  const totals = buckets.map((bucket) => ({ bucket, revenue: [] as number[], entries: 0, items: 0 }));
  for (const [key, group] of days) {
    const slot = totals.find(({ bucket }) => bucket.from <= key && key <= bucket.to);
    if (!slot) continue;
    slot.revenue.push(group.total);
    slot.entries += group.entries.length;
    for (const entry of group.entries) for (const item of entry.items) slot.items += item.quantity;
  }
  return totals.map((slot) => ({ ...slot, revenue: sumMoney(slot.revenue) }));
};

/** Running total, bucket by bucket. */
export const cumulative = (totals: BucketTotal[]): number[] => {
  let running = 0;
  return totals.map((total) => {
    running = sumMoney([running, total.revenue]);
    return running;
  });
};

export interface Summary {
  revenue: number;
  entries: number;
  items: number;
  sellingDays: number;
  bestDay: { key: DayKey; total: number } | null;
}

const inRange = (key: DayKey, buckets: Bucket[]) => buckets[0].from <= key && key <= buckets[buckets.length - 1].to;

export const summarize = (days: Map<DayKey, DayGroup>, buckets: Bucket[]): Summary => {
  const summary: Summary = { revenue: 0, entries: 0, items: 0, sellingDays: 0, bestDay: null };
  const revenue: number[] = [];
  for (const [key, group] of days) {
    if (!inRange(key, buckets)) continue;
    revenue.push(group.total);
    summary.entries += group.entries.length;
    for (const entry of group.entries) for (const item of entry.items) summary.items += item.quantity;
    if (group.total > 0) summary.sellingDays += 1;
    if (!summary.bestDay || group.total > summary.bestDay.total) summary.bestDay = { key, total: group.total };
  }
  summary.revenue = sumMoney(revenue);
  return summary;
};

/** Signed share of change, or `null` when there is nothing to compare against. */
export const change = (current: number, previous: number): number | null =>
  previous > 0 ? (current - previous) / previous : null;

export interface ProductTotal {
  productName: string;
  revenue: number;
  quantity: number;
}

/** Products by revenue in the range, names matched case-insensitively (the spelling of the latest sale wins). */
export const topProducts = (days: Map<DayKey, DayGroup>, buckets: Bucket[], limit = 6): ProductTotal[] => {
  const products = new Map<string, { productName: string; revenue: number[]; quantity: number; seen: string }>();
  for (const [key, group] of days) {
    if (!inRange(key, buckets)) continue;
    for (const entry of group.entries) {
      for (const item of entry.items) {
        const id = item.productName.trim().toLowerCase();
        const product = products.get(id) ?? { productName: "", revenue: [], quantity: 0, seen: "" };
        if (entry.date >= product.seen) {
          product.productName = item.productName.trim();
          product.seen = entry.date;
        }
        product.revenue.push(lineRevenue(item.price, item.quantity));
        product.quantity += item.quantity;
        products.set(id, product);
      }
    }
  }
  return [...products.values()]
    .map(({ productName, revenue, quantity }) => ({ productName, quantity, revenue: sumMoney(revenue) }))
    .sort((a, b) => b.revenue - a.revenue || a.productName.localeCompare(b.productName))
    .slice(0, limit);
};

export interface WeekdayAverage {
  weekday: (typeof WEEKDAYS)[number];
  /** Average revenue per calendar day of that weekday in the range, days without sales counted as 0. */
  average: number;
  days: number;
}

/** Sunday-first. Only days up to `today` count, so the current partial month doesn't drag averages down. */
export const weekdayAverages = (days: Map<DayKey, DayGroup>, buckets: Bucket[], today: DayKey): WeekdayAverage[] => {
  const revenue = WEEKDAYS.map(() => [] as number[]);
  const counts = WEEKDAYS.map(() => 0);
  const last = buckets[buckets.length - 1].to < today ? buckets[buckets.length - 1].to : today;
  for (let key = buckets[0].from; key <= last; key = addDays(key, 1)) {
    const index = utc(key).getUTCDay();
    counts[index] += 1;
    revenue[index].push(days.get(key)?.total ?? 0);
  }
  return WEEKDAYS.map((weekday, index) => ({
    weekday,
    days: counts[index],
    average: counts[index] ? Math.round((sumMoney(revenue[index]) / counts[index]) * 100) / 100 : 0,
  }));
};

/** Clean axis ticks from 0 to at least `max` (1, 2 or 5 × 10ⁿ steps), about `count` of them. */
export const niceTicks = (max: number, count = 4): number[] => {
  if (max <= 0) return [0, 1];
  const rough = max / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? 10 * power;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step);
};

const fullPeso = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });

/** Axis ticks: in full under ₱10,000 (`₱2,500`), compact from there (`₱25k`, `₱1.5M`). */
export const formatAxisPeso = (value: number, max: number): string => {
  if (max < 10_000) return `₱${fullPeso.format(value)}`;
  if (value >= 1_000_000) return `₱${String(Math.round(value / 100_000) / 10).replace(/\.0$/, "")}M`;
  return `₱${String(Math.round(value / 100) / 10).replace(/\.0$/, "")}k`;
};

export const formatDayKey = (key: DayKey) => `${weekday(key)}, ${monthDay(key)}`;
