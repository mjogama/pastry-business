"use client";

import { CalendarClockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { itemCount } from "@/features/menu/lib/menu";

import { useBag } from "./bag-provider";

/** Under the /menu title while pre-orders are open: how it works, and Review once the bag has items. */
export const PreOrderNotice = () => {
  const bag = useBag();
  if (!bag) return null;
  return (
    <section
      id="pre-order"
      aria-label="Pre-orders"
      className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-dashed border-input bg-surface-note px-5 py-4"
    >
      <div className="flex min-w-0 items-start gap-3.5">
        <CalendarClockIcon aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-honey" />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-body-lg font-bold text-foreground">Pre-order for school</span>
          <span className="text-body text-foreground-2">
            Reserve items for a school day so they don’t run out. We hand them over at school and you pay then. Tap an
            item to add it.
          </span>
        </div>
      </div>
      {bag.count > 0 && (
        <Button size="pill" onClick={bag.openCheckout} aria-haspopup="dialog">
          Review · {itemCount(bag.count)}
        </Button>
      )}
    </section>
  );
};
