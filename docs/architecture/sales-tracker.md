# Sales Tracker: `/sales-tracker`

Private owner tool: a month calendar of sales entries (date and time, title, products with price and quantity). Days with sales show a 🦆; the month total is under the grid. Tap a past or current day to add an entry; long-press (or Shift+Enter) to see the day's entries in a side panel (an agenda under the grid on phones). Design spec: `docs/SALES_TRACKET_UI_V1.md` (rules §4, screens §7, responsive §8).

## Where to change what

Paths are under `client/features/sales-tracker/`.

| To change | Edit | Also check |
| --- | --- | --- |
| Month title, arrows, Today, theme button | `TitleRow` in `components/calendar-parts.tsx` | |
| Grid and weekday header | `MonthGrid` in `components/calendar-parts.tsx`, `lib/dates.ts` | |
| Day cell (🦆, total, holiday, sizes) | `components/day-cell.tsx` | Holidays in `lib/holidays.ts` |
| Tap and long-press | `onCellClick` / `viewDay` in `components/sales-tracker.tsx`, `hooks/use-long-press.ts` | |
| Month total | `MonthRevenue` in `components/calendar-parts.tsx`, `lib/totals.ts` | |
| Day panel and phone agenda | `components/day-detail.tsx` | |
| Entry form (fields, suggestions, placement) | `components/entry-popover.tsx` | `PHONE_QUERY` (< 640px), `ANCHOR_QUERY` (≥ 720px) in `hooks/use-environment.ts` |
| Validation rules and messages | `lib/validation.ts` | The store re-validates every write |
| Money format and rounding | `lib/money.ts` | Sums in centavos |
| Where entries are saved | `store/sales-store.ts` | See below |
| Contract | `shared/modules/sales-entry.ts` | |

## Rules that must stay true

- Dates are Asia/Manila wall-clock time: `LocalDateTime` `YYYY-MM-DDTHH:mm`, `DayKey` `YYYY-MM-DD`.
- No future entries; a future day does nothing.
- Validation order: date → title (1–60) → each product (name → price > 0 → quantity ≥ 1). Show the first error only.
- Delete is immediate, with no confirmation.
- Out of scope (spec §2): profit and cost, inventory, multiple users, any link to the menu (product names are free text). Planned later: a year view. Don't build these unasked.

## Important for changes

Entries live in the browser: `localStorage` key `pato.sales-tracker.entries.v1`, read through `useSyncExternalStore`. The database already has `SalesEntry`/`SalesItem` tables but there is no server module. To move to the API, add `server/src/modules/sales-entries`, keep the store's signatures (`createEntry`, `updateEntry`, `deleteEntry`, `useSalesEntries`) and swap their bodies for `api.*` calls.
