import { cn } from "@/lib/utils";

import { cardIngredientSlots, compactQuantity, compactTime, formatGrams, orDash } from "../lib/format";
import type { Recipe } from "../types";
import { BreadIcon } from "./icons";

/** Card front (§6.2). Sizes derive from the `--cw` CSS variable set on the stage. */
export function BookCardFront({ recipe, cw }: { recipe: Recipe; cw: number }) {
  const list = recipe.ingredients.slice(0, cardIngredientSlots(cw, recipe.ingredients.length));
  const more = recipe.ingredients.length - list.length;
  const footer = [
    ["Temp:", orDash(recipe.temperature)],
    ["Time:", compactTime(recipe.time)],
    ["Quantity:", compactQuantity(recipe.quantity)],
  ] as const;

  return (
    <>
      <span
        aria-hidden="true"
        className="w-[clamp(10px,calc(var(--cw)*0.041),14px)] shrink-0 self-stretch border-r border-border bg-surface-spine"
      />
      <span className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-[clamp(6px,calc(var(--cw)*0.024),8px)] overflow-hidden py-[clamp(12px,calc(var(--cw)*0.047),16px)] pr-[clamp(12px,calc(var(--cw)*0.059),20px)] pl-[clamp(11px,calc(var(--cw)*0.053),18px)] text-left">
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-micro font-bold tracking-eyebrow-sm text-primary uppercase">
            {recipe.category}
          </span>
          <span className="flex size-[clamp(26px,calc(var(--cw)*0.088),30px)] shrink-0 items-center justify-center rounded-[9px] bg-surface-icon-tile text-primary">
            <BreadIcon className="size-4" />
          </span>
        </span>
        <span className="truncate font-display text-[length:calc(var(--cw)*0.085)] leading-[1.12] font-bold text-foreground">
          {recipe.name}
        </span>
        <span aria-hidden="true" className="h-px bg-input" />
        <span className="text-micro font-bold tracking-[1.2px] text-muted-foreground uppercase">Ingredients</span>
        <span className="flex min-h-0 flex-col overflow-hidden text-[length:clamp(12px,calc(var(--cw)*0.038),13px)] leading-[1.35]">
          {list.length === 0 && <span className="text-label-sm text-foreground-faint">No ingredients yet.</span>}
          {list.map((ing) => (
            <span key={`${ing.grams}-${ing.item}`} className="flex gap-1 border-b border-dashed border-border py-0.75">
              <span className="w-[calc(var(--cw)*0.27)] shrink-0 truncate font-semibold text-primary">
                {formatGrams(ing.grams)}
              </span>
              <span className="min-w-0 truncate text-foreground-ingredient">{ing.item}</span>
            </span>
          ))}
          {more > 0 && (
            <span className="mt-1.5 text-micro text-muted-foreground">
              +{more} more ingredient{more === 1 ? "" : "s"}
            </span>
          )}
        </span>
        <span className="mt-auto grid shrink-0 grid-cols-3 gap-[clamp(4px,calc(var(--cw)*0.018),6px)] border-t border-dashed border-input pt-2.25">
          {footer.map(([label, value]) => (
            <span key={label} className="min-w-0">
              <span className="block truncate text-nano font-semibold text-muted-foreground">{label}</span>
              <span
                className={cn(
                  "mt-0.5 block truncate text-[length:clamp(11px,calc(var(--cw)*0.036),12px)] font-semibold text-foreground tabular",
                )}
              >
                {value}
              </span>
            </span>
          ))}
        </span>
      </span>
    </>
  );
}
