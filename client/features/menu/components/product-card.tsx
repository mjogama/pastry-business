import Link from "next/link";

import { cn } from "@/lib/utils";

import type { ProductView } from "../types";
import { AvailabilityTag } from "./availability-tag";
import { PriceBlock } from "./price-block";
import { ProductCardButton } from "./product-card-button";
import { ProductImage } from "./product-image";

/** Card body: padding 16 / 16 / 18, gap 8 (§7.3). */
const BODY = "flex w-full min-w-0 flex-col gap-2 px-4 pt-4 pb-4.5";

/**
 * Menu product card (§7.3): image, one-line title, 2-line description with a fixed min-height so
 * cards in a row line up, PriceBlock and AvailabilityTag. Clicking opens the ProductSheet.
 */
export const ProductCard = ({ product }: { product: ProductView }) => (
  <ProductCardButton productId={product.id} label={product.ariaLabel} isAvailable={product.isAvailable}>
    <ProductImage product={product} variant="card" />
    <span className={BODY}>
      <span className="truncate text-card-title font-semibold text-foreground">{product.name}</span>
      <span className="line-clamp-2 min-h-10 text-body leading-card text-muted-foreground">
        {product.shortDescription}
      </span>
      <PriceBlock product={product} className="pt-0.5" />
      <AvailabilityTag isAvailable={product.isAvailable} />
    </span>
  </ProductCardButton>
);

/**
 * Today's picks card (§7.1): image, SALE badge, name, price. Links to that product on /menu,
 * which opens its sheet.
 */
export const PickCard = ({ product }: { product: ProductView }) => {
  return (
    <Link
      href={`/menu?p=${encodeURIComponent(product.id)}`}
      aria-label={`${product.name}, ${product.priceLabel}. View menu`}
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-product border border-border bg-surface-product text-foreground",
        "transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-line-dashed motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <ProductImage product={product} variant="pick" />
      <span className={BODY}>
        <span className="truncate text-card-title font-semibold">{product.name}</span>
        <PriceBlock product={product} variant="pick" />
      </span>
    </Link>
  );
};
