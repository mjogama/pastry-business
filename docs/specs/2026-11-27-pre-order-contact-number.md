# Pre-order contact number

- **Status:** done
- **Date:** 2026-11-27
- **Pages / modules:** `/menu` checkout, `/cms/pre-orders`, `server/src/modules/pre-order`
- **Requested by:** owner

## Summary

Checkout asks for a contact number as well as the email, so the owner can call or text a customer about an order. Emails are unchanged.

## Scope

**In scope**

- A required **Contact number** field in the checkout (remembered with the other details).
- Stored on the order; shown as a `tel:` link on the CMS order card.

**Out of scope**

- SMS notifications; replacing or dropping the email.

## Design

- `PreOrder.contactNumber: string`, `CreatePreOrderInput.contactNumber: string` in `shared/modules/pre-order.ts`.
- Zod: trimmed, `^\+?[\d\s().-]{7,20}$` and 7–15 digits, message "Enter a valid contact number".
- Prisma: `PreOrder.contactNumber VARCHAR(20)`; existing rows get `''` (the CMS card hides an empty number).
- Story: `docs/architecture/pre-orders.md`.

## Open questions

- Answered: keep email required alongside the number.

## Changes

- `shared/modules/pre-order.ts`, `pre-order.schema.ts`, `pre-order.repository.ts`, `server/prisma/schema.prisma`.
- Migration `20261127130000_add_pre_order_contact_number`.
- `checkout-sheet.tsx` (field), `admin-pre-orders.tsx` (tel link).
- `server/tests/pre-order.test.ts` (stored on create; invalid number refused).
- Checked with `npm run check`.
