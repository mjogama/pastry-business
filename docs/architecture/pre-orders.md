# Pre-orders: `/menu` bag and `/cms/pre-orders`

Students reserve items for a school day from `/menu`; the owner hands them over at school, and the customer pays then. The CMS page shows a **bake list** per day so enough is baked. Spec: `docs/specs/2026-11-26-pre-orders.md`.

## How it works

- **Open/closed:** `BusinessSettings.preOrdersOpen`, switched with `PUT /menu/settings/pre-orders` (the CMS page's switch, which then expires the `menu` cache tag). When closed, `/menu` renders no `BagProvider`, so every pre-order control hides (`useBag()` returns null), and `POST /pre-orders` answers 409.
- **Customer side (`/menu`):** `MenuContent` wraps the menu in `BagProvider` (bag in `localStorage`, key `pato.preorder.bag`; unavailable or removed products drop out). CTAs: the landing hero's **Pre-order for school** (`/menu#pre-order`), `PreOrderNotice` under the title, **Add to pre-order** in the product sheet (`AddToBag`; Call becomes an outline button), and the sticky `BagBar`. `CheckoutSheet` takes the day, name, grade & section, email and note (name, email and section are remembered, key `pato.preorder.customer`).
- **Owner side (`/cms/pre-orders`):** `AdminPreOrders` loads in the browser (the list needs the owner cookie, which a server component doesn't send): the last 30 days and everything after. Day chips (days with orders still to do), the bake list (confirmed + new per product), status chips and order cards with Confirm → Handed over, Cancel (optional reason) and Delete (cancelled only).
- **Handed over** (`status: completed`) creates a Sales Tracker entry in the same transaction (`Pre-order <code>`, the order's items, note `<name> · <section>`), so Progress counts it.
- **Emails** (`pre-order.mailer.ts`, Resend HTTP API): placed, confirmed, cancelled. Skipped without `RESEND_API_KEY` and `EMAIL_FROM`; a failure is logged and never fails the request.

## Rules that must stay true

- Hand-over day: a weekday from tomorrow (Manila) up to 14 days ahead. `MAX_DAYS_AHEAD` is in both `server/src/modules/pre-order/pre-order.service.ts` and `client/features/pre-orders/lib/days.ts`.
- Prices come from the products on the server, at the hand-over day's price (sale while that day ≤ `discountEndsAt`), and are copied into the order.
- Only available, non-archived products; 1–20 lines, 1–50 each.
- Order reads and changes need the owner session (orders hold customers' emails). Only `POST /pre-orders` is public; its hidden `website` field must stay empty.

## Where to change what

| To change | Edit |
| --- | --- |
| Status rules, day rules, pricing, the Sales Tracker entry | `server/src/modules/pre-order/pre-order.service.ts`, `pre-order.repository.ts` |
| Field limits | `pre-order.schema.ts` and `shared/modules/pre-order.ts` (client limits in the checkout and `bag-provider.tsx`) |
| Email wording | `renderPreOrderEmail()` in `pre-order.mailer.ts` |
| Bag, bag bar, checkout | `client/features/pre-orders/components/bag-provider.tsx`, `bag-bar.tsx`, `checkout-sheet.tsx` |
| Sheet CTA, menu notice, landing CTA | `add-to-bag.tsx`, `pre-order-notice.tsx`, `preOrderHref` in `features/menu/components/landing-hero.tsx` |
| CMS page, bake list | `client/features/pre-orders/components/admin-pre-orders.tsx` |
| API calls | `client/features/pre-orders/api.ts` |
