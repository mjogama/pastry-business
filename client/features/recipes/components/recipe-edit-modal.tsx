"use client";

import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { newId } from "@/lib/id";
import { cn } from "@/lib/utils";

import { toGramsInput } from "../lib/format";
import type { Recipe } from "../types";
import { MODAL_CONTENT, MODAL_HEADING, MODAL_OVERLAY, MODAL_PILL, StepNumber } from "./recipe-modal";

const FIELD = "rounded-card border-border bg-surface-inset px-3 text-cell text-foreground-ingredient";
const INPUT = cn(FIELD, "h-11");
const AREA = cn(FIELD, "min-h-11 max-h-40 resize-none overflow-y-auto py-2.5 leading-[1.55]");
const FIELD_LABEL = "text-label-sm font-semibold text-muted-foreground";
const ADD = "h-11 gap-1.5 rounded-card border border-dashed border-input text-body font-medium text-foreground-2";
const REMOVE = "size-touch shrink-0 rounded-pill text-muted-foreground";

type Props = {
  recipe: Recipe | null;
  onSave: (recipe: Recipe) => void;
  onClose: () => void;
};

/** Separate editor for a recipe's details, ingredients, steps and Baker's note. */
export function RecipeEditModal({ recipe, onSave, onClose }: Props) {
  return (
    <Dialog open={recipe !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayProps={MODAL_OVERLAY}
        className={cn(MODAL_CONTENT, "w-[min(680px,100%)] sm:max-w-[min(680px,calc(100%-2rem))]")}
      >
        {/* Keyed so the draft starts fresh for every recipe. */}
        {recipe && <EditForm key={recipe.id} recipe={recipe} onSave={onSave} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

/** `grams` stays a string while typing; it becomes a number on save. */
type Row = { key: string; grams: string; item: string };
type Step = { key: string; text: string };

const newKey = () => newId();

/** Moves the step with `key` to index `to`; out-of-range targets leave the list as is. */
const reorder = (r: Step[], key: string, to: number) => {
  const from = r.findIndex((st) => st.key === key);
  if (from < 0 || to < 0 || to >= r.length || from === to) return r;
  const next = [...r];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

function EditForm({ recipe, onSave, onClose }: { recipe: Recipe; onSave: Props["onSave"]; onClose: () => void }) {
  const [details, setDetails] = useState({
    name: recipe.name,
    category: recipe.category,
    temperature: recipe.temperature ?? "",
    time: recipe.time ?? "",
    quantity: recipe.quantity ?? "",
    description: recipe.description ?? "",
    note: recipe.note ?? "",
  });
  const [rows, setRows] = useState<Row[]>(() =>
    recipe.ingredients.map((ing) => ({ key: newKey(), grams: ing.grams?.toString() ?? "", item: ing.item })),
  );
  const [steps, setSteps] = useState<Step[]>(() => recipe.steps.map((text) => ({ key: newKey(), text })));

  // The row just added by "Add ingredient" / "Add step" takes focus.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const addRow = () => {
    const key = newKey();
    setRows((r) => [...r, { key, grams: "", item: "" }]);
    setFocusKey(key);
  };
  const addStep = () => {
    const key = newKey();
    setSteps((r) => [...r, { key, text: "" }]);
    setFocusKey(key);
  };

  const set = (field: keyof typeof details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDetails((d) => ({ ...d, [field]: e.target.value }));
  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const updateStep = (key: string, text: string) =>
    setSteps((r) => r.map((st) => (st.key === key ? { ...st, text } : st)));

  // Drag a step by its handle; hovering it over another step moves it into that spot.
  const [dragKey, setDragKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Window listeners, not pointer capture: React moves the dragged row in the DOM, which drops capture.
  useEffect(() => {
    if (!dragKey) return;
    const onMove = (e: PointerEvent) => {
      const over = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-step-key]");
      const overKey = over?.dataset.stepKey;
      if (overKey && overKey !== dragKey) {
        setSteps((r) =>
          reorder(
            r,
            dragKey,
            r.findIndex((st) => st.key === overKey),
          ),
        );
      }
      // Scroll the form while dragging near its top or bottom edge.
      const box = scrollRef.current?.getBoundingClientRect();
      if (box && e.clientY < box.top + 48) scrollRef.current?.scrollBy({ top: -12 });
      if (box && e.clientY > box.bottom - 48) scrollRef.current?.scrollBy({ top: 12 });
    };
    const stop = () => setDragKey(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [dragKey]);

  const onGripDown = (key: string) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    setDragKey(key);
  };

  const onGripKey = (key: string, i: number) => (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const to = e.key === "ArrowUp" ? i - 1 : i + 1;
    setSteps((r) => reorder(r, key, to));
  };

  const optional = (v: string) => v.trim() || undefined;
  const canSave = details.name.trim() !== "";

  const save = () => {
    if (!canSave) return;
    onSave({
      ...recipe,
      name: details.name.trim(),
      category: details.category.trim() || "Uncategorized",
      temperature: optional(details.temperature),
      time: optional(details.time),
      quantity: optional(details.quantity),
      description: optional(details.description),
      note: optional(details.note),
      ingredients: rows
        .map(({ grams, item }) => ({
          grams: grams === "" || Number.isNaN(Number(grams)) ? undefined : Number(grams),
          item: item.trim(),
        }))
        .filter((ing) => ing.grams !== undefined || ing.item),
      steps: steps.map((st) => st.text.trim()).filter(Boolean),
    });
  };

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border py-3.5 pr-3.5 pl-5 min-[761px]:pl-7.5">
        <DialogTitle className="min-w-0 truncate font-display text-[22px] leading-tight font-bold">
          Edit recipe
        </DialogTitle>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className={cn(MODAL_PILL, "border border-input")}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave} className={cn(MODAL_PILL, "font-bold")}>
            Save
          </Button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto overscroll-contain px-5 pt-5 pb-7 min-[761px]:px-7.5"
      >
        <section className="flex flex-col gap-3">
          <h3 className={MODAL_HEADING}>Description</h3>
          <Field id="edit-name" label="Recipe name">
            <Input id="edit-name" value={details.name} onChange={set("name")} maxLength={60} className={INPUT} />
          </Field>
          <Field id="edit-category" label="Category">
            <Input id="edit-category" value={details.category} onChange={set("category")} className={INPUT} />
          </Field>
          <div className="grid grid-cols-1 gap-3 min-[481px]:grid-cols-3">
            <Field id="edit-temp" label="Temp">
              <Input
                id="edit-temp"
                value={details.temperature}
                placeholder="180 °C"
                onChange={set("temperature")}
                className={INPUT}
              />
            </Field>
            <Field id="edit-time" label="Time">
              <Input id="edit-time" value={details.time} placeholder="2 hr" onChange={set("time")} className={INPUT} />
            </Field>
            <Field id="edit-quantity" label="Quantity">
              <Input
                id="edit-quantity"
                value={details.quantity}
                placeholder="Makes 12"
                onChange={set("quantity")}
                className={INPUT}
              />
            </Field>
          </div>
          <Field id="edit-description" label="Description" optional>
            <AutoTextarea
              id="edit-description"
              value={details.description}
              placeholder="What makes this recipe special"
              onChange={set("description")}
              className={cn(AREA, "min-h-20")}
            />
          </Field>
          <Field id="edit-note" label="Baker's note">
            <AutoTextarea
              id="edit-note"
              value={details.note}
              placeholder="Tips, swaps or reminders"
              onChange={set("note")}
              className={cn(AREA, "min-h-20")}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className={MODAL_HEADING}>Ingredients</h3>
          {rows.map((row, i) => (
            <div key={row.key} className="flex items-center gap-2">
              <div className="relative w-24 shrink-0">
                <Input
                  aria-label={`Ingredient ${i + 1} amount in grams`}
                  autoFocus={row.key === focusKey}
                  inputMode="decimal"
                  value={row.grams}
                  placeholder="0"
                  onChange={(e) => updateRow(row.key, { grams: toGramsInput(e.target.value) })}
                  className={cn(INPUT, "pr-7 font-semibold text-primary tabular")}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-cell text-muted-foreground"
                >
                  g
                </span>
              </div>
              <Input
                aria-label={`Ingredient ${i + 1} name`}
                value={row.item}
                placeholder="Ingredient"
                onChange={(e) => updateRow(row.key, { item: e.target.value })}
                className={INPUT}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ingredient ${i + 1}`}
                onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                className={REMOVE}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" onClick={addRow} className={ADD}>
            <PlusIcon className="size-4" />
            Add ingredient
          </Button>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className={MODAL_HEADING}>Steps</h3>
          {steps.map((st, i) => (
            <div
              key={st.key}
              data-step-key={st.key}
              className={cn(
                "flex items-start gap-2 rounded-card transition-[background-color,box-shadow] motion-reduce:transition-none",
                dragKey === st.key && "bg-surface-chip shadow-card-side ring-1 ring-line-active",
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Reorder step ${i + 1}. Drag, or use the up and down arrow keys`}
                onPointerDown={onGripDown(st.key)}
                onKeyDown={onGripKey(st.key, i)}
                className={cn(
                  "-mr-2 h-11 w-7 shrink-0 touch-none rounded-pill text-foreground-faint",
                  dragKey === st.key ? "cursor-grabbing" : "cursor-grab",
                )}
              >
                <GripVerticalIcon className="size-4" />
              </Button>
              <StepNumber n={i + 1} className="mt-2" />
              <AutoTextarea
                aria-label={`Step ${i + 1}`}
                autoFocus={st.key === focusKey}
                value={st.text}
                placeholder="Describe this step"
                onChange={(e) => updateStep(st.key, e.target.value)}
                className={AREA}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove step ${i + 1}`}
                onClick={() => setSteps((r) => r.filter((x) => x.key !== st.key))}
                className={REMOVE}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" onClick={addStep} className={ADD}>
            <PlusIcon className="size-4" />
            Add step
          </Button>
        </section>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  optional,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className={FIELD_LABEL}>
        {label}
        {optional && <span className="font-normal text-foreground-faint">(optional)</span>}
      </Label>
      {children}
    </div>
  );
}

/** Grows with its text up to `max-h-40`, then scrolls inside. No resize handle. */
function AutoTextarea({ value, className, ...props }: React.ComponentProps<typeof Textarea> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure whenever the text changes
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [value]);
  return <Textarea ref={ref} value={value} rows={1} className={cn("field-sizing-fixed", className)} {...props} />;
}
