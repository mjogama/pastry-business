import type { DayKey, SalesEntry } from "../types";
import { dayKeyOf } from "./dates";
import { lineRevenue, sumMoney } from "./money";

/** Derived values (§3). Nothing here is ever stored. */

export const entryTotal = (entry: Pick<SalesEntry, "items">) =>
  sumMoney(entry.items.map((item) => lineRevenue(item.price, item.quantity)));

export interface DayGroup {
  entries: SalesEntry[];
  total: number;
}

/** Entries grouped by Manila calendar day, each day sorted by time ascending (§4). */
export const groupByDay = (entries: SalesEntry[]): Map<DayKey, DayGroup> => {
  const days = new Map<DayKey, DayGroup>();
  for (const entry of entries) {
    const key = dayKeyOf(entry.date);
    const group = days.get(key) ?? { entries: [], total: 0 };
    group.entries.push(entry);
    days.set(key, group);
  }
  for (const group of days.values()) {
    group.entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt.localeCompare(b.createdAt)));
    group.total = sumMoney(group.entries.map(entryTotal));
  }
  return days;
};

export interface MonthStats {
  total: number;
  maxDayTotal: number;
}

/** `prefix` is `YYYY-MM`. */
export const monthStats = (days: Map<DayKey, DayGroup>, prefix: string): MonthStats => {
  const totals = [...days].filter(([key]) => key.startsWith(prefix)).map(([, group]) => group.total);
  return { total: sumMoney(totals), maxDayTotal: totals.length ? Math.max(...totals) : 0 };
};

/** Bake-level tint alpha (§5.1): 0.05 + 0.20 × dayTotal / max day total of that day's month. */
export const bakeLevel = (dayTotal: number, maxDayTotal: number) =>
  dayTotal > 0 && maxDayTotal > 0 ? 0.05 + (0.2 * dayTotal) / maxDayTotal : 0;

/**
 * A day has one title: set by its first entry, reused by later ones, renamed from the day panel.
 * Older data can mix titles within a day; the latest entry's title wins. `exceptId` leaves out the
 * entry being edited, so moving it to another day picks up that day's title.
 */
export const dayTitle = (group: DayGroup | undefined, exceptId?: string): string | undefined =>
  group?.entries.filter((entry) => entry.id !== exceptId).at(-1)?.title;

export interface ProductTally {
  productName: string;
  quantity: number;
}

/** Each product sold that day once (names matched case-insensitively), with its total quantity, in the order first sold. */
export const dayProducts = (group: Pick<DayGroup, "entries">): ProductTally[] => {
  const tallies = new Map<string, ProductTally>();
  for (const entry of group.entries) {
    for (const item of entry.items) {
      const key = item.productName.toLowerCase();
      const tally = tallies.get(key);
      if (tally) tally.quantity += item.quantity;
      else tallies.set(key, { productName: item.productName, quantity: item.quantity });
    }
  }
  return [...tallies.values()];
};
