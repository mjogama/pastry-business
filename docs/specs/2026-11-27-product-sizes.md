# Product sizes

- **Status:** done
- **Date:** 2026-11-27
- **Pages / modules:** `/cms/menu`, `/menu`, `/`, pre-orders, `server/src/modules/products`, `server/src/modules/pre-order`
- **Requested by:** owner

## Summary

Some products come in sizes (Small, Medium, Large) and others don't. A product can now have optional sizes, each with its own price, discount and availability. The menu card lists the sizes in stock and the sheet lets the customer pick a size; pre-orders record the size.

## Scope

**In scope**

- CMS product form: an optional **Sizes** section with Small / Medium / Large quick-add and free names (e.g. "6-inch", "Box of 12").
- Per size: name, price, discount amount off, available.
- `/menu` and Today's picks: lowest price and in-stock size chips on menu cards; a size picker in the product sheet; pre-orders by size.

**Out of scope**

- Other kinds of options (flavors, add-ons) or a different photo per size.
- A sale end date per size (one date for the product).

## Design

Builds on `docs/architecture/menu.md`, `admin.md` and `pre-orders.md`.

**Rules**

- `Product.variants` (shared `ProductVariant`): omitted or empty = no sizes; otherwise **2–8** sizes in menu order. Names 1–30 characters, unique within the product (ignoring case).
- Each size: `price` (> 0), optional `discountPrice` (amount off, below its price), `isAvailable`.
- The sale end date stays on the product (`discountEndsAt`) and applies to every size's discount; it needs at least one size with a discount.
- With sizes, the server works out the product's `price` and `discountPrice` (from the cheapest size) and `isAvailable` (any size available); values sent for them are replaced. Turning the product's availability on or off without sending sizes (the CMS card switch) sets every size.
- Sending `variants: []` on update removes the sizes; the product keeps the derived price.
- Menu: the menu card shows the lowest price today and chips for the sizes in stock (no "from", at the owner's request); the product is on sale when any size is; out of stock when every size is. The sheet's size picker starts on the first available size; sold-out sizes are shown but can't be picked.
- Pre-orders: an item for a product with sizes must name an available size (`variant`); the order line is saved as `Name (Size)` at that size's price on the hand-over day, so the bake list, emails and Sales Tracker show the size.

**Data:** `product_variants` (`productId` cascade, `position`, `name`, `price`, `discountPrice`, `isAvailable`), replaced as a whole on each save.

## Open questions

Answered: own price per size, discount per size, availability per size, any name with S/M/L quick-add.

## Changes

- **Shared:** `ProductVariant`, `Product.variants` (`shared/modules/product.ts`); `CreatePreOrderItemInput.variant` (`shared/modules/pre-order.ts`).
- **Database:** migration `20261127120000_add_product_variants` (`product_variants`). Applied locally; production gets it on the next Railway deploy.
- **Server:** `modules/products` (schema: 2–8 sizes, unique names, discount below price; repository loads and replaces sizes; service `fromVariants()` derives price, discount and availability, the availability switch sets every size); `modules/pre-order` (size per line, `Name (Size)`, size price).
- **Client:** `features/menu` (`types.ts` `PriceView`/`SizeView`, `lib/pricing.ts`, `lib/menu.ts`, `lib/normalize.ts`, `lib/validation.ts`, `product-card.tsx` size chips, `product-sheet.tsx` size picker); `features/pre-orders` (bag lines by size, checkout, add button, `priceOnDay`); `features/admin` (`SizesEditor` in the product form, sale filter).
- **Tests:** sizes in `products.service.test.ts`, `pre-order.test.ts`, route validation in `menu.test.ts`. `npm run check` passes; `pnpm build` passes; a sized product round-tripped on the local database.
- **Still to check:** the form and sheet in a browser (phone and desktop, light and dark).
