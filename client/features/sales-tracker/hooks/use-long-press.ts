"use client";

import { type MouseEvent, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";

import type { DayKey } from "../types";

/** Also drives the hold bar's animation duration (day-cell.tsx). */
export const HOLD_MS = 1_000;
const MOVE_TOLERANCE_PX = 10;

/**
 * Press-and-hold on a day cell (§7.4, §8.7), which opens that day's details: mouse, touch or
 * pen, primary button only. Exactly 1 s with the fill bar; cancels on release, leave,
 * pointercancel or > 10px of movement; the click that follows a completed hold is swallowed.
 * `enabled: false` keeps a cell from starting a hold.
 */
export const useLongPress = (onComplete: (key: DayKey, cell: HTMLElement) => void) => {
  const [holdingKey, setHoldingKey] = useState<DayKey | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const origin = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const completed = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    origin.current = null;
    setHoldingKey(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = useCallback(
    (event: PointerEvent<HTMLElement>, key: DayKey, enabled: boolean) => {
      completed.current = false;
      cancel();
      if (!event.isPrimary || event.button !== 0 || !enabled) return;
      const cell = event.currentTarget;
      origin.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
      setHoldingKey(key);
      timer.current = setTimeout(() => {
        timer.current = undefined;
        origin.current = null;
        completed.current = true;
        setHoldingKey(null);
        navigator.vibrate?.(10);
        onCompleteRef.current(key, cell);
      }, HOLD_MS);
    },
    [cancel],
  );

  const move = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const from = origin.current;
      if (!from || event.pointerId !== from.pointerId) return;
      if (Math.hypot(event.clientX - from.x, event.clientY - from.y) > MOVE_TOLERANCE_PX) cancel();
    },
    [cancel],
  );

  /** Call first in the cell's onClick; true means "this click ended a hold, ignore it". */
  const swallowClick = useCallback((event: MouseEvent<HTMLElement>) => {
    // Keyboard clicks (Enter / Space) have detail 0 and always go through.
    if (completed.current && event.detail > 0) {
      completed.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    holdingKey,
    swallowClick,
    cellHandlers: (key: DayKey, enabled = true) => ({
      onPointerDown: (event: PointerEvent<HTMLElement>) => start(event, key, enabled),
      onPointerMove: move,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (event: MouseEvent<HTMLElement>) => event.preventDefault(),
    }),
  };
};
