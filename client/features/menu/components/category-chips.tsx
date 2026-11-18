"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { Category } from "../types";
import { ALL, useMenu } from "./menu-provider";

/**
 * Sticky category filter (§7.2): **All**, then categories by `sortOrder`. Toggle buttons with
 * `aria-pressed`; on phones the row scrolls sideways with the scrollbar hidden.
 */
export const CategoryChips = ({ categories }: { categories: Pick<Category, "id" | "name">[] }) => {
  const { category, selectCategory } = useMenu();
  return (
    // 12px above and below the chips: 8px here plus the group's 4px, which keeps focus rings unclipped.
    <div className="menu-bleed menu-gutter sticky top-[env(safe-area-inset-top)] z-10 border-b border-muted bg-background py-2 before:absolute before:inset-x-0 before:bottom-full before:h-[env(safe-area-inset-top)] before:bg-background">
      <ToggleGroup
        aria-label="Filter by category"
        variant="chip"
        size="chip"
        spacing={2.5}
        value={[category]}
        onValueChange={(next) => {
          // Single choice: pressing the active chip again keeps it selected.
          const value = next[0];
          if (value) selectCategory(value);
        }}
        className="scrollbar-none -mx-1 w-[calc(100%+8px)] overflow-x-auto overscroll-x-contain rounded-none p-1"
      >
        {[{ id: ALL, name: "All" }, ...categories].map((chip) => (
          <ToggleGroupItem key={chip.id} value={chip.id}>
            {chip.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};
