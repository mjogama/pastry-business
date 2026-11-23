import type { ProductSuggestion, SalesEntry, SalesItem } from "../types";
import { isLocalDateTime } from "./dates";

/**
 * API data to display-safe values. Every field is checked, so a malformed row can't break the
 * calendar's totals: text is trimmed, bad numbers drop the item, and entries without an id or a
 * valid date are dropped (the calendar groups and keys entries by them).
 */

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const list = <T>(v: readonly (T | null | undefined)[] | null | undefined): T[] =>
  Array.isArray(v) ? v.filter((x): x is T => x !== null && x !== undefined) : [];

const normalizeItem = (item: SalesItem): SalesItem | null => {
  const productName = text(item.productName);
  const price = num(item.price);
  const quantity = num(item.quantity);
  return productName && price !== undefined && quantity !== undefined ? { productName, price, quantity } : null;
};

export const normalizeEntry = (entry: SalesEntry): SalesEntry => ({
  id: text(entry.id),
  date: text(entry.date),
  title: text(entry.title) || "Untitled entry",
  items: list(list(entry.items).map(normalizeItem)),
  note: text(entry.note),
  createdAt: text(entry.createdAt),
  updatedAt: text(entry.updatedAt),
});

export const normalizeEntries = (entries: SalesEntry[] | null | undefined): SalesEntry[] =>
  list(entries)
    .map(normalizeEntry)
    .filter((entry) => entry.id && isLocalDateTime(entry.date));

export const normalizeSuggestions = (suggestions: ProductSuggestion[] | null | undefined): ProductSuggestion[] =>
  list(suggestions).flatMap((s) => {
    const productName = text(s.productName);
    const price = num(s.price);
    return productName && price !== undefined ? [{ productName, price }] : [];
  });
