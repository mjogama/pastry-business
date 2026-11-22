import type { Recipe } from "@common/modules/recipes";
import { cn } from "@/lib/utils";
import { cardIngredientLayout, compactTime, formatAmount, formatQuantity, formatTemperature } from "../lib/format";
import { BreadIcon } from "./icons";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Card front (§6.2). Sizes derive from the `--cw` CSS variable set on the stage. */
export function BookCardFront({
  recipe,
  cw,
  ch,
  multiplier = 1,
}: {
  recipe: Recipe;
  cw: number;
  ch: number;
  multiplier?: number;
}) {
  const sections = recipe.sections.filter((section) => section.ingredients.length > 0);
  const { counts, hiddenSections } = cardIngredientLayout(cw, ch, sections, Boolean(recipe.description));
  const hiddenIngredients = sections.slice(counts.length).reduce((n, section) => n + section.ingredients.length, 0);
  const stats = [
    ["Temp", formatTemperature(recipe.temperature)],
    ["Est. Time", compactTime(recipe.time)],
    ["Quantity", formatQuantity(recipe.quantity)],
  ] as const;

  return (
    <>
      <span
        aria-hidden="true"
        className="w-[clamp(10px,calc(var(--cw)*0.041),21px)] shrink-0 self-stretch border-r border-border bg-surface-spine"
      />
      <span className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-[clamp(6px,calc(var(--cw)*0.024),12px)] overflow-hidden py-[clamp(12px,calc(var(--cw)*0.047),24px)] pr-[clamp(12px,calc(var(--cw)*0.059),31px)] pl-[clamp(11px,calc(var(--cw)*0.053),28px)] text-left">
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-micro font-bold tracking-eyebrow-sm text-primary uppercase">
            {recipe.category}
          </span>
          <span className="flex size-[clamp(26px,calc(var(--cw)*0.088),46px)] shrink-0 items-center justify-center rounded-[9px] bg-surface-icon-tile text-primary">
            <BreadIcon className="size-4" />
          </span>
        </span>
        <span className="truncate font-display text-[length:min(calc(var(--cw)*0.085),34px)] leading-[1.12] font-bold text-foreground">
          {recipe.name}
        </span>
        {recipe.description && (
          <span className="line-clamp-2 text-[length:clamp(11px,calc(var(--cw)*0.036),15px)] leading-[1.4] text-muted-foreground">
            {recipe.description}
          </span>
        )}
        <span aria-hidden="true" className="h-px bg-input" />
        <span className="grid shrink-0 grid-cols-3 gap-[clamp(4px,calc(var(--cw)*0.018),9px)]">
          {stats.map(([label, value]) => (
            <span key={label} className="min-w-0">
              <span className="block truncate text-nano font-bold tracking-[1.2px] text-muted-foreground uppercase">
                {label}
              </span>
              <span className="mt-0.5 block truncate text-[length:clamp(12px,calc(var(--cw)*0.04),17px)] font-bold text-foreground tabular">
                {value}
              </span>
            </span>
          ))}
        </span>
        <span aria-hidden="true" className="h-px bg-input" />
        <span className="flex items-center justify-between gap-2">
          <span className="text-micro font-bold tracking-[1.2px] text-muted-foreground uppercase">Ingredients</span>
          <span
            title={`Amounts multiplied by ${multiplier}`}
            className={cn(
              "rounded-pill px-2.5 py-0.5 text-micro font-bold tabular",
              multiplier > 1 ? "bg-primary text-primary-foreground" : "bg-surface-chip text-primary",
            )}
          >
            ×{multiplier}
          </span>
        </span>
        <span className="flex min-h-0 flex-col overflow-hidden text-[length:clamp(13px,calc(var(--cw)*0.042),17px)] leading-[1.35]">
          {sections.length === 0 && <span className="text-label-sm text-foreground-faint">No ingredients yet.</span>}
          {counts.map((count, s) => {
            const section = sections[s];
            const rest = section.ingredients.length - count;
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: sections have no stable id on the card
              <span key={s} className="flex flex-col">
                {section.name && (
                  <span className="truncate pt-1.5 pb-0.5 text-nano font-bold tracking-[1.2px] text-muted-foreground uppercase">
                    {section.name}
                  </span>
                )}
                {section.ingredients.slice(0, count).map((ing, i) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: ingredients have no id
                    key={i}
                    className="flex gap-2.5 border-b border-dashed border-border py-1.25"
                  >
                    <span className="w-[calc(var(--cw)*0.24)] shrink-0 truncate text-right font-semibold text-primary tabular">
                      {formatAmount(ing.quantity * multiplier, ing.unit)}
                    </span>
                    <span className="min-w-0 truncate text-foreground-ingredient">{ing.ingredient_name}</span>
                  </span>
                ))}
                {rest > 0 && (
                  <span className="mt-1 text-micro text-muted-foreground">+{plural(rest, "ingredient")}</span>
                )}
              </span>
            );
          })}
          {hiddenSections > 0 && (
            <span className="mt-1 text-micro text-muted-foreground">
              +{plural(hiddenIngredients, "ingredient")} in {plural(hiddenSections, "more section")}
            </span>
          )}
        </span>
      </span>
    </>
  );
}
