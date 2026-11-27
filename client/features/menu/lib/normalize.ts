import type { BusinessSettings, Category, MenuData, Product, ProductVariant } from "../types";

/**
 * API data to display-safe values. A malformed row can't break the pages: text is trimmed, rows
 * without an id (or a product without a name, price or category) are dropped, and an image that
 * isn't on Cloudinary (the only host `next/image` allows) is treated as missing.
 */

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const list = <T>(v: readonly (T | null | undefined)[] | null | undefined): T[] =>
  Array.isArray(v) ? v.filter((x): x is T => x !== null && x !== undefined) : [];

/** Defaults while the server is unreachable or has no saved settings. No contact number, so no Call button; no pre-orders. */
export const FALLBACK_SETTINGS: BusinessSettings = {
  businessName: "Pato's Pâtisserie",
  tagline: "",
  contactNumber: "",
  preOrdersOpen: false,
};

const imageUrl = (v: unknown) => {
  try {
    const url = new URL(text(v));
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

export const normalizeSettings = (settings: BusinessSettings | null | undefined): BusinessSettings => {
  const hero = imageUrl(settings?.heroImageUrl);
  return {
    businessName: text(settings?.businessName) || FALLBACK_SETTINGS.businessName,
    tagline: text(settings?.tagline),
    contactNumber: text(settings?.contactNumber),
    ...(hero && { heroImageUrl: hero }),
    preOrdersOpen: settings?.preOrdersOpen === true,
  };
};

const normalizeCategory = (category: Category): Category | null => {
  const id = text(category.id);
  const name = text(category.name);
  return id && name ? { id, name, sortOrder: num(category.sortOrder) ?? 0 } : null;
};

const normalizeVariant = (variant: ProductVariant): ProductVariant | null => {
  const name = text(variant?.name);
  const price = num(variant?.price);
  if (!name || price === undefined || price <= 0) return null;
  const discountPrice = num(variant.discountPrice);
  return {
    name,
    price,
    ...(discountPrice !== undefined && { discountPrice }),
    isAvailable: variant.isAvailable === true,
  };
};

/** Fewer than two usable sizes means no sizes. */
const normalizeVariants = (variants: Product["variants"]) => {
  const valid = list(list(variants).map(normalizeVariant));
  return valid.length >= 2 ? valid : [];
};

const normalizeProduct = (product: Product): Product | null => {
  const id = text(product.id);
  const name = text(product.name);
  const categoryId = text(product.categoryId);
  const price = num(product.price);
  if (!id || !name || !categoryId || price === undefined) return null;
  const description = text(product.description);
  const image = imageUrl(product.imageUrl);
  const discountPrice = num(product.discountPrice);
  const discountEndsAt = text(product.discountEndsAt);
  const variants = normalizeVariants(product.variants);
  return {
    id,
    name,
    categoryId,
    shortDescription: text(product.shortDescription),
    ...(description && { description }),
    ...(image && { imageUrl: image }),
    price,
    ...(discountPrice !== undefined && { discountPrice }),
    ...(discountEndsAt && { discountEndsAt }),
    isAvailable: product.isAvailable === true,
    isFeatured: product.isFeatured === true,
    sortOrder: num(product.sortOrder) ?? 0,
    isArchived: product.isArchived === true,
    ...(variants.length > 0 && { variants }),
  };
};

export const normalizeMenu = (menu: MenuData | null | undefined): MenuData => ({
  settings: normalizeSettings(menu?.settings),
  categories: list(list(menu?.categories).map(normalizeCategory)),
  products: list(list(menu?.products).map(normalizeProduct)),
});
