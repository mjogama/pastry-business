"use client";

import { useSyncExternalStore } from "react";
import { toLocalDateTime } from "../lib/dates";
import type { LocalDateTime } from "../types";

/**
 * Current Manila time, refreshed every 15 s so "today", the future-day rules and
 * the date picker's max stay correct across midnight. Null while prerendering.
 */
let nowValue: LocalDateTime | null = null;
const nowListeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

const tick = () => {
  const next = toLocalDateTime(new Date());
  if (next !== nowValue) {
    nowValue = next;
    for (const listener of nowListeners) listener();
  }
};

const subscribeNow = (listener: () => void) => {
  nowListeners.add(listener);
  if (!timer) timer = setInterval(tick, 15_000);
  return () => {
    nowListeners.delete(listener);
    if (nowListeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
};

const getNow = () => {
  nowValue ??= toLocalDateTime(new Date());
  return nowValue;
};

export const useNow = () => useSyncExternalStore(subscribeNow, getNow, () => null);

/** Reads the clock immediately (e.g. when a hold completes), not the last tick. */
export const readNow = (): LocalDateTime => {
  tick();
  return getNow();
};

/** `matchMedia` as state. False while prerendering. */
export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (listener) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", listener);
      return () => list.removeEventListener("change", listener);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

/** §8 breakpoints. */
export const PHONE_QUERY = "(max-width: 639.98px)";
/** The popover may anchor beside a held cell only at ≥ 720px (§7.7, §8.4). */
export const ANCHOR_QUERY = "(min-width: 720px)";
