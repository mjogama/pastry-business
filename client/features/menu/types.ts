/** Business Menu domain (docs/MENU_UI_V1.md §3). Derived values live in `ProductView`, never here. */

/** `YYYY-MM-DD`, a calendar date in Asia/Manila. */
export type DateKey = string;

export interface Category {
  id: string;
  /** Unique. */
  name: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  /** 1–60 characters. */
  name: string;
  categoryId: Category["id"];
  /** ≤ 120 characters, shown on cards. */
  shortDescription: string;
  /** Detail sheet; falls back to `shortDescription`. */
  description?: string;
  /** Placeholder when empty. */
  imageUrl?: string;
  /** PHP, > 0. */
  price: number;
  /** PHP, > 0 and < price. */
  discountPrice?: number;
  /** Last sale day (Manila). No date = runs until removed. */
  discountEndsAt?: DateKey;
  isAvailable: boolean;
  /** "Today's picks". */
  isFeatured: boolean;
  /** Within its category. */
  sortOrder: number;
  /** Hidden everywhere. */
  isArchived: boolean;
}

/** Single row. */
export interface BusinessSettings {
  businessName: string;
  tagline: string;
  /** E.164, e.g. `+639170000000`. Shown in the local format. */
  contactNumber: string;
  heroImageUrl?: string;
}

export interface MenuData {
  settings: BusinessSettings;
  categories: Category[];
  products: Product[];
}

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
