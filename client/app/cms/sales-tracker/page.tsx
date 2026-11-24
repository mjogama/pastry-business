import { Suspense } from "react";

import { SalesTrackerLoader } from "@/features/sales-tracker/components/sales-tracker-loader";

/** The Sales Tracker as it is, with its own add, edit and delete. */
export default function AdminSalesTrackerPage() {
  return (
    <Suspense
      fallback={
        <main className="page-padding flex flex-1 items-center justify-center text-label text-foreground-faint">
          Loading sales…
        </main>
      }
    >
      <SalesTrackerLoader />
    </Suspense>
  );
}
