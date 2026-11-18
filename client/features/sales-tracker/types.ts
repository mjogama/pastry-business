/**
 * Sales Tracker domain (docs/SALES_TRACKET_UI_V1.md §3).
 * Totals (item, entry, day, month) are never stored; see `lib/totals.ts`.
 */

/** Local wall-clock date and time in Asia/Manila, `YYYY-MM-DDTHH:mm`. */
export type LocalDateTime = string;

/** Calendar day in Asia/Manila, `YYYY-MM-DD`. */
export type DayKey = string;

export interface SalesItem {
  productName: string;
  /** PHP, > 0, up to 2 decimals. */
  price: number;
  /** Integer ≥ 1. */
  quantity: number;
}

export interface SalesEntry {
  id: string;
  date: LocalDateTime;
  title: string;
  items: SalesItem[];
  note: string;
  createdAt: string;
  updatedAt: string;
}

/** What the popover submits for create and edit. */
export interface SalesEntryInput {
  date: LocalDateTime;
  title: string;
  items: SalesItem[];
  note: string;
}

/** A remembered product name with its most recent price (by entry date). */
export interface ProductSuggestion {
  productName: string;
  price: number;
}
