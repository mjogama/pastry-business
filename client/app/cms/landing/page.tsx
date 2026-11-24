import { Suspense } from "react";

import { AdminLandingLoader } from "@/features/admin/components/admin-menu-loader";
import { PicksSkeleton } from "@/features/menu/components/skeletons";
import { CONTAINER } from "@/features/menu/lib/layout";
import { cn } from "@/lib/utils";

export default function AdminLandingPage() {
  return (
    <Suspense
      fallback={
        <div className={cn(CONTAINER, "pt-3")}>
          <PicksSkeleton />
        </div>
      }
    >
      <AdminLandingLoader />
    </Suspense>
  );
}
