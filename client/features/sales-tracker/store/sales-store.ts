"use client";

import { useSyncExternalStore } from "react";
import { newId } from "@/lib/id";
import { entryValidationError, firstEntryError, normalizeEntryInput } from "../lib/validation";
import type { CreateSalesEntryInput, LocalDateTime, ProductSuggestion, SalesEntry } from "../types";

/**
 * Client-side entry store. The server has no sales module yet, so entries live in this
 * browser's localStorage. Every write is validated with the same §4 rules the form uses.
 * To move to the API later, keep these function signatures and swap the bodies for
 * `api.*` calls.
 */

const STORAGE_KEY = "pato.sales-tracker.entries.v1";
const EMPTY: SalesEntry[] = [];

let entries: SalesEntry[] | null = null;
const listeners = new Set<() => void>();

const isEntry = (value: unknown): value is SalesEntry => {
  const entry = value as SalesEntry;
  return (
    typeof entry?.id === "string" &&
    typeof entry.date === "string" &&
    typeof entry.title === "string" &&
    Array.isArray(entry.items) &&
    entry.items.every(
      (item) =>
        typeof item?.productName === "string" && typeof item.price === "number" && typeof item.quantity === "number",
    )
  );
};

const read = (): SalesEntry[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isEntry).map((entry) => ({ ...entry, note: entry.note ?? "" })) : [];
  } catch {
    return [];
  }
};

const write = (next: SalesEntry[]) => {
  entries = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: keep the in-memory copy for this session.
  }
  for (const listener of listeners) listener();
};

const getSnapshot = () => {
  entries ??= read();
  return entries;
};

const getServerSnapshot = () => EMPTY;

const onStorage = (event: StorageEvent) => {
  if (event.key !== STORAGE_KEY) return;
  entries = read();
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
};

const validated = (input: CreateSalesEntryInput, now: LocalDateTime) => {
  const normalized = normalizeEntryInput(input);
  const error = firstEntryError(normalized, now);
  if (error) throw entryValidationError(error);
  return normalized;
};

export const createEntry = (input: CreateSalesEntryInput, now: LocalDateTime): SalesEntry => {
  const stamp = new Date().toISOString();
  const entry: SalesEntry = { id: newId(), ...validated(input, now), createdAt: stamp, updatedAt: stamp };
  write([...getSnapshot(), entry]);
  return entry;
};

export const updateEntry = (id: string, input: CreateSalesEntryInput, now: LocalDateTime): SalesEntry => {
  const current = getSnapshot().find((entry) => entry.id === id);
  if (!current) throw entryValidationError("This entry no longer exists.");
  const entry: SalesEntry = { ...current, ...validated(input, now), updatedAt: new Date().toISOString() };
  write(getSnapshot().map((existing) => (existing.id === id ? entry : existing)));
  return entry;
};

export const deleteEntry = (id: string) => {
  write(getSnapshot().filter((entry) => entry.id !== id));
};

export const useSalesEntries = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

/**
 * Remembered product names with their most recent price by entry date (§3),
 * sorted by name. Stands in for the planned product-names endpoint.
 */
export const productSuggestions = (list: SalesEntry[]): ProductSuggestion[] => {
  const latest = new Map<string, ProductSuggestion & { date: string }>();
  for (const entry of list) {
    for (const item of entry.items) {
      const key = item.productName.trim().toLowerCase();
      const known = latest.get(key);
      if (!known || entry.date >= known.date) {
        latest.set(key, { productName: item.productName.trim(), price: item.price, date: entry.date });
      }
    }
  }
  return [...latest.values()]
    .map(({ productName, price }) => ({ productName, price }))
    .sort((a, b) => a.productName.localeCompare(b.productName));
};
