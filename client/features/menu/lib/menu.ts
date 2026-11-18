import { formatPeso } from "@/features/sales-tracker/lib/money";

import type { Category, DateKey, MenuSection, Product, ProductView } from "../types";
import { finalPrice, isOnSale, savings } from "./pricing";

/** The customer-facing shape of one product on one day (§3). */
export const toProductView = (product: Product, category: Category, today: DateKey): ProductView => {
  const onSale = isOnSale(product, today);
  const final = finalPrice(product, today);
  const priceLabel = onSale
    ? `on sale ${formatPeso(final)}, was ${formatPeso(product.price)}`
    : formatPeso(product.price);
  return {
    id: product.id,
    name: product.name,
    categoryName: category.name,
    shortDescription: product.shortDescription,
    description: product.description?.trim() || product.shortDescription,
    imageUrl: product.imageUrl || undefined,
    isAvailable: product.isAvailable,
    price: product.price,
    isOnSale: onSale,
    finalPrice: final,
    savings: savings(product, today),
    discountEndsAt: onSale ? product.discountEndsAt : undefined,
    priceLabel,
    ariaLabel: `${product.name}, ${priceLabel}, ${product.isAvailable ? "available" : "out of stock"}`,
  };
};

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

/** §4: available first, then `sortOrder`. */
const byMenuOrder = (a: Product, b: Product) => Number(b.isAvailable) - Number(a.isAvailable) || bySortOrder(a, b);

/** Every non-empty category in `sortOrder`, archived products removed (§4, §7.2). */
export const buildSections = (categories: Category[], products: Product[], today: DateKey): MenuSection[] =>
  [...categories].sort(bySortOrder).flatMap((category) => {
    const items = products
      .filter((product) => product.categoryId === category.id && !product.isArchived)
      .sort(byMenuOrder)
      .map((product) => toProductView(product, category, today));
    return items.length > 0 ? [{ category, products: items }] : [];
  });

const PICKS = 4;

/**
 * "Today's picks" (§4): up to 4, featured first, topped up with on-sale items. Never out of stock
 * or archived. Empty means the section is hidden.
 */
export const todaysPicks = (categories: Category[], products: Product[], today: DateKey): ProductView[] => {
  const categoryOrder = new Map(categories.map((category) => [category.id, category.sortOrder]));
  const eligible = products
    .filter((product) => product.isAvailable && !product.isArchived && categoryOrder.has(product.categoryId))
    .sort(
      (a, b) => (categoryOrder.get(a.categoryId) ?? 0) - (categoryOrder.get(b.categoryId) ?? 0) || bySortOrder(a, b),
    );
  // Within the featured items, the ones on sale lead (as in the reference prototype).
  const featured = eligible
    .filter((product) => product.isFeatured)
    .sort((a, b) => Number(isOnSale(b, today)) - Number(isOnSale(a, today)));
  const onSale = eligible.filter((product) => !product.isFeatured && isOnSale(product, today));
  const byId = new Map(categories.map((category) => [category.id, category]));
  return [...featured, ...onSale]
    .slice(0, PICKS)
    .map((product) => toProductView(product, byId.get(product.categoryId) as Category, today));
};

/** `4 items`, `1 item`. */
export const itemCount = (count: number) => `${count} ${count === 1 ? "item" : "items"}`;
