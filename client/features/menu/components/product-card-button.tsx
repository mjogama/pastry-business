"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useMenu } from "./menu-provider";

/** The card's `<button>` (§7.3): opens the sheet. The card's contents are rendered on the server. */
export const ProductCardButton = ({
  productId,
  label,
  isAvailable,
  children,
}: {
  productId: string;
  label: string;
  isAvailable: boolean;
  children: ReactNode;
}) => {
  const { openProduct } = useMenu();
  return (
    <Button
      variant="product"
      size="card"
      aria-label={label}
      aria-haspopup="dialog"
      onClick={(event) => openProduct(productId, event.currentTarget)}
      className={cn(!isAvailable && "opacity-60")}
    >
      {children}
    </Button>
  );
};
