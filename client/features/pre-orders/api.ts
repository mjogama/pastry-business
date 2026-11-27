import type { BusinessSettings } from "@common/modules/menu";
import type {
  CreatePreOrderInput,
  ListPreOrdersQuery,
  PreOrder,
  UpdatePreOrderSettingsInput,
  UpdatePreOrderStatusInput,
} from "@common/modules/pre-order";

import { normalizeSettings } from "@/features/menu/lib/normalize";
import { api } from "@/lib/api/client";

/** POST /pre-orders (public). */
export const createPreOrder = (input: CreatePreOrderInput) => api.post<PreOrder>("/pre-orders", input);

/** GET /pre-orders (owner), fresh on every call. */
export const listPreOrders = (query: ListPreOrdersQuery = {}) =>
  api.get<PreOrder[]>("/pre-orders", { query: { ...query }, cache: "no-store" });

/** PATCH /pre-orders/:id/status (owner). */
export const updatePreOrderStatus = (id: string, input: UpdatePreOrderStatusInput) =>
  api.patch<PreOrder>(`/pre-orders/${id}/status`, input);

/** DELETE /pre-orders/:id (owner); cancelled orders only. */
export const deletePreOrder = (id: string) => api.delete<null>(`/pre-orders/${id}`);

/** GET /menu/settings, fresh (the CMS switch must show the saved value). */
export const getPreOrderSettings = async () =>
  normalizeSettings(await api.get<BusinessSettings>("/menu/settings", { cache: "no-store" }));

/** PUT /menu/settings/pre-orders (owner): the switch, hand-over days, cut-off and time. */
export const savePreOrderSettings = async (input: UpdatePreOrderSettingsInput) =>
  normalizeSettings(await api.put<BusinessSettings>("/menu/settings/pre-orders", input));
