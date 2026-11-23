# Sales Tracker UI adjustments

- **Status:** done
- **Date:** 2026-11-23
- **Pages / modules:** `/sales-tracker`
- **Requested by:** owner

## Summary

Follow-up to `2026-11-23-sales-tracker-api.md`: a day-level title, richer day cells, a responsive calendar that keeps its cell size, a revised header and a slimmer entry form.

## Scope

**In scope**

- One title per day: set by the day's first entry, read-only in the entry form afterwards, renamed inline in the day panel (updates every entry of the day).
- Day cells list the first 3 products with quantities, then "+N more products".
- Cells keep one size; the grid changes its column count by container width (7 columns from 70rem) instead of shrinking cells.
- Side panel on every device (full width on phones); the phone Day agenda is removed.
- Header order: month, controls (theme toggle with ‹ Today ›), revenue pill.
- Entry form: filled placeholder-only fields, stacked product rows, 320px popover, new `--surface-field` token.

**Out of scope**

- A backend field for a day title (titles stay per entry; a rename sends one `PUT` per entry).
- Updating the original design spec's text beyond a pointer to the story.

## Design

See "Differences from the design spec" and the rules in `docs/architecture/sales-tracker.md`.

## Open questions

- Importing entries saved in a browser's `localStorage` (from the API spec) is still not built.
- Days that already hold entries with different titles show the latest entry's title as the day title.

## Changes

- `components/calendar-parts.tsx` (`TitleRow`, `MonthGrid`), `day-cell.tsx`, `day-detail.tsx` (agenda removed), `day-title.tsx` (new), `entry-popover.tsx`, `sales-tracker.tsx`; `lib/totals.ts` (`dayProducts`, `dayTitle`), `lib/dates.ts` (`weekdayOf`).
- `client/app/globals.css`: added `--spacing-cell-min`, `--surface-field`; removed `--spacing-cell-compact`, the revenue card sizes, `--breakpoint-rows`; popover 320px, entry title 20px. `client/lib/utils.ts`: `surface-field` in `cn`.
- Docs: `docs/architecture/sales-tracker.md`, `theme.md`, a pointer at the top of `docs/SALES_TRACKET_UI_V1.md`.
- Checked with `npm run check`; not yet checked on devices.
