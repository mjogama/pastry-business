"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { newId } from "@/lib/id";
import { cn } from "@/lib/utils";

import { SEED_RECIPES } from "../data/seed";
import { cardGeometry } from "../lib/geometry";
import type { Recipe } from "../types";
import { BookCardFront } from "./book-card";
import { PlusIcon } from "./icons";
import { RecipeEditModal } from "./recipe-edit-modal";
import { RecipeModal } from "./recipe-modal";

const DOUBLE_TAP_MS = 350;
const DRAG_THRESHOLD = 6;
const DEFAULT_CW = 440;

export function RecipeBook() {
  const [recipes, setRecipes] = useState<Recipe[]>(SEED_RECIPES);
  const [active, setActive] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [cw, setCw] = useState(DEFAULT_CW);

  const stageRef = useRef<HTMLElement>(null);
  const gesture = useRef({ id: -1, startX: 0, moved: false, captured: false });
  const lastTap = useRef({ index: -1, time: 0 });
  const wasDrag = useRef(false);

  const total = recipes.length + 1; // + the New recipe card
  const isNew = active === recipes.length;
  const spacing = cw * 0.74;
  const current = isNew ? null : recipes[active];

  // Real card width, so ingredient counts and drag distances follow the CSS clamp().
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const probe = el.querySelector<HTMLElement>("[data-card]");
      if (probe) setCw(probe.offsetWidth || DEFAULT_CW);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = (i: number) => setActive(Math.max(0, Math.min(total - 1, i)));

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = { id: e.pointerId, startX: e.clientX, moved: false, captured: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (g.id !== e.pointerId) return;
    let dx = e.clientX - g.startX;
    if (!g.moved && Math.abs(dx) > DRAG_THRESHOLD) {
      g.moved = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId); // only once dragging, so taps still reach the cards
    }
    if (!g.moved) return;
    const atEdge = (dx > 0 && active === 0) || (dx < 0 && active === total - 1);
    if (atEdge) dx *= 0.35;
    setDragX(dx);
  };

  const endGesture = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (g.id !== e.pointerId) return;
    g.id = -1;
    if (!g.moved) return;
    wasDrag.current = true;
    setTimeout(() => (wasDrag.current = false), 0);
    const dx = e.clientX - g.startX;
    if (e.type === "pointerup" && Math.abs(dx) > spacing * 0.22) {
      const n = Math.max(1, Math.round(Math.abs(dx) / spacing));
      go(active + (dx < 0 ? n : -n));
    }
    setDragging(false);
    setDragX(0);
  };

  const onCardClick = (i: number, e: React.MouseEvent) => {
    if (wasDrag.current) return;
    if (i !== active) return go(i);
    if (i === recipes.length) return; // New card: the form below is the action
    // Keyboard Enter/Space (detail 0) opens directly; pointer needs a double tap.
    const now = Date.now();
    const double = lastTap.current.index === i && now - lastTap.current.time < DOUBLE_TAP_MS;
    lastTap.current = { index: i, time: double ? 0 : now };
    if (e.detail === 0 || double) setOpenId(recipes[i].id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === "ArrowLeft") go(active - 1);
    if (e.key === "ArrowRight") go(active + 1);
  };

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRecipes((r) => [...r, { id: newId(), name: trimmed, category: "Uncategorized", ingredients: [], steps: [] }]);
    setName("");
    setActive(recipes.length);
  };

  const openRecipe = recipes.find((r) => r.id === openId) ?? null;
  const editRecipe = recipes.find((r) => r.id === editId) ?? null;
  // The editor replaces the viewer, and hands back to it when closed.
  const startEdit = (recipe: Recipe) => {
    setOpenId(null);
    setEditId(recipe.id);
  };
  const closeEdit = () => {
    setOpenId(editId);
    setEditId(null);
  };
  const saveRecipe = (updated: Recipe) => {
    setRecipes((r) => r.map((x) => (x.id === updated.id ? updated : x)));
    closeEdit();
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden pt-3 pb-3">
      <h1 className="px-6 text-center font-display text-[length:clamp(28px,min(6vw,6dvh),52px)] leading-[1.1] font-bold tracking-[-0.6px]">
        Recipe Book
      </h1>

      <section
        ref={stageRef}
        aria-roledescription="carousel"
        aria-label="Recipes"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        className={cn(
          // Card width follows the screen width AND height: the page never scrolls, so on short
          // phones (iPhone SE: ~548px tall in Safari) the card shrinks to leave room for the title,
          // name and dots (~275px, ~250px once the hint hides below 700px tall).
          "[--cw:clamp(200px,min(72vw,calc((100dvh-275px)/1.3)),340px)] [--ch:calc(var(--cw)*1.3)] [--stride:calc(var(--cw)*0.74)]",
          "[@media(max-height:700px)]:[--cw:clamp(200px,min(72vw,calc((100dvh-250px)/1.3)),340px)]",
          "relative isolate mt-2 h-[calc(var(--ch)+24px)] w-full touch-pan-y overflow-hidden select-none",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {Array.from({ length: total }, (_, i) => {
          const d = i - active + dragX / spacing;
          const g = cardGeometry(d);
          const isActive = i === active;
          const isNewCard = i === recipes.length;
          const recipe = isNewCard ? null : recipes[i];
          const label = recipe
            ? `${recipe.name}, ${recipe.category}. ${isActive ? "Double-tap to open" : "Show this recipe"}`
            : isActive
              ? "New recipe"
              : "New recipe. Show this card";
          return (
            <Button
              variant="bare"
              key={recipe?.id ?? "new"}
              type="button"
              data-card
              aria-label={label}
              aria-current={isActive ? "true" : undefined}
              tabIndex={g.hidden ? -1 : 0}
              onClick={(e) => onCardClick(i, e)}
              style={{
                transform: `translate(-50%,-50%) translateX(calc(var(--stride) * ${g.x})) scale(${g.scale}) rotate(${g.rotate}deg)`,
                opacity: g.opacity,
                filter: `brightness(${g.brightness})`,
                zIndex: g.zIndex,
                pointerEvents: g.hidden ? "none" : undefined,
                transition: dragging
                  ? "none"
                  : "transform .42s cubic-bezier(.2,.8,.2,1), opacity .42s ease, filter .42s ease",
              }}
              className={cn(
                "absolute top-1/2 left-1/2 flex h-(--ch) w-(--cw) overflow-hidden rounded-book border text-foreground motion-reduce:transition-none!",
                isActive ? "border-line-active shadow-card-active" : "border-border shadow-card-side",
                isNewCard
                  ? "flex-col items-center justify-center gap-3 border-2 border-dashed bg-surface-new-card"
                  : "bg-muted",
              )}
            >
              {recipe ? (
                <BookCardFront recipe={recipe} cw={cw} />
              ) : (
                <>
                  <PlusIcon className="size-14 text-foreground" />
                  <span className="text-cell font-semibold text-foreground-2">New recipe</span>
                </>
              )}
            </Button>
          );
        })}
      </section>

      <div className="mx-auto mt-1 flex w-full max-w-140 flex-col items-center gap-3 px-6">
        {current ? (
          <div aria-live="polite" className="flex flex-col items-center gap-1.5 text-center">
            <p className="font-display text-[26px] leading-tight font-bold">{current.name}</p>
            <p className="text-body text-muted-foreground">{current.category}</p>
            <p className="text-label text-foreground-faint [@media(max-height:700px)]:hidden">
              Double-tap the card to open
            </p>
          </div>
        ) : (
          <form
            className="flex w-full flex-col gap-3 [@media(max-height:700px)]:flex-row [@media(max-height:700px)]:gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <Label htmlFor="recipe-name" className="sr-only">
              Recipe name
            </Label>
            <Input
              id="recipe-name"
              value={name}
              maxLength={60}
              placeholder="Give it a name"
              onChange={(e) => setName(e.target.value)}
              className="h-13 rounded-card border-border bg-surface-inset px-4 text-body-lg [@media(max-height:700px)]:h-11"
            />
            <Button
              type="submit"
              disabled={!name.trim()}
              className="h-12 shrink-0 rounded-card px-4 text-cell font-bold [@media(max-height:700px)]:h-11 disabled:bg-surface-chip disabled:text-foreground-faint disabled:opacity-100"
            >
              Create recipe
            </Button>
          </form>
        )}

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center">
            {Array.from({ length: total }, (_, i) => (
              <Button
                variant="bare"
                // biome-ignore lint/suspicious/noArrayIndexKey: dots mirror the card positions
                key={i}
                type="button"
                aria-label={`Go to ${recipes[i]?.name ?? "New recipe"}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => go(i)}
                className="h-touch w-6.5"
              >
                <span
                  className={cn(
                    "h-2 rounded-pill transition-[width] duration-250 motion-reduce:transition-none",
                    i === active ? "w-5.5 bg-primary" : "w-2 bg-input",
                  )}
                />
              </Button>
            ))}
          </div>
          <p className="text-label text-foreground-faint tabular">
            {active + 1} / {total}
          </p>
        </div>
      </div>

      <RecipeModal recipe={openRecipe} onEdit={startEdit} onClose={() => setOpenId(null)} />
      <RecipeEditModal recipe={editRecipe} onSave={saveRecipe} onClose={closeEdit} />
    </main>
  );
}
