import type { BusinessSettings, MenuData } from "@common/modules/menu";

import { api } from "@/lib/api/client";

import { normalizeMenu, normalizeSettings } from "./lib/normalize";

/** GET /menu: settings, categories and every non-archived product, in one request. */
export const getMenu = async () => normalizeMenu(await api.get<MenuData>("/menu"));

/** GET /menu/settings */
export const getSettings = async () => normalizeSettings(await api.get<BusinessSettings>("/menu/settings"));
