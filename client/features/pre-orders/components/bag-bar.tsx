"use client";

import { ShoppingBagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CONTAINER } from "@/features/menu/lib/layout";
import { itemCount } from "@/features/menu/lib/menu";
import { Money } from "@/features/sales-tracker/components/ui/primitives";
import { cn } from "@/lib/utils";

import { totalOf } from "../lib/days";
import { useBag } from "./bag-provider";

/**
 * The sticky CTA at the bottom of /menu while the bag has something in it: count, today's total
 * and Review, which opens checkout. A spacer of the same height keeps it off the footer.
 */
export const BagBar = () => {
  const bag = useBag();
  if (!bag || bag.count === 0) return null;
  const total = totalOf(bag.lines.map(({ product, quantity }) => ({ price: product.finalPrice, quantity })));
  return (
    <>
      <div aria-hidden="true" className="h-24" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className={cn(CONTAINER, "flex justify-center")}>
          <Button
            onClick={bag.openCheckout}
            aria-haspopup="dialog"
            className="pointer-events-auto h-auto min-h-cta w-full max-w-xl justify-between gap-3 rounded-pill px-5 py-2 text-left shadow-popover"
          >
            <span className="flex min-w-0 items-center gap-3">
              <ShoppingBagIcon aria-hidden="true" className="size-5" />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="text-label-sm font-semibold uppercase tracking-label">Your pre-order</span>
                <span className="tabular truncate text-body-lg font-bold">
                  {itemCount(bag.count)} · <Money amount={total} />
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-pill border-2 border-primary-foreground px-4 py-1.5 text-cell font-bold">
              Review
            </span>
          </Button>
        </div>
      </div>
    </>
  );
};
