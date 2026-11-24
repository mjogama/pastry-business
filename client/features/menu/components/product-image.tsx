import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Money } from "@/features/sales-tracker/components/ui/primitives";
import { cn } from "@/lib/utils";

import type { ProductView } from "../types";
import { BreadIcon } from "./icons";
import { SaleBadge } from "./sale-badge";

/** `next/image` sizes per breakpoint for each place a product photo appears (§8). */
export const IMAGE_SIZES = {
  /** Menu grid: 1 column on phones, 2 on tablets, 3–4 in the 1280px container. */
  card: "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  /** Today's picks: same grid with a 240px minimum. */
  pick: "(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 560px) 50vw, 100vw",
  /** Sheet: 560px dialog, full width on phones. */
  sheet: "(min-width: 640px) 532px, 100vw",
} as const;

type Variant = keyof typeof IMAGE_SIZES;

/**
 * 4:3 product photo (16:10 in the sheet), cropped to fill, or the branded placeholder (§4, §6).
 * Greyscale when out of stock. The SALE badge sits on top.
 */
export const ProductImage = ({
  product,
  variant,
  className,
}: {
  product: Pick<ProductView, "name" | "imageUrl" | "isAvailable" | "isOnSale" | "savings">;
  variant: Variant;
  className?: string;
}) => {
  const isSheet = variant === "sheet";
  const isCard = variant === "card" || variant === "pick";
  return (
    <span className={cn("relative block w-full", isCard && "p-3 pb-0", className)}>
      <span
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden bg-img-placeholder text-foreground-faint",
          isSheet ? "aspect-16/10 rounded-sheet-image" : "aspect-4/3",
          isCard && "rounded-sheet-image",
          !product.isAvailable && "grayscale",
        )}
      >
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill sizes={IMAGE_SIZES[variant]} className="object-cover" />
        ) : (
          <>
            <BreadIcon className={isSheet ? "size-12" : "size-9"} strokeWidth={isSheet ? 1.4 : 1.5} />
            <span className={isSheet ? "text-label" : "text-label-sm"}>{isSheet ? "[Product photo]" : "[Photo]"}</span>
          </>
        )}
      </span>
      {product.isOnSale && isCard && (
        <Badge variant="sale" className="absolute top-6 left-6">
          Save <Money amount={product.savings} />
        </Badge>
      )}
      {product.isOnSale && !isCard && (
        <SaleBadge size={isSheet ? "lg" : "default"} className={isSheet ? "top-3.5 left-3.5" : undefined} />
      )}
    </span>
  );
};
