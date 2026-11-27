# Pre-orders: `/menu` bag and `/cms/pre-orders`

Students reserve items for a school day from `/menu`; the owner hands them over at school, and the customer pays then. The CMS page shows a **bake list** per day so enough is baked. Spec: `docs/specs/2026-11-26-pre-orders.md`.

## How it works

- **Open/closed:** `BusinessSettings.preOrdersOpen`, switched with `PUT /menu/settings/pre-orders` (the CMS page's switch, which then expires the `menu` cache tag). When closed, `/menu` renders no `BagProvider`, so every pre-order control hides (`useBag()` returns null), and `POST /pre-orders` answers 409.
- **Customer side (`/menu`):** `MenuContent` wraps the menu in `BagProvider` (bag in `localStorage`, key `pato.preorder.bag`; unavailable or removed products drop out). CTAs: the landing hero's **Pre-order for school** (`/menu#pre-order`), `PreOrderNotice` in the page header beside the title (under it below 768px) (`app/(site)/menu/page.tsx`; a server component reading the settings, shown only while pre-orders are open: a card with the hand-over days and time), **Add to pre-order** in the product sheet (`AddToBag`; Call becomes an outline button), and the sticky `BagBar`. `CheckoutSheet` takes the day, name, email, contact number and note (name, email and number are remembered, key `pato.preorder.customer`). **Place pre-order** first opens `HandoffConfirm` (a modal over the checkout: day and time, be on time, amount to pay, confirmation email, contact us if you can't make it); the order is sent only after the customer ticks **I understand** and confirms there. It no longer asks for a grade & section: `handoff` is `""` on new orders and kept on older ones (shown on their CMS card).
- **Schedule:** `BusinessSettings.preOrderDays` (weekdays 1–5, default Thursday), `preOrderCutoffDays` and `preOrderCutoffTime` (orders close that many days before, 1–6, at that Manila time `HH:mm`, default `23:59`) and `preOrderHandoffTime` (free text, ≤ 80), saved through the same `PUT /menu/settings/pre-orders` (any of `open`, `days`, `cutoffDays`, `cutoffTime`, `handoffTime`). `BagProvider` gets them as `schedule`; the notice and the day picker read it, and the placed/confirmed emails show the time.
- **Owner side (`/cms/pre-orders`):** `AdminPreOrders` loads in the browser (the list needs the owner cookie, which a server component doesn't send): the last 30 days and everything after. The **Hand-over schedule** sits under the header, collapsed by default (its header shows a one-line summary); open, the days are a checklist in a select-style popover (`DaysSelect`) beside the cut-off and the time, all on one row on wide screens. Day chips (days with orders still to do), the bake list (confirmed + new per product), status chips and order cards with Confirm → Handed over, Cancel (optional reason) and Delete (cancelled only).
- **Handed over** (`status: completed`) creates a Sales Tracker entry in the same transaction (`Pre-order <code>`, the order's items, note `<name>`, plus `· <section>` on older orders), so Progress counts it.
- **Emails** (`pre-order.mailer.ts`, Resend HTTP API): placed, confirmed, cancelled. Skipped without `RESEND_API_KEY` and `EMAIL_FROM`; a failure is logged and never fails the request.

## Rules that must stay true

- Hand-over day: one of `preOrderDays` whose cut-off (`day − preOrderCutoffDays` at `preOrderCutoffTime`, Manila) is still ahead, up to 14 days ahead; `pickupDays()` in `client/features/pre-orders/lib/days.ts` and `assertPickupDate()` in `server/src/modules/pre-order/pre-order.service.ts` must agree. `MAX_DAYS_AHEAD` is in both.
- Prices come from the products on the server, at the hand-over day's price (sale while that day ≤ `discountEndsAt`), and are copied into the order.
- **Contact number** (`docs/specs/2026-11-27-pre-order-contact-number.md`): required on new orders, 7–15 digits (spaces, dashes, dots, brackets, a leading +), up to 20 characters; orders placed before it have `""`, and the CMS card hides it then.
- Only available, non-archived products; 1–20 lines, 1–50 each.
- **Sizes** (`docs/specs/2026-11-27-product-sizes.md`): a product with sizes needs an available size (`variant`) per line; the bag keys lines `productId::size`, and the order line is saved as `Name (Size)` at that size's price, so the bake list, emails and Sales Tracker show the size.
- Order reads and changes need the owner session (orders hold customers' emails and numbers). Only `POST /pre-orders` is public; its hidden `website` field must stay empty.

## Where to change what

| To change | Edit |
| --- | --- |
| Status rules, day rules, pricing, the Sales Tracker entry | `server/src/modules/pre-order/pre-order.service.ts`, `pre-order.repository.ts` |
| Field limits | `pre-order.schema.ts` and `shared/modules/pre-order.ts` (client limits in the checkout and `bag-provider.tsx`) |
| Email wording | `renderPreOrderEmail()` in `pre-order.mailer.ts` |
| Bag, bag bar, checkout | `client/features/pre-orders/components/bag-provider.tsx`, `bag-bar.tsx`, `checkout-sheet.tsx` |
| Schedule (days, cut-off, time), its CMS form | `server/src/modules/menu/menu.schema.ts` (`updatePreOrderSettingsSchemas`), `ScheduleForm` in `admin-pre-orders.tsx`, `lib/days.ts` (`pickupDays`, `cutoffText`, `timeText`) |
| Sheet CTA, menu notice, hand-over details modal (`HandoffConfirm` in `checkout-sheet.tsx`), landing CTA | `add-to-bag.tsx`, `pre-order-notice.tsx`, `preOrderHref` in `features/menu/components/landing-hero.tsx` |
| CMS page, bake list | `client/features/pre-orders/components/admin-pre-orders.tsx` |
| API calls | `client/features/pre-orders/api.ts` |
