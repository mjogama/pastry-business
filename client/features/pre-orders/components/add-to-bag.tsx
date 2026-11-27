"use client";

import { CheckIcon, ShoppingBagIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ProductView, SizeView } from "@/features/menu/types";
import { Money } from "@/features/sales-tracker/components/ui/primitives";

import { totalOf } from "../lib/days";
import { lineKey, MAX_QUANTITY, useBag } from "./bag-provider";
import { QuantityStepper } from "./quantity-stepper";

/**
 * The product sheet's pre-order CTA: a quantity and "Add to pre-order" for the product, or for the
 * size picked in the sheet. Renders nothing when pre-orders are closed (no bag); an out-of-stock
 * product or size says it can't be pre-ordered.
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
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  if (!bag) return null;

  const unit = size ?? product;
  if (!unit.isAvailable) {
    return <p className="text-label text-muted-foreground">Out of stock, so it can’t be pre-ordered right now.</p>;
  }

  const key = lineKey(product.id, size);
  const label = size ? `${product.name} (${size.name})` : product.name;
  const inBag = bag.quantityOf(key);
  const room = MAX_QUANTITY - inBag;

  if (added) {
    return (
      <div className="flex flex-col gap-2.5">
        <p role="status" className="flex items-center gap-2 text-cell font-semibold text-foreground">
          <CheckIcon aria-hidden="true" className="size-5 text-status-available" />
          Added. {inBag} in your pre-order.
        </p>
        <Button
          size="call"
          onClick={() => {
            onAdded?.();
            bag.openCheckout();
          }}
        >
          <ShoppingBagIcon aria-hidden="true" />
          Review pre-order
        </Button>
        <Button variant="call-outline" size="call" onClick={() => onAdded?.()}>
          Keep browsing
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-cell font-semibold text-foreground">
          Pre-order for a school day
          {inBag > 0 && (
            <span className="block text-label font-normal text-muted-foreground">{inBag} already in your bag</span>
          )}
        </span>
        <QuantityStepper value={quantity} max={Math.max(1, room)} label={label} onChange={setQuantity} />
      </div>
      <Button
        size="call"
        disabled={room <= 0}
        onClick={() => {
          bag.add(key, Math.min(quantity, room));
          setAdded(true);
        }}
      >
        <ShoppingBagIcon aria-hidden="true" />
        {room <= 0 ? (
          `Max ${MAX_QUANTITY} per item`
        ) : (
          <span>
            Add to pre-order ·{" "}
            <Money amount={totalOf([{ price: unit.finalPrice, quantity: Math.min(quantity, room) }])} />
          </span>
        )}
      </Button>
    </div>
  );
};
