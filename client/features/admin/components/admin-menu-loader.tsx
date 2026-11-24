import { connection } from "next/server";

import { getAdminMenu } from "../api";
import { AdminLanding } from "./admin-landing";
import { AdminMenu } from "./admin-menu";

/** Server components: load the menu fresh on every request (never the public cache), then hand it to the editor. Render inside <Suspense>. */
export async function AdminMenuLoader() {
  await connection();
  // `null` tells the editor the request failed, so it can say so instead of showing an empty menu.
  return <AdminMenu initial={await getAdminMenu().catch(() => null)} />;
}

export async function AdminLandingLoader() {
  await connection();
  return <AdminLanding initial={await getAdminMenu().catch(() => null)} />;
}
