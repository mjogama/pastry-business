# Pre-order hand-over schedule

- **Status:** done
- **Date:** 2026-11-27
- **Pages / modules:** `/menu` (notice, checkout), `/cms/pre-orders`, `server/src/modules/menu`, `server/src/modules/pre-order`
- **Requested by:** owner

## Summary

The owner sells at school only on set days (e.g. every Thursday) for a short time. Customers see how pre-ordering works before they order: the hand-over days, when orders close and the time. Checkout offers only those days.

## Scope

**In scope**

- Owner sets hand-over weekdays (Mon–Fri, at least one), cut-off (1–6 days before, at a closing time, Manila) and a time/place text on `/cms/pre-orders`.
- `/menu` notice: "How it works" (order by the cut-off, email confirmation, meet on the day and pay, please be on time).
- Checkout: info box by the day picker; the picker lists only selling days after the cut-off. The server refuses other days.
- Placed and confirmed emails show the time.

**Out of scope**

- Per-date exceptions (holidays, a skipped week): close pre-orders with the switch instead.

## Design

- `BusinessSettings`: `preOrderDays: number[]` (default `[4]`), `preOrderCutoffDays: number` (default 1), `preOrderCutoffTime: string` (`HH:mm`, default `23:59`), `preOrderHandoffTime: string` (default `""`).
- `PUT /menu/settings/pre-orders` takes any of `open`, `days`, `cutoffDays`, `cutoffTime`, `handoffTime` (`UpdatePreOrderSettingsInput`, replaces `UpdatePreOrdersOpenInput`).
- Rule: a hand-over day is a selling weekday whose cut-off (`day − cutoffDays` at `cutoffTime`, Manila) hasn't passed, ≤ today + 14.
- Story: `docs/architecture/pre-orders.md`.

## Open questions

- Answered: selling day set by the owner in the CMS; cut-off set in the CMS; optional time text set in the CMS.

## Changes

- Shared: `shared/modules/menu.ts`, `shared/modules/pre-order.ts`.
- Server: `menu.schema.ts`, `menu.service.ts`, `menu.repository.ts`, `menu.controller.ts`, `menu.routes.ts`; `pre-order.service.ts` (day rule), `pre-order.mailer.ts` (time in emails).
- Migrations `20261127140000_add_pre_order_schedule` (existing row gets Thursday, 1 day before, no time) and `20261127150000_add_pre_order_cutoff_time` (`23:59`, the old end-of-day).
- Client: `lib/days.ts`, `bag-provider.tsx` (`schedule`), `pre-order-notice.tsx`, `checkout-sheet.tsx`, `admin-pre-orders.tsx` (`ScheduleForm`), `api.ts` (`savePreOrderSettings`), `menu/lib/normalize.ts`, `menu/lib/validation.ts`, `menu-content.tsx`.
- Tests: selling days, cut-off day and time, settings validation, time in emails. `npm run check` passes.
