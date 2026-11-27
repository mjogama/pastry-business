import Link from "next/link";

import { cn } from "@/lib/utils";

import type { ProductView } from "../types";
import { AvailabilityTag } from "./availability-tag";
import { PriceBlock } from "./price-block";
import { ProductCardButton } from "./product-card-button";
import { ProductImage } from "./product-image";

/** Card body (menu and picks): sits inside the photo's 12px inset, so the text is indented a little further. */
const MENU_BODY = "flex w-full min-w-0 flex-col gap-2 px-5 pt-4 pb-5";

/**
 * Menu product card (§7.3): image, one-line title, 2-line description with a fixed min-height so
 * cards in a row line up, PriceBlock and AvailabilityTag. Clicking opens the ProductSheet.
 */
export const ProductCard = ({ product }: { product: ProductView }) => (
  <ProductCardButton productId={product.id} label={product.ariaLabel} isAvailable={product.isAvailable}>
    <ProductCardContent product={product} />
  </ProductCardButton>
);

/** What is inside a menu card; the CMS draws the same content around its own controls. */
export const ProductCardContent = ({ product }: { product: ProductView }) => (
  <>
    <ProductImage product={product} variant="card" />
    <span className={MENU_BODY}>
      <span className="truncate text-xl font-bold text-foreground">{product.name}</span>
      <span className="line-clamp-2 min-h-10 text-body leading-card text-muted-foreground">
        {product.shortDescription}
      </span>
      <PriceBlock product={product} variant="menu" className="pt-1" />
      <SizeList sizes={product.sizes} />
      {!product.isAvailable && <AvailabilityTag isAvailable={false} />}
    </span>
  </>
);

/** The sizes in stock as small chips (the card's aria-label already reads them out). */
const SizeList = ({ sizes }: { sizes: ProductView["sizes"] }) => {
  const inStock = sizes.filter((size) => size.isAvailable);
  if (inStock.length === 0) return null;
  return (
    <span aria-hidden="true" className="flex flex-wrap gap-1.5">
      {inStock.map((size) => (
        <span
          key={size.name}
          className="rounded-pill border border-border px-2.5 py-0.5 text-label-sm whitespace-nowrap text-muted-foreground"
        >
          {size.name}
        </span>
      ))}
    </span>
  );
};

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
      <PickCardContent product={product} />
    </Link>
  );
};

/** What is inside a Today's picks card; the CMS draws the same content around its own controls. */
export const PickCardContent = ({ product }: { product: ProductView }) => (
  <>
    <ProductImage product={product} variant="pick" />
    <span className={MENU_BODY}>
      <span className="truncate text-xl font-bold">{product.name}</span>
      <PriceBlock product={product} variant="menu" className="pt-1" />
    </span>
  </>
);
