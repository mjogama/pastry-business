import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { CONTAINER } from "../lib/layout";

/**
 * Loading states drawn with the same boxes, paddings and line heights as the real content, so
 * nothing moves when it streams in (§8). Text lines use `1lh` at the real font size.
 */

const CardFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col overflow-hidden rounded-product border border-border bg-surface-product">
    <Skeleton variant="image" className="aspect-4/3 w-full" />
    <div className="flex flex-col gap-2 px-4 pt-4 pb-4.5">{children}</div>
  </div>
);

export const ProductCardSkeleton = () => (
  <CardFrame>
    <Skeleton variant="text" className="w-3/5 text-card-title" />
    <div className="flex min-h-10 flex-col text-body leading-card">
      <Skeleton variant="text" className="w-full scale-y-75" />
      <Skeleton variant="text" className="w-4/5 scale-y-75" />
    </div>
    <Skeleton variant="text" className="mt-0.5 w-16 text-card-price" />
    <Skeleton variant="text" className="w-20 text-label" />
  </CardFrame>
);

export const PickCardSkeleton = () => (
  <CardFrame>
    <Skeleton variant="text" className="w-3/5 text-card-title" />
    <Skeleton variant="text" className="w-14 text-sum-sm" />
  </CardFrame>
);

/** /menu body: the chips bar and one section of cards. */
export const MenuSkeleton = () => (
  <div role="status" aria-busy="true" aria-label="Loading the menu" className="flex flex-col gap-7">
    <div className="menu-bleed menu-gutter border-b border-muted py-3">
      <div className="flex gap-2.5 overflow-hidden">
        {["w-16", "w-24", "w-26", "w-22"].map((width) => (
          <Skeleton key={width} className={cn("h-touch shrink-0 rounded-pill", width)} />
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-4.5 pt-2">
      <Skeleton variant="text" className="w-40 text-section" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(var(--spacing-card-min),100%),1fr))] gap-5">
        {[0, 1, 2, 3].map((key) => (
          <ProductCardSkeleton key={key} />
        ))}
      </div>
    </div>
  </div>
);

export const PicksSkeleton = () => (
  <div role="status" aria-busy="true" aria-label="Loading today's picks" className="flex flex-col gap-5.5">
    <div className="flex min-h-touch items-end justify-between gap-4">
      <Skeleton variant="text" className="w-56 text-picks-title" />
    </div>
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(var(--spacing-pick-min),100%),1fr))] gap-5">
      {[0, 1, 2, 3].map((key) => (
        <PickCardSkeleton key={key} />
      ))}
    </div>
  </div>
);

/** Top bar while the business name loads: the same box as `SiteTopBar`, with the name's line as a block. */
export const TopBarSkeleton = ({ page }: { page: "landing" | "menu" }) => (
  <div
    className={cn(
      CONTAINER,
      "flex items-center justify-between gap-4 pt-[calc(var(--spacing-page-top)+env(safe-area-inset-top))]",
      page === "landing" ? "pb-5" : "pb-0",
    )}
  >
    <div className="flex min-h-touch items-center">
      <Skeleton className="h-6 w-44" />
    </div>
    <Skeleton className="h-touch w-24 rounded-pill" />
  </div>
);

/** Footer while the business name and phone load: the same frame as `SiteFooter`. */
export const FooterSkeleton = () => (
  <div className="border-t border-border bg-footer">
    <div
      className={cn(
        CONTAINER,
        "flex flex-wrap items-center justify-between gap-5 pt-8 pb-[calc(var(--spacing-page-bottom)+env(safe-area-inset-bottom))]",
      )}
    >
      <Skeleton className="h-12 w-56" />
      <Skeleton className="h-footer-call w-48 rounded-pill" />
    </div>
  </div>
);
