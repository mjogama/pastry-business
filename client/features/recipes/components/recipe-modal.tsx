"use client";

import { PencilIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { formatGrams, orDash } from "../lib/format";
import type { Recipe } from "../types";

export const MODAL_HEADING = "text-label font-bold tracking-[1.2px] text-muted-foreground uppercase";
export const MODAL_PILL = "h-touch gap-1.5 rounded-pill px-4 text-body font-medium";
export const MODAL_OVERLAY = { className: "bg-scrim-modal supports-backdrop-filter:backdrop-blur-none" };
export const MODAL_CONTENT =
  "flex max-h-[calc(100dvh-32px)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-sheet border border-input bg-surface-2 p-0 text-base text-foreground shadow-modal ring-0";

type Props = {
  recipe: Recipe | null;
  onEdit: (recipe: Recipe) => void;
  onClose: () => void;
};

/** Open-book recipe modal (§7): ingredients left, steps right; one column ≤ 760px. Read-only. */
export function RecipeModal({ recipe, onEdit, onClose }: Props) {
  return (
    <Dialog open={recipe !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayProps={MODAL_OVERLAY}
        className={cn(MODAL_CONTENT, "w-[min(980px,100%)] sm:max-w-[min(980px,calc(100%-2rem))]")}
      >
        {recipe && <RecipeSpread recipe={recipe} onEdit={() => onEdit(recipe)} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function RecipeSpread({ recipe, onEdit, onClose }: { recipe: Recipe; onEdit: () => void; onClose: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-surface-2 py-3.5 pr-3.5 pl-5 min-[761px]:grid min-[761px]:grid-cols-2 min-[761px]:gap-0 min-[761px]:p-0">
        <span className="min-w-0 truncate text-label-sm font-bold tracking-eyebrow-sm text-primary uppercase min-[761px]:px-7.5">
          {recipe.category}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-3 min-[761px]:border-l min-[761px]:border-border min-[761px]:py-3.5 min-[761px]:pr-3.5 min-[761px]:pl-7.5">
          <h3 className={cn(MODAL_HEADING, "max-[760px]:hidden")}>Steps</h3>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="ghost" onClick={onEdit} className={cn(MODAL_PILL, "border border-input")}>
              <PencilIcon className="size-4" />
              Edit
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Close"
              onClick={onClose}
              className="size-touch rounded-pill bg-surface-chip text-foreground"
            >
              <XIcon className="size-4.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 min-[761px]:grid-cols-2">
        <section className="flex flex-col gap-4 px-5 pt-5 pb-6 min-[761px]:gap-4.5 min-[761px]:px-7.5 min-[761px]:pt-6 min-[761px]:pb-7.5 min-[761px]:shadow-[inset_-18px_0_24px_-18px_rgba(0,0,0,.6)]">
          <DialogTitle className="font-display text-[30px] leading-[1.1] font-bold min-[761px]:text-[clamp(28px,4vw,38px)]">
            {recipe.name}
          </DialogTitle>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["Temp", recipe.temperature],
                ["Time", recipe.time],
                ["Quantity", recipe.quantity],
              ] as const
            ).map(([label, value]) => (
              <span
                key={label}
                className="rounded-pill bg-surface-chip px-3 py-1.75 text-label text-foreground-ingredient"
              >
                <span className="text-muted-foreground">{label}:</span> {orDash(value)}
              </span>
            ))}
          </div>
          {recipe.description && (
            <p className="text-body leading-[1.6] whitespace-pre-line text-foreground-2">{recipe.description}</p>
          )}
          <h3 className={MODAL_HEADING}>Ingredients</h3>
          {recipe.ingredients.length === 0 ? (
            <p className="text-cell text-foreground-faint">No ingredients yet.</p>
          ) : (
            <ul className="flex flex-col">
              {recipe.ingredients.map((ing) => (
                <li
                  key={`${ing.grams}-${ing.item}`}
                  className="flex gap-3 border-b border-dashed border-border py-2.5 text-cell leading-[1.4]"
                >
                  <span className="min-w-21 font-semibold text-primary tabular">{formatGrams(ing.grams)}</span>
                  <span className="text-foreground-ingredient">{ing.item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section
          className={cn(
            "flex flex-col gap-4 border-t border-dashed border-input px-5 pt-6 pb-6",
            "min-[761px]:gap-4.5 min-[761px]:border-t-0 min-[761px]:border-l min-[761px]:border-solid min-[761px]:border-border min-[761px]:px-7.5 min-[761px]:pt-6 min-[761px]:pb-7.5 min-[761px]:shadow-[inset_18px_0_24px_-18px_rgba(0,0,0,.6)]",
          )}
        >
          <h3 className={cn(MODAL_HEADING, "min-[761px]:hidden")}>Steps</h3>
          {recipe.steps.length === 0 ? (
            <p className="text-cell text-foreground-faint">No steps yet.</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {recipe.steps.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <StepNumber n={i + 1} />
                  <span className="pt-0.75 text-cell leading-[1.55] text-foreground-ingredient">{step}</span>
                </li>
              ))}
            </ol>
          )}
          {recipe.note && (
            <div className="rounded-card border border-dashed border-input bg-surface-spine px-4 py-3.5">
              <p className="text-label-sm font-bold tracking-[1.2px] text-muted-foreground uppercase">
                Baker&apos;s note
              </p>
              <p className="mt-1 text-body leading-[1.6] whitespace-pre-line text-foreground-2">{recipe.note}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function StepNumber({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-label font-bold text-primary-foreground tabular",
        className,
      )}
    >
      {n}
    </span>
  );
}
