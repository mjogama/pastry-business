# Sales Tracker on the server

- **Status:** done
- **Date:** 2026-11-23
- **Pages / modules:** `/sales-tracker`, `server/src/modules/sales-entry`
- **Requested by:** owner

## Summary

Move Sales Tracker entries from the browser's `localStorage` to the API and database, following the Recipe Book's structure so both server-backed pages work the same way.

## Scope

**In scope**

- Server module `sales-entry` at `/api/v1/sales-entries`: list (optional day range), product suggestions, get, create, replace, delete.
- Client: `api.ts`, `lib/normalize.ts`, a loader server component inside `<Suspense>`, writes through the API with errors shown in the popover.
- A shared `apiErrorMessage()` used by both Recipe Book and Sales Tracker.

**Out of scope**

- Importing entries already saved in a browser's `localStorage` (old key `pato.sales-tracker.entries.v1`).
- Auth, and anything in the tracker's own out-of-scope list (`docs/architecture/sales-tracker.md`).

## Design

- Contract: `shared/modules/sales-entry.ts` (unchanged). Zod in `sales-entry.schema.ts` mirrors `lib/validation.ts` (date format, title 1–60, ≥ 1 item, name, price > 0 with ≤ 2 decimals, integer quantity ≥ 1, note trimmed).
- The future-date rule lives in the service, with an injectable clock and a 5-minute allowance for client clock skew.
- Dates are Manila wall-clock time stored in a `TIMESTAMP` without a time zone, read and written as UTC.
- Product suggestions are built in the service from every sold line, newest entry first.
- Client loads all entries once and keeps them in state; month navigation doesn't refetch. Suggestions refresh after each save or delete.
- The existing tables were used, so no migration.

## Open questions

- Should old browser-saved entries be imported? (Not built.)
- Loading every entry is fine for now; switch to `from`/`to` per month if the list grows large.

## Changes

- Server: `server/src/modules/sales-entry/*` (scaffolded with `npm run module:create -- sales-entry`), mounted in `routes/v1/routes.ts`; tests `server/tests/sales-entry.test.ts` (validation only, no database writes) and `sales-entry.service.test.ts`.
- Client: `features/sales-tracker/api.ts`, `lib/normalize.ts`, `components/sales-tracker-loader.tsx`; `app/sales-tracker/page.tsx` uses `<Suspense>`; `sales-tracker.tsx` and `entry-popover.tsx` write through the API; `store/sales-store.ts` removed; validation helpers for the store removed.
- Shared client: `apiErrorMessage()` in `client/lib/api/client.ts` replaces `recipeErrorMessage()` in `features/recipes/api.ts`.
- Docs: `docs/architecture/sales-tracker.md`, `system.md`, `recipes.md`.
- Checked with `npm run check` (41 server tests pass; both apps typecheck and lint).
