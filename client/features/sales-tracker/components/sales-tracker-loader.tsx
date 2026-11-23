import { connection } from "next/server";

import { getProductSuggestions, getSalesEntries } from "../api";
import { SalesTracker } from "./sales-tracker";

/** Server component: loads entries and product suggestions per request, then hands them to the calendar. Render it inside <Suspense>. */
export async function SalesTrackerLoader() {
  await connection();
  // `null` tells the calendar the request failed, so it can say so instead of showing an empty month.
  const [entries, suggestions] = await Promise.all([
    getSalesEntries().catch(() => null),
    getProductSuggestions().catch(() => []),
  ]);
  return <SalesTracker initialEntries={entries} initialSuggestions={suggestions} />;
}
