"use client";

import { CheckIcon, ShoppingBagIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ProductView, SizeView } from "@/features/menu/types";
import { Money } from "@/features/sales-tracker/components/ui/primitives";

import { totalOf } from "../lib/days";
import { lineKey, MAX_QUANTITY, useBag } from "./bag-provider";
import { QuantityStepper } from "./quantity-stepper";

/**
 * The product sheet's pre-order CTA, for the product or the size picked in the sheet. Before it is in
 * the bag: a quantity and "Add to pre-order". Once it is: no Add button again, just − count + bound to
 * the bag (minus at 1 removes it, and the Add button comes back), with Review and Keep browsing.
 * Renders nothing when pre-orders are closed (no bag).
 */
export const AddToBag = ({
  product,
  size,
  onAdded,
}: {
  product: ProductView;
  /** The picked size, for a product with sizes. */
  size?: SizeView | undefined;
  onAdded?: () => void;
}) => {
  const bag = useBag();
  const key = lineKey(product.id, size);
  const [quantity, setQuantity] = useState(1);
  /** The line added last from this sheet. Kept across size changes, so Review and Keep browsing stay. */
  const [addedKey, setAddedKey] = useState<string | null>(null);

  // A different size starts again at 1.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when the picked line changes
  useEffect(() => setQuantity(1), [key]);

  if (!bag) return null;

  const unit = size ?? product;
  const label = size ? `${product.name} (${size.name})` : product.name;
  const inBag = bag.quantityOf(key);
  const room = MAX_QUANTITY - inBag;
  const showNext = inBag > 0 || addedKey !== null;

  // Side by side, so the pair takes one row under the Add button or the stepper.
  const next = (
    <div className="grid grid-cols-2 gap-2.5">
      <Button variant="call-outline" size="call" onClick={() => onAdded?.()}>
        Keep ordering
      </Button>
      <Button
        size="call"
        variant={inBag > 0 ? "default" : "call-outline"}
        onClick={() => {
          onAdded?.();
          bag.openCheckout();
        }}
      >
        <ShoppingBagIcon aria-hidden="true" className="max-[400px]:hidden" />
        Review pre-order
      </Button>
    </div>
  );

  if (inBag > 0) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <span role="status" className="flex min-w-0 items-center gap-2 text-cell font-semibold text-foreground">
            <CheckIcon aria-hidden="true" className="size-5 shrink-0 text-status-available" />
            <span>
              In your pre-order ·{" "}
              <Money amount={totalOf([{ price: unit.finalPrice, quantity: inBag }])} className="text-honey" />
            </span>
          </span>
          <QuantityStepper
            value={inBag}
            min={0}
            max={MAX_QUANTITY}
            label={label}
            onChange={(value) => bag.setQuantity(key, value)}
          />
        </div>
        {next}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {unit.isAvailable ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-cell font-semibold text-foreground">Pre-order for a school day</span>
            <QuantityStepper value={quantity} max={MAX_QUANTITY} label={label} onChange={setQuantity} />
          </div>
          <Button
            size="call"
            onClick={() => {
              bag.add(key, quantity);
              setAddedKey(key);
            }}
          >
            <ShoppingBagIcon aria-hidden="true" />
            <span>
              Add to pre-order · <Money amount={totalOf([{ price: unit.finalPrice, quantity }])} />
            </span>
          </Button>
        </>
      ) : (
        <p className="text-label text-muted-foreground">Out of stock, so it can’t be pre-ordered right now.</p>
      )}
      {showNext && next}
    </div>
  );
};
