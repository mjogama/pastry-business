/**
 * Sales Tracker domain (docs/SALES_TRACKET_UI_V1.md §3). The API contract lives in
 * `shared/modules/sales-entry.ts`. Totals (item, entry, day, month) are never stored; see `lib/totals.ts`.
 */

export type {
  CreateSalesEntryInput,
  DayKey,
  LocalDateTime,
  ProductSuggestion,
  SalesEntry,
  SalesItem,
} from "@common/modules/sales-entry";
