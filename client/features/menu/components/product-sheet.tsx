"use client";

import { type ComponentType, type ReactNode, type RefObject, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerSwipeHandle, DrawerTitle } from "@/components/ui/drawer";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AddToBag } from "@/features/pre-orders/components/add-to-bag";
import { useBag } from "@/features/pre-orders/components/bag-provider";
import { Money, scrimProps } from "@/features/sales-tracker/components/ui/primitives";
import { PHONE_QUERY, useMediaQuery } from "@/features/sales-tracker/hooks/use-environment";
import { cn } from "@/lib/utils";

import { formatLocalPhone, telHref } from "../lib/phone";
import { saleEndsText } from "../lib/pricing";
import type { ProductView, SizeView } from "../types";
import { AvailabilityTag } from "./availability-tag";
import { CloseIcon, PhoneIcon } from "./icons";
import { ProductImage } from "./product-image";

interface ProductSheetProps {
  product: ProductView;
  contactNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The card that opened it, which gets focus back on close (§7.4). */
  finalFocus: RefObject<HTMLElement | null>;
}

const SCRIM = scrimProps("centered", "Close product details");

/**
 * Product detail (§7.4): a centered Dialog from 640px, a bottom-sheet Drawer below it. Both are
 * modal dialogs labelled by the product name, trap focus and close on Escape, the scrim or ×.
 */
export const ProductSheet = ({ product, contactNumber, open, onOpenChange, finalFocus }: ProductSheetProps) => {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const close = () => onOpenChange(false);

  if (isPhone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent variant="product" overlayProps={SCRIM} finalFocus={finalFocus}>
          {/* 44×5 drag handle, 10px from the top */}
          <DrawerSwipeHandle className="h-auto pt-2.5 after:bg-input group-data-[swipe-axis=y]/drawer-popup:h-auto group-data-[swipe-axis=y]/drawer-popup:after:h-1.25 group-data-[swipe-axis=y]/drawer-popup:after:w-11" />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
            <SheetBody
              key={product.id}
              product={product}
              contactNumber={contactNumber}
              onClose={close}
              Title={DrawerTitle}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="product" showCloseButton={false} overlayProps={SCRIM} finalFocus={finalFocus}>
        <SheetBody
          key={product.id}
          product={product}
          contactNumber={contactNumber}
          onClose={close}
          Title={DialogTitle}
        />
      </DialogContent>
    </Dialog>
  );
};

const SheetBody = ({
  product,
  contactNumber,
  onClose,
  Title,
}: {
  product: ProductView;
  contactNumber: string;
  onClose: () => void;
  /** The overlay's own title part, so the dialog is labelled by the product name. */
  Title: ComponentType<{ className?: string; children: ReactNode }>;
}) => {
  const [sizeName, setSizeName] = useState(
    () => (product.sizes.find((size) => size.isAvailable) ?? product.sizes[0])?.name,
  );
  const size = product.sizes.find((s) => s.name === sizeName);
  // The price box and the pre-order follow the picked size; without sizes, the product itself.
  const shown = size ?? product;
  // While pre-orders are open, Add to pre-order is the main action and Call steps back to an outline.
  const preOrdering = useBag() != null && shown.isAvailable;
  return (
    <>
      <div className="relative px-sheet-inset pt-sheet-inset">
        <ProductImage product={product} variant="sheet" />
        <Button
          variant="overlay"
          size="icon-touch"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-6 right-6"
        >
          <CloseIcon />
        </Button>
      </div>
      <div className="flex flex-col gap-3.5 px-6 pt-5 pb-6">
        <span className="text-label-sm font-bold tracking-eyebrow-sm text-honey uppercase">{product.categoryName}</span>
        <Title className="font-display text-sheet-title font-bold text-foreground">{product.name}</Title>
        <AvailabilityTag isAvailable={product.isAvailable} size="sheet" />
        {product.sizes.length > 0 && <SizePicker sizes={product.sizes} value={sizeName} onChange={setSizeName} />}
        <div className="flex flex-col gap-1.5 rounded-card border border-dashed border-input bg-surface-note px-4 py-3.5">
          <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            {/* Same order as the cards: the struck price, then the price to pay on the right. */}
            {shown.isOnSale && (
              <s className="text-card-title whitespace-nowrap text-foreground-faint">
                <span className="sr-only">Was </span>
                <Money amount={shown.price} />
              </s>
            )}
            <Money amount={shown.finalPrice} className="text-sheet-title font-bold whitespace-nowrap text-honey" />
            {size && <span className="text-label text-muted-foreground">{size.name}</span>}
          </span>
          {shown.isOnSale && (
            <span className="tabular text-label text-foreground-2">
              Save <Money amount={shown.savings} /> · {saleEndsText(shown.discountEndsAt)}
            </span>
          )}
        </div>
        <p className="text-cell leading-description whitespace-pre-line text-foreground-2">{product.description}</p>
        <AddToBag key={product.id} product={product} size={size} onAdded={onClose} />
        {contactNumber && (
          <a
            href={telHref(contactNumber)}
            className={cn(buttonVariants({ variant: preOrdering ? "call-outline" : "default", size: "call" }))}
          >
            <PhoneIcon strokeWidth={2.2} />
            <span>
              Call <span className="tabular">{formatLocalPhone(contactNumber)}</span>
            </span>
          </a>
        )}
      </div>
    </>
  );
};

/** One chip per size; a sold-out size is shown but can't be picked. */
const SizePicker = ({
  sizes,
  value,
  onChange,
}: {
  sizes: SizeView[];
  value: string | undefined;
  onChange: (name: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <span id="size-label" className="text-label font-semibold text-foreground">
      Size
    </span>
    <ToggleGroup
      aria-labelledby="size-label"
      variant="chip"
      size="chip"
      spacing={2}
      value={value ? [value] : []}
      onValueChange={(next) => next[0] && onChange(next[0])}
      className="flex-wrap"
    >
      {sizes.map((size) => (
        <ToggleGroupItem key={size.name} value={size.name} disabled={!size.isAvailable}>
          {size.name}
          {!size.isAvailable && <span className="text-label-sm text-muted-foreground"> · sold out</span>}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  </div>
);
