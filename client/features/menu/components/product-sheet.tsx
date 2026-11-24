"use client";

import type { ComponentType, ReactNode, RefObject } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerSwipeHandle, DrawerTitle } from "@/components/ui/drawer";
import { Money, scrimProps } from "@/features/sales-tracker/components/ui/primitives";
import { PHONE_QUERY, useMediaQuery } from "@/features/sales-tracker/hooks/use-environment";
import { cn } from "@/lib/utils";

import { formatLocalPhone, telHref } from "../lib/phone";
import { saleEndsText } from "../lib/pricing";
import type { ProductView } from "../types";
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
            <SheetBody product={product} contactNumber={contactNumber} onClose={close} Title={DrawerTitle} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="product" showCloseButton={false} overlayProps={SCRIM} finalFocus={finalFocus}>
        <SheetBody product={product} contactNumber={contactNumber} onClose={close} Title={DialogTitle} />
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
}) => (
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
      <div className="flex flex-col gap-1.5 rounded-card border border-dashed border-input bg-surface-note px-4 py-3.5">
        <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          {product.isOnSale && (
            <s className="text-card-title whitespace-nowrap text-foreground-faint">
              <span className="sr-only">Was </span>
              <Money amount={product.price} />
            </s>
          )}
          <Money amount={product.finalPrice} className="text-sheet-title font-bold whitespace-nowrap text-honey" />
        </span>
        {product.isOnSale && (
          <span className="tabular text-label text-foreground-2">
            Save <Money amount={product.savings} /> · {saleEndsText(product.discountEndsAt)}
          </span>
        )}
      </div>
      <p className="text-cell leading-description whitespace-pre-line text-foreground-2">{product.description}</p>
      {contactNumber && (
        <a href={telHref(contactNumber)} className={cn(buttonVariants({ variant: "default", size: "call" }))}>
          <PhoneIcon strokeWidth={2.2} />
          <span>
            Call <span className="tabular">{formatLocalPhone(contactNumber)}</span>
          </span>
        </a>
      )}
    </div>
  </>
);
