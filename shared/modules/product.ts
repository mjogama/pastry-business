import type { Category } from "./category";

/** `YYYY-MM-DD`, a calendar date in Asia/Manila. */
export type DateKey = string;

export interface Product {
  id: string;
  /** 1–60 characters. */
  name: string;
  categoryId: Category["id"];
  /** 1–120 characters, shown on cards. */
  shortDescription: string;
  /** Detail sheet; falls back to `shortDescription`. */
  description?: string;
  /** Placeholder when empty. */
  imageUrl?: string;
  /** PHP, > 0, up to 2 decimals. */
  price: number;
  /** PHP, > 0 and < price, up to 2 decimals. */
  discountPrice?: number;
  /** Last sale day (Manila). No date = runs until removed. A new or changed date must be today or later. */
  discountEndsAt?: DateKey;
  isAvailable: boolean;
  /** "Today's picks". */
  isFeatured: boolean;
  /** Within its category. */
  sortOrder: number;
  /** Hidden everywhere. */
  isArchived: boolean;
}

export interface ListProductsQuery {
  limit?: number;
  categoryId?: Category["id"];
  /** Archived products are left out unless this is true. */
  includeArchived?: boolean;
}

export type CreateProductInput = Omit<Product, "id">;

/** Optional fields a `PATCH` can clear by sending `null`. */
type ClearableProductKey = "description" | "imageUrl" | "discountPrice" | "discountEndsAt";

/** Only the fields sent change; `null` clears an optional field. */
export type UpdateProductInput = Partial<
  Omit<CreateProductInput, ClearableProductKey> & { [K in ClearableProductKey]: CreateProductInput[K] | null }
>;
