import type { BusinessSettings, MenuData } from "../types";
import { seed } from "./seed";

/**
 * The menu's data source. Today this is the development seed. When the Products manager (§9)
 * lands, these become calls to its API and the pages don't change.
 *
 * Cached so the static shell (top bar, titles, footer) prerenders. Anything that depends on
 * today's date (sale prices, picks) is derived per request, outside the cache.
 */
export async function getMenuData(): Promise<MenuData> {
  "use cache";
  return seed;
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  "use cache";
  return seed.settings;
}
