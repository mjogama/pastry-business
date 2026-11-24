"use client";

import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProductCardContent } from "@/features/menu/components/product-card";
import { CONTAINER } from "@/features/menu/lib/layout";
import { itemCount, toProductView } from "@/features/menu/lib/menu";
import { isOnSale, manilaToday } from "@/features/menu/lib/pricing";
import type { Category, MenuData, Product } from "@/features/menu/types";
import { cn } from "@/lib/utils";

import { Switch } from "./switch";
import { useProducts } from "./use-products";

type Filter = "all" | "sale" | "out" | "featured" | "archived";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sale", label: "On sale" },
  { value: "out", label: "Out of stock" },
  { value: "featured", label: "Featured" },
  { value: "archived", label: "Archived" },
];

/** Available first, then `sortOrder` (docs/MENU_UI_V1.md §4). */
const byMenuOrder = (a: Product, b: Product) =>
  Number(b.isAvailable) - Number(a.isAvailable) || a.sortOrder - b.sortOrder;

/** A card and its controls. The card is the menu's own (§7.3); the controls act without opening the product. */
export const AdminProductCard = ({
  product,
  category,
  today,
  onEdit,
  onDelete,
  onPatch,
}: {
  product: Product;
  category: Category;
  today: string;
  onEdit: () => void;
  onDelete: () => void;
  onPatch: (changes: { isAvailable?: boolean; isArchived?: boolean }) => void;
}) => {
  const view = toProductView(product, category, today);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="relative">
        <div
          className={cn(
            buttonVariants({ variant: "product", size: "card" }),
            "cursor-default hover:translate-y-0 hover:border-border",
            (!product.isAvailable || product.isArchived) && "opacity-60",
          )}
        >
          <ProductCardContent product={view} />
        </div>
        {product.isArchived && (
          <span className="absolute top-3 right-3 rounded-pill bg-background/85 px-2.5 py-1 text-label-sm font-semibold text-foreground">
            Archived
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <Switch
          label="Available"
          checked={product.isAvailable}
          onCheckedChange={(isAvailable) => onPatch({ isAvailable })}
        />
        <div className="flex items-center gap-1">
          <Button variant="nav" size="pill" onClick={onEdit} aria-label={`Edit ${product.name}`}>
            <PencilIcon aria-hidden="true" className="size-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="pill"
            onClick={() => onPatch({ isArchived: !product.isArchived })}
            aria-label={`${product.isArchived ? "Unarchive" : "Archive"} ${product.name}`}
          >
            {product.isArchived ? "Unarchive" : "Archive"}
          </Button>
          <Button variant="ghost" size="icon-touch" onClick={onDelete} aria-label={`Delete ${product.name}`}>
            <Trash2Icon aria-hidden="true" className="size-4.5 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * The Menu page (§7.2) with its controls: products grouped by category, in the menu's own
 * cards, plus filters, search and Add / Edit / Archive / Delete (§9). `null` means the API failed.
 */
export function AdminMenu({ initial }: { initial: MenuData | null }) {
  const manager = useProducts(initial?.products ?? [], initial?.categories ?? []);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const today = useMemo(() => manilaToday(), []);

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = (p: Product) =>
      (needle === "" || p.name.toLowerCase().includes(needle)) &&
      (filter === "archived" ? p.isArchived : !p.isArchived) &&
      (filter === "all" ||
        filter === "archived" ||
        (filter === "sale" && isOnSale(p, today)) ||
        (filter === "out" && !p.isAvailable) ||
        (filter === "featured" && p.isFeatured));
    return [...manager.categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        category,
        products: manager.products.filter((p) => p.categoryId === category.id && matches(p)).sort(byMenuOrder),
      }));
  }, [manager.categories, manager.products, filter, query, today]);

  if (!initial) {
    return (
      <main className={cn(CONTAINER, "py-10 text-body-lg text-muted-foreground")}>
        The menu can’t be loaded right now. Check that the API is running, then reload.
      </main>
    );
  }

  const filtering = filter !== "all" || query.trim() !== "";

  return (
    <main className={cn(CONTAINER, "flex flex-1 flex-col gap-7 pt-3 pb-page-end")}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-menu-title font-bold tracking-menu-title text-foreground">Menu</h1>
        </div>
        <Button size="pill" onClick={() => manager.openCreate()}>
          <PlusIcon aria-hidden="true" className="size-4" />
          Add product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          aria-label="Filter products"
          variant="chip"
          size="chip"
          spacing={2.5}
          value={[filter]}
          onValueChange={(next) => next[0] && setFilter(next[0] as Filter)}
          className="scrollbar-none max-w-full overflow-x-auto rounded-none p-1"
        >
          {FILTERS.map((f) => (
            <ToggleGroupItem key={f.value} value={f.value}>
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Input
          type="search"
          aria-label="Search products by name"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 max-w-64 rounded-pill px-4"
        />
      </div>

      {manager.error && (
        <p role="alert" className="flex items-center gap-3 text-label text-destructive">
          {manager.error}
          <Button variant="ghost" size="sm" onClick={manager.dismissError}>
            Dismiss
          </Button>
        </p>
      )}

      {manager.categories.length === 0 && (
        <p className="text-body-lg text-muted-foreground">
          No categories yet. Add your first product and create its category there.
        </p>
      )}

      <div className="flex flex-col gap-7">
        {sections.map(({ category, products }) => {
          if (filtering && products.length === 0) return null;
          return (
            <section
              key={category.id}
              aria-labelledby={`admin-section-${category.id}`}
              className="flex flex-col gap-3.5"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 id={`admin-section-${category.id}`} className="font-display text-section font-bold text-foreground">
                  {category.name}
                </h2>
                <span className="tabular text-body text-foreground-faint">{itemCount(products.length)}</span>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => manager.openCreate(category.id)}>
                  <PlusIcon aria-hidden="true" className="size-3.5" />
                  Add to {category.name}
                </Button>
              </div>
              {products.length === 0 ? (
                <p className="text-body text-muted-foreground">Nothing here yet.</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(var(--spacing-card-min),100%),1fr))] gap-5">
                  {products.map((product) => (
                    <AdminProductCard
                      key={product.id}
                      product={product}
                      category={category}
                      today={today}
                      onEdit={() => manager.openEdit(product)}
                      onDelete={() => manager.askDelete(product)}
                      onPatch={(changes) => manager.patch(product, changes)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {manager.dialogs}
    </main>
  );
}
