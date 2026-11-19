/**
 * Business Menu domain (docs/MENU_UI_V1.md §3). The API contracts live in `shared/modules/{category,product,menu}.ts`.
 * The view types below are client-only: derived values live in `ProductView`, never in the stored types.
 */

import type { Category } from "@common/modules/category";
import type { DateKey } from "@common/modules/product";

export type { Category } from "@common/modules/category";
export type { BusinessSettings, MenuData } from "@common/modules/menu";
export type { DateKey, Product } from "@common/modules/product";

/** A product as the customer UI shows it, with the derived prices (§3) for one day. */
export interface ProductView {
  id: string;
  name: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  imageUrl?: string;
  isAvailable: boolean;
  price: number;
  isOnSale: boolean;
  finalPrice: number;
  savings: number;
  discountEndsAt?: DateKey;
  /** Both prices in words: `on sale ₱69, was ₱85`, or `₱85` (§10). */
  priceLabel: string;
  /** Full spoken summary for the card (§7.3, §10). */
  ariaLabel: string;
}

export interface MenuSection {
  category: Category;
  products: ProductView[];
}
