import { cacheLife, cacheTag } from "next/cache";

import { getMenu } from "../api";
import { FALLBACK_SETTINGS } from "../lib/normalize";
import type { BusinessSettings, MenuData } from "../types";

/**
 * The menu's data source: `GET /menu` on the API.
 *
 * Cached for a few minutes so the static shell (top bar, titles, footer) prerenders and the API
 * isn't called for every visitor; an owner's edit shows up after the revalidate window. A failed
 * request throws, which `use cache` never stores. Anything that depends on today's date (sale
 * prices, picks) is derived per request, outside the cache.
 */
const fetchMenu = async (): Promise<MenuData> => {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("menu");
  return getMenu();
};

/** `null` when the API can't be reached, so a page can say so instead of showing an empty menu. */
export const getMenuData = () => fetchMenu().catch(() => null);

/** Falls back to the default name when the API can't be reached, so the chrome still renders. */
export const getBusinessSettings = async (): Promise<BusinessSettings> =>
  (await getMenuData())?.settings ?? FALLBACK_SETTINGS;
