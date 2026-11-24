"use client";

import { PencilIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { LandingHero } from "@/features/menu/components/landing-hero";
import { PickCardContent } from "@/features/menu/components/product-card";
import { CONTAINER } from "@/features/menu/lib/layout";
import { todaysPicks } from "@/features/menu/lib/menu";
import { manilaToday } from "@/features/menu/lib/pricing";
import type { MenuData } from "@/features/menu/types";
import { cn } from "@/lib/utils";

import { useProducts } from "./use-products";

/**
 * The Landing page (§7.1) with its controls. The hero is drawn as customers see it; Today's picks
 * can be added to, removed from and edited here. `null` means the API failed.
 */
export function AdminLanding({ initial }: { initial: MenuData | null }) {
  const manager = useProducts(initial?.products ?? [], initial?.categories ?? []);
  const [choice, setChoice] = useState("");
  const today = useMemo(() => manilaToday(), []);
  const picks = useMemo(
    () => todaysPicks(manager.categories, manager.products, today),
    [manager.categories, manager.products, today],
  );

  if (!initial) {
    return (
      <main className={cn(CONTAINER, "py-10 text-body-lg text-muted-foreground")}>
        The landing page can’t be loaded right now. Check that the API is running, then reload.
      </main>
    );
  }

  const shown = new Set(picks.map((p) => p.id));
  const candidates = manager.products.filter((p) => p.isAvailable && !p.isArchived && !shown.has(p.id));

  return (
    <main className={cn(CONTAINER, "flex flex-1 flex-col gap-landing-section pt-3 pb-page-end")}>
      <LandingHero {...initial.settings} menuHref="/cms/menu" />

      <section aria-labelledby="picks-title" className="flex flex-col gap-5.5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="picks-title" className="font-display text-picks-title font-bold text-foreground">
            Today’s picks
          </h2>
          <p className="max-w-md text-label text-muted-foreground">
            Up to 4 products: featured ones first, then items on sale. Sold-out and archived products never show.
          </p>
        </div>

        {manager.error && (
          <p role="alert" className="text-label text-destructive">
            {manager.error}
          </p>
        )}

        {picks.length === 0 && (
          <p className="text-body-lg text-muted-foreground">No picks yet, so this section is hidden from customers.</p>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(var(--spacing-pick-min),100%),1fr))] gap-5">
          {picks.map((pick) => {
            const product = manager.products.find((p) => p.id === pick.id);
            if (!product) return null;
            return (
              <div key={pick.id} className="flex min-w-0 flex-col gap-2">
                <div className="flex h-full flex-col overflow-hidden rounded-product border border-border bg-surface-product text-foreground">
                  <PickCardContent product={pick} />
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    variant="nav"
                    size="pill"
                    onClick={() => manager.openEdit(product)}
                    aria-label={`Edit ${product.name}`}
                  >
                    <PencilIcon aria-hidden="true" className="size-4" />
                    Edit
                  </Button>
                  {product.isFeatured && (
                    <Button
                      variant="ghost"
                      size="pill"
                      onClick={() => manager.patch(product, { isFeatured: false })}
                      aria-label={`Remove ${product.name} from picks`}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <NativeSelect
            aria-label="Product to feature"
            wrapperClassName="w-full max-w-xs"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
          >
            <option value="">Add a product to picks…</option>
            {candidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
          <Button
            size="pill"
            disabled={!choice}
            onClick={() => {
              const product = manager.products.find((p) => p.id === choice);
              if (product) void manager.patch(product, { isFeatured: true });
              setChoice("");
            }}
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            Add to picks
          </Button>
        </div>
      </section>
      {manager.dialogs}
    </main>
  );
}
