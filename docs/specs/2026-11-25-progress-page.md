# Progress page

- **Status:** done
- **Date:** 2026-11-25
- **Pages / modules:** `/progress`, `/cms/progress`, `client/features/progress/`
- **Requested by:** owner

## Summary

An owner page that shows how sales are going, drawn as charts from the Sales Tracker's entries: revenue over time, the pace of this period against the previous one, the best-selling products and the best weekdays. It is also a page of the CMS, listed right after the Sales Tracker.

## Scope

**In scope**

- A range filter (7 days, 30 days, 90 days, 12 months) that scopes every number and chart on the page.
- Stat tiles: revenue (with the change against the previous period of the same length), entries, items sold, best day.
- Charts: revenue per day / week / month (columns), cumulative revenue against the previous period (lines), top products by revenue (bars), average revenue per weekday (columns). Each has a hover and keyboard tooltip; revenue also has a table view.
- Light and dark modes from the shared theme.
- `/progress` behind the owner login, and `/cms/progress` in the CMS sidebar after Sales Tracker.

**Out of scope**

- Server changes: the page reads `GET /sales-entries` (every entry, as the tracker does) and computes everything in the browser.
- Profit and cost, targets or goals, exports, custom date ranges.

## Design

- Data: `getSalesEntries()` from `features/sales-tracker/api.ts`, loaded per request by a server loader inside `<Suspense>`, like the tracker. Today's Manila date is computed in the loader and passed down, so server and browser agree.
- Grouping reuses `groupByDay()` and the money helpers of the Sales Tracker (`lib/totals.ts`, `lib/money.ts`); dates stay Manila wall-clock `DayKey`s.
- Buckets: 7 and 30 days are daily; 90 days is 13 weeks ending today; 12 months is calendar months ending this month. The previous period is the same buckets shifted back by the range's length.
- Charts are hand-drawn SVG (no chart library). Colors are two new theme tokens, `--chart-1` (this period, gold) and `--chart-2` (previous period, blue), in both theme blocks, checked for color-vision separation and ≥ 3:1 against the card.
- Story: `docs/architecture/progress.md`.

## Open questions

- None blocking. Ranges and chart choice can be changed in `lib/progress.ts` and `components/progress.tsx`.

## Changes

- Added `client/features/progress/` (loader, page component, charts, `lib/progress.ts`), `client/app/progress/`, `client/app/cms/progress/page.tsx`.
- `client/features/admin/components/admin-shell.tsx`: "Progress" after "Sales Tracker".
- `client/app/globals.css`: `--chart-1`, `--chart-2` in both theme blocks; `client/lib/utils.ts`: their names in `cn`.
- Docs: `docs/architecture/progress.md`, `admin.md`, `theme.md`, `AGENTS.md`.
- Checked with `npm run check`.
