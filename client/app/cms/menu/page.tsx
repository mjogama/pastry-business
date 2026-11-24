import { Suspense } from "react";

import { AdminMenuLoader } from "@/features/admin/components/admin-menu-loader";
import { MenuSkeleton } from "@/features/menu/components/skeletons";
import { CONTAINER } from "@/features/menu/lib/layout";
import { cn } from "@/lib/utils";

export default function AdminMenuPage() {
  return (
    <Suspense
      fallback={
        <div className={cn(CONTAINER, "pt-3")}>
          <MenuSkeleton />
        </div>
      }
    >
      <AdminMenuLoader />
    </Suspense>
  );
}
