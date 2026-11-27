import type { Category } from "./category";

/** `YYYY-MM-DD`, a calendar date in Asia/Manila. */
export type DateKey = string;

/** One size of a product, e.g. Small / Medium / Large. */
export interface ProductVariant {
  /** 1–30 characters, unique within the product (ignoring case). */
  name: string;
  /** PHP, > 0, up to 2 decimals. */
  price: number;
  /** Amount off: PHP, > 0 and < price. On sale until the product's `discountEndsAt`. */
  discountPrice?: number;
  isAvailable: boolean;
}

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
  /** PHP, > 0, up to 2 decimals. With sizes, the server sets it from the cheapest size. */
  price: number;
  /** PHP, > 0 and < price, up to 2 decimals. With sizes, the cheapest size's. */
  discountPrice?: number;
  /** Last sale day (Manila), for the product and all its sizes. No date = runs until removed. A new or changed date must be today or later. */
  discountEndsAt?: DateKey;
  /** With sizes, the server sets it: true while any size is available. */
  isAvailable: boolean;
  /** Omitted = no sizes; otherwise 2–8 in menu order. Replaced as a whole on save; `[]` on update removes them. */
  variants?: ProductVariant[];
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
