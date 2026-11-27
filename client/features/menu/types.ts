/**
 * Business Menu domain (docs/MENU_UI_V1.md §3). The API contracts live in `shared/modules/{category,product,menu}.ts`.
 * The view types below are client-only: derived values live in `ProductView`, never in the stored types.
 */

import type { Category } from "@common/modules/category";
import type { DateKey } from "@common/modules/product";

export type { Category } from "@common/modules/category";
export type { BusinessSettings, MenuData } from "@common/modules/menu";
export type { DateKey, Product, ProductVariant } from "@common/modules/product";

/** One price on one day: the regular price, and the sale price while the sale runs (§3). */
export interface PriceView {
  price: number;
  isOnSale: boolean;
  finalPrice: number;
  savings: number;
  discountEndsAt?: DateKey;
}

/** One size of a product, priced for one day. */
export interface SizeView extends PriceView {
  name: string;
  isAvailable: boolean;
}

/**
 * A product as the customer UI shows it, with the derived prices (§3) for one day. With sizes, the
 * top-level prices are the size that is cheapest today (an available one if any); the card lists
 * the sizes in stock.
 */
export interface ProductView extends PriceView {
  id: string;
  name: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  imageUrl?: string;
  isAvailable: boolean;
  /** Empty when the product has no sizes. */
  sizes: SizeView[];
  /** Both prices in words, then any sizes in stock: `on sale ₱69, was ₱85`, `₱40, sizes Small, Large`, or `₱85` (§10). */
  priceLabel: string;
  /** Full spoken summary for the card (§7.3, §10). */
  ariaLabel: string;
}

export interface MenuSection {
  category: Category;
  products: ProductView[];
}
