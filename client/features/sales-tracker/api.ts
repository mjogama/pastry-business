import type {
  CreateSalesEntryInput,
  ListSalesEntriesQuery,
  ProductSuggestion,
  SalesEntry,
  UpdateSalesEntryInput,
} from "@common/modules/sales-entry";

import { api } from "@/lib/api/client";

import { normalizeEntries, normalizeEntry, normalizeSuggestions } from "./lib/normalize";

/** GET /sales-entries. With no range it returns every entry; the calendar moves between months without refetching. */
export const getSalesEntries = async (query: ListSalesEntriesQuery = {}) =>
  normalizeEntries(await api.get<SalesEntry[]>("/sales-entries", { query: { ...query }, cache: "no-store" }));

/** GET /sales-entries/product-suggestions */
export const getProductSuggestions = async () =>
  normalizeSuggestions(await api.get<ProductSuggestion[]>("/sales-entries/product-suggestions", { cache: "no-store" }));

/** POST /sales-entries */
export const createSalesEntry = async (input: CreateSalesEntryInput) =>
  normalizeEntry(await api.post<SalesEntry>("/sales-entries", input));

/** PUT /sales-entries/:id. Replaces the whole entry. */
export const updateSalesEntry = async (id: string, input: UpdateSalesEntryInput) =>
  normalizeEntry(await api.put<SalesEntry>(`/sales-entries/${id}`, input));

/** DELETE /sales-entries/:id */
export const deleteSalesEntry = (id: string) => api.delete<null>(`/sales-entries/${id}`);
