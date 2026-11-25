import { connection } from "next/server";

import { getSalesEntries } from "@/features/sales-tracker/api";
import { dayKeyOf, toLocalDateTime } from "@/features/sales-tracker/lib/dates";

import { Progress } from "./progress";

/** Server component: loads every sales entry per request and today's Manila date. Render it inside <Suspense>. */
export async function ProgressLoader({ showThemeToggle = false }: { showThemeToggle?: boolean }) {
  await connection();
  // `null` tells the page the request failed, so it can say so instead of showing empty charts.
  const entries = await getSalesEntries().catch(() => null);
  return <Progress entries={entries} today={dayKeyOf(toLocalDateTime(new Date()))} showThemeToggle={showThemeToggle} />;
}
