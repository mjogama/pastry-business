"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";

import type { BusinessSettings, ProductView } from "../types";
import { ProductSheet } from "./product-sheet";

/** "All", or a category id. */
export type CategoryFilter = string;
export const ALL: CategoryFilter = "all";

interface MenuContextValue {
  category: CategoryFilter;
  selectCategory: (category: CategoryFilter) => void;
  openProduct: (id: string, trigger: HTMLElement) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) throw new Error("useMenu must be used inside <MenuProvider>.");
  return context;
};

/** Keeps the selection shareable (`/menu?c=pastries`, §7.2) without a navigation. */
const replaceQuery = (key: string, value: string | null) => {
  const url = new URL(window.location.href);
  if (value == null) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState(window.history.state, "", url);
};

/** The id of the element the sections start at; the chips scroll back to it (§7.2). */
export const SECTIONS_ID = "menu-sections";

/**
 * Client state for /menu: the category filter and the open product sheet. The sections and cards
 * are rendered on the server and passed in as children.
 */
export const MenuProvider = ({
  products,
  settings,
  initialCategory,
  initialProductId,
  children,
}: {
  products: ProductView[];
  settings: Pick<BusinessSettings, "contactNumber">;
  initialCategory: CategoryFilter;
  /** From `?p=`: a pick on the landing page opens its sheet here. */
  initialProductId?: string;
  children: ReactNode;
}) => {
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const [category, setCategory] = useState(initialCategory);
  const [selectedId, setSelectedId] = useState(() =>
    initialProductId && byId.has(initialProductId) ? initialProductId : null,
  );
  const [open, setOpen] = useState(selectedId != null);
  /** Focus goes back to the card that opened the sheet (§7.4, §10). */
  const triggerRef = useRef<HTMLElement | null>(null);

  const selectCategory = useCallback((next: CategoryFilter) => {
    setCategory(next);
    replaceQuery("c", next === ALL ? null : next);
    // If the chips are pinned, bring the top of the (now shorter) list back into view.
    const sections = document.getElementById(SECTIONS_ID);
    if (sections && sections.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => sections.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }));
    }
  }, []);

  const openProduct = useCallback((id: string, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelectedId(id);
    setOpen(true);
  }, []);

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) replaceQuery("p", null);
  }, []);

  const value = useMemo(() => ({ category, selectCategory, openProduct }), [category, selectCategory, openProduct]);
  const selected = selectedId ? byId.get(selectedId) : undefined;

  return (
    <MenuContext.Provider value={value}>
      {children}
      {selected && (
        <ProductSheet
          product={selected}
          contactNumber={settings.contactNumber}
          open={open}
          onOpenChange={onOpenChange}
          finalFocus={triggerRef}
        />
      )}
    </MenuContext.Provider>
  );
};

/** One category section; hidden while another chip is active ("All" shows every section). */
export const MenuSectionFilter = ({ categoryId, children }: { categoryId: string; children: ReactNode }) => {
  const { category } = useMenu();
  return (
    <section
      aria-labelledby={`section-${categoryId}`}
      hidden={category !== ALL && category !== categoryId}
      className="flex scroll-mt-24 flex-col gap-4.5 pt-2"
    >
      {children}
    </section>
  );
};
