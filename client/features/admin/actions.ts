"use server";

import { updateTag } from "next/cache";

/** Called after the CMS saves, so `/` and `/menu` show the change now instead of after the 5-minute cache window. */
export async function refreshPublicMenu() {
  updateTag("menu");
}
