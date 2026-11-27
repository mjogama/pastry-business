# Pre-orders

- **Status:** in progress
- **Date:** 2026-11-26
- **Pages / modules:** `/menu`, `/` (CTA), `/cms/pre-orders`, `server/src/modules/pre-orders`, `server/src/modules/menu` (open/closed switch)
- **Requested by:** owner

## Summary

Students reserve items from `/menu` for a school day and get them handed over at school; they pay on hand-over. The owner sees every pre-order in the CMS with a **bake list** (totals per product for a day), so the right quantity is baked and nobody is left short. Completing an order records it in the Sales Tracker.

## Scope

**In scope**

- `/menu`: a pre-order bag. "Add to pre-order" (with quantity) in the product sheet, a sticky bag bar, and a checkout sheet (hand-over day, name, email, grade & section, note).
- CTAs: landing hero **Pre-order** button, a pre-order notice under the `/menu` title, the sheet's add button and the sticky bag bar.
- Emails to the customer when an order is placed, confirmed and cancelled (Resend).
- `/cms/pre-orders`: the open/closed switch, upcoming days with order counts, the bake list for a day, the orders with Confirm / Cancel / Complete / Delete.
- Complete creates a Sales Tracker entry.

**Out of scope**

- Online payment, delivery addresses, customer accounts or an order-status page.
- Stock limits per day (the bake list is the planning tool).

## Design

Builds on `docs/architecture/menu.md` and `docs/architecture/admin.md`.

**Rules**

- **Hand-over day:** a weekday (Mon–Fri), from tomorrow (Manila) up to 14 days ahead.
- **Items:** non-archived, available products; 1–20 lines, 1–50 each; the same product is merged.
- **Price:** the product's price on the hand-over day (a sale counts when that day ≤ `discountEndsAt`), copied into the order so later edits don't change it.
- **Customer:** name (1–60), email, grade & section / where to find them (1–80), optional note (≤ 300).
- **Statuses:** `pending` → `confirmed` → `completed`; `pending` or `confirmed` → `cancelled` (optional reason). Only cancelled orders can be deleted.
- **Complete** (confirmed only) creates a Sales Tracker entry in the same transaction: date now (Manila), title `Pre-order <code>`, the order's items, note `<name> · <section>`. Undo by deleting that entry in the Sales Tracker.
- **Open/closed:** `BusinessSettings.preOrdersOpen` (default on). When off, the menu hides every pre-order CTA and the API refuses new orders.
- **Code:** 6 characters (no 0/O/1/I), shown to the customer and the owner.
- **Spam:** the global rate limit plus a hidden `website` field that must stay empty.
- **Emails** never block or fail a request; without `RESEND_API_KEY` and `EMAIL_FROM` they are skipped.

**API** (`shared/modules/pre-order.ts`)

| Route | Auth | |
| --- | --- | --- |
| `POST /pre-orders` | public | Place an order |
| `GET /pre-orders?from&to&status` | owner | By hand-over day, then creation |
| `GET /pre-orders/:id` | owner | |
| `PATCH /pre-orders/:id/status` | owner | `{ status, reason? }` |
| `DELETE /pre-orders/:id` | owner | Cancelled only |
| `PUT /menu/settings/pre-orders` | owner | `{ open }` |

**Data:** `pre_orders`, `pre_order_items` (product id kept nullable so deleting a product keeps the order), `business_settings.preOrdersOpen`, `pre_orders.salesEntryId` (unique, set null if the entry is deleted).

## Open questions

Answered: hand-over at school (no delivery), pay on hand-over, 1 day ahead with email updates, completed orders go to the Sales Tracker.

Defaults chosen, to confirm with the owner:

- Weekdays only, up to 14 days ahead, and orders accepted until midnight the day before.
- Only available (in-stock) products can be pre-ordered.
- Asking for "Grade & section" as the hand-over detail.

## Changes

- **Shared:** `shared/modules/pre-order.ts` (new); `BusinessSettings.preOrdersOpen`, `UpdateBusinessSettingsInput` now omits it (`shared/modules/menu.ts`).
- **Server:** `server/src/modules/pre-order/` (schema, repository, service, controller, routes, module, `pre-order.mailer.ts`), mounted at `/pre-orders`; `PUT /menu/settings/pre-orders` in `modules/menu`.
- **Database:** migration `20261126120000_add_pre_orders` (`pre_orders`, `pre_order_items`, `PreOrderStatus`, `business_settings.preOrdersOpen`). Not applied yet; it runs with `npm run server:migrate` or on the next Railway deploy.
- **Env:** optional `RESEND_API_KEY`, `EMAIL_FROM` (`server/src/app/config/env.ts`, `.env.example`).
- **Client:** `client/features/pre-orders/` (bag, bag bar, checkout, sheet CTA, notice, CMS page), `app/cms/pre-orders/page.tsx`, sidebar entry; `product-sheet.tsx`, `menu-content.tsx`, `landing-hero.tsx`, `(site)/page.tsx`, `lib/normalize.ts`, `lib/validation.ts`.
- **Tests:** `server/tests/pre-order.test.ts`; `menu.test.ts` updated. `npm run check` passes.
- **Docs:** `docs/architecture/pre-orders.md` (new), `menu.md`, `admin.md`, `system.md`, `AGENTS.md`.
- **Still to check:** the flow in a browser after migrating (phone and desktop, light and dark), and a real email once Resend is set up.
