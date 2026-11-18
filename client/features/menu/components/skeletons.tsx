import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
