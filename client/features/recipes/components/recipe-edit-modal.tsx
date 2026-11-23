"use client";

import type {
  Ingredient,
  IngredientSection,
  IngredientUnit,
  Recipe,
  RecipeStep,
  StepTag,
  TemperatureUnit,
} from "@common/modules/recipes";
import { GripVerticalIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { apiErrorMessage } from "@/lib/api/client";
import { newId } from "@/lib/id";
import { cn } from "@/lib/utils";
import { INGREDIENT_UNITS, TEMPERATURE_UNITS, toIntegerInput, toNumberInput } from "../lib/format";
import { ADD, AREA, AutoTextarea, Field, INPUT, REMOVE, UnitField } from "./edit-fields";
import { MODAL_CONTENT, MODAL_HEADING, MODAL_OVERLAY, MODAL_PILL, StepNumber } from "./recipe-modal";

const DEFAULT_CATEGORIES = ["Breads", "Sweet", "Cakes", "Cookies", "Savory", "Drinks", "Uncategorized"];

type Props = {
  recipe: Recipe | null;
  categories?: string[];
  isNew?: boolean;
  /** Saves to the server; a rejected promise keeps the editor open and shows the error. */
  onSave: (recipe: Recipe) => Promise<void>;
  onClose: () => void;
};

/** Separate editor for a recipe's details, ingredients, steps and Baker's note. */
export function RecipeEditModal({ recipe, categories = [], isNew = false, onSave, onClose }: Props) {
  return (
    <Dialog open={recipe !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayProps={MODAL_OVERLAY}
        className={cn(MODAL_CONTENT, "w-[min(680px,100%)] sm:max-w-[min(680px,calc(100%-2rem))]")}
      >
        {/* Keyed so the draft starts fresh for every recipe. */}
        {recipe && (
          <EditForm
            key={recipe.id}
            recipe={recipe}
            categories={categories}
            isNew={isNew}
            onSave={onSave}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Editor rows built from the shared types: each adds a React `key` (and `kind` for the mixed
 * ingredient list), and `quantity` stays a string while typing, becoming a number on save.
 */
type ItemRow = Omit<Ingredient, "quantity"> & { key: string; kind: "item"; quantity: string };
type SectionRow = Required<Pick<IngredientSection, "name">> & { key: string; kind: "section" };
type Row = ItemRow | SectionRow;
type Step = Required<RecipeStep> & { key: string };
type Dragging = { list: "rows" | "steps"; key: string };

const newKey = () => newId();
const toNumber = (v: string) => (v === "" || Number.isNaN(Number(v)) ? undefined : Number(v));
const optional = (v: string) => v.trim() || undefined;

/** Moves the entry with `key` to index `to`; out-of-range targets leave the list as is. */
const reorder = <T extends { key: string }>(r: T[], key: string, to: number) => {
  const from = r.findIndex((x) => x.key === key);
  if (from < 0 || to < 0 || to >= r.length || from === to) return r;
  const next = [...r];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

function EditForm({
  recipe,
  categories,
  isNew,
  onSave,
  onClose,
}: {
  recipe: Recipe;
  categories: string[];
  isNew: boolean;
  onSave: Props["onSave"];
  onClose: () => void;
}) {
  const [details, setDetails] = useState({
    name: recipe.name,
    category: recipe.category || "Uncategorized",
    description: recipe.description ?? "",
    note: recipe.note ?? "",
    time: recipe.time ?? "",
    quantity: recipe.quantity?.toString() ?? "",
  });
  const [temp, setTemp] = useState({
    value: recipe.temperature?.value.toString() ?? "",
    unit: (recipe.temperature?.unit ?? "°C") as TemperatureUnit,
  });
  // Section ids double as row keys, so saving keeps them stable.
  const [rows, setRows] = useState<Row[]>(() =>
    recipe.sections.flatMap((section, i): Row[] => [
      // Only a leading unnamed section is headless; later ones keep a (blank) heading row so they stay separate.
      ...(i === 0 && section.name === undefined
        ? []
        : [{ key: section.id ?? newKey(), kind: "section" as const, name: section.name ?? "" }]),
      ...section.ingredients.map((ing) => ({
        key: newKey(),
        kind: "item" as const,
        quantity: ing.quantity.toString(),
        unit: ing.unit,
        ingredient_name: ing.ingredient_name,
      })),
    ]),
  );
  // The unnamed leading section keeps its id across saves; a new id is made only if there was none.
  const [leadId] = useState(() => (recipe.sections[0]?.name === undefined && recipe.sections[0]?.id) || newKey());
  const [steps, setSteps] = useState<Step[]>(() =>
    recipe.steps.map((st) => ({ key: newKey(), text: st.text, tags: st.tags ?? [] })),
  );

  const categoryOptions = [...new Set([...DEFAULT_CATEGORIES, ...categories, details.category])];

  // The row just added by "Add ingredient" / "Add section" / "Add step" takes focus.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const addRow = (kind: Row["kind"]) => {
    const key = newKey();
    setRows((r) => [
      ...r,
      kind === "item" ? { key, kind, quantity: "", unit: "g", ingredient_name: "" } : { key, kind, name: "" },
    ]);
    setFocusKey(key);
  };
  const addStep = () => {
    const key = newKey();
    setSteps((r) => [...r, { key, text: "", tags: [] }]);
    setFocusKey(key);
  };

  const setDetail = (field: keyof typeof details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDetails((d) => ({ ...d, [field]: e.target.value }));
  const updateRow = (key: string, patch: Partial<ItemRow> & Partial<SectionRow>) =>
    setRows((r) => r.map((row) => (row.key === key ? ({ ...row, ...patch } as Row) : row)));
  const updateStep = (key: string, patch: Partial<Step>) =>
    setSteps((r) => r.map((st) => (st.key === key ? { ...st, ...patch } : st)));

  // Step tags: one step at a time has its small add form open.
  const [tagStepKey, setTagStepKey] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const openTagForm = (key: string) => {
    setTagStepKey(key);
    setTagDraft("");
  };
  const addTag = (key: string) => {
    const description = tagDraft.trim();
    if (!description) return;
    const tag: StepTag = { description };
    setSteps((r) => r.map((st) => (st.key === key ? { ...st, tags: [...st.tags, tag] } : st)));
    setTagStepKey(null);
  };

  // Drag a row or step by its handle; hovering it over another entry moves it into that spot.
  const [drag, setDrag] = useState<Dragging | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Window listeners, not pointer capture: React moves the dragged row in the DOM, which drops capture.
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const over = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-drag-key]");
      const overKey = over?.dataset.dragKey;
      if (overKey && overKey !== drag.key && over?.dataset.dragList === drag.list) {
        const move = <T extends { key: string }>(r: T[]) =>
          reorder(
            r,
            drag.key,
            r.findIndex((x) => x.key === overKey),
          );
        if (drag.list === "rows") setRows(move);
        else setSteps(move);
      }
      // Scroll the form while dragging near its top or bottom edge.
      const box = scrollRef.current?.getBoundingClientRect();
      if (box && e.clientY < box.top + 48) scrollRef.current?.scrollBy({ top: -12 });
      if (box && e.clientY > box.bottom - 48) scrollRef.current?.scrollBy({ top: 12 });
    };
    const stop = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [drag]);

  const onGripDown = (list: Dragging["list"], key: string) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    setDrag({ list, key });
  };

  const onGripKey = (list: Dragging["list"], key: string, i: number) => (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const to = e.key === "ArrowUp" ? i - 1 : i + 1;
    if (list === "rows") setRows((r) => reorder(r, key, to));
    else setSteps((r) => reorder(r, key, to));
  };

  const canSave = details.name.trim() !== "";

  const build = (): Recipe => {
    const quantity = toNumber(details.quantity);
    const tempValue = toNumber(temp.value);
    // Ingredients above the first section row go in an unnamed section; each section row starts a new one.
    const sections: IngredientSection[] = [];
    let current: IngredientSection | undefined;
    for (const row of rows) {
      if (row.kind === "section") {
        current = { id: row.key, name: optional(row.name), ingredients: [] };
        sections.push(current);
        continue;
      }
      const quantity = toNumber(row.quantity);
      const ingredient_name = row.ingredient_name.trim();
      if (quantity === undefined && !ingredient_name) continue;
      if (!current) {
        current = { id: leadId, ingredients: [] };
        sections.push(current);
      }
      // `quantity` is required by the shared `Ingredient`; a blank one is saved as 0.
      current.ingredients.push({ quantity: quantity ?? 0, unit: row.unit, ingredient_name });
    }
    return {
      id: recipe.id,
      name: details.name.trim(),
      category: details.category.trim() || "Uncategorized",
      quantity,
      time: optional(details.time),
      temperature: tempValue === undefined ? undefined : { value: tempValue, unit: temp.unit },
      description: optional(details.description),
      note: optional(details.note),
      sections,
      steps: steps
        .filter((st) => st.text.trim())
        .map((st) => ({ text: st.text.trim(), ...(st.tags.length > 0 && { tags: st.tags }) })),
    };
  };

  // Compared against the recipe as first built, so reverting a change clears the flag.
  const initial = useRef<string | null>(null);
  const current = JSON.stringify(build());
  initial.current ??= current;
  const dirty = current !== initial.current;

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(build());
    } catch (error) {
      setSaveError(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
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
        <div className="min-w-0">
          <DialogTitle className="truncate font-display text-[22px] leading-tight font-bold">
            {isNew ? "New recipe" : "Edit recipe"}
          </DialogTitle>
          {dirty && (
            <p aria-live="polite" className="flex items-center gap-1.5 text-label-sm text-muted-foreground">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              Unsaved changes
            </p>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className={cn(MODAL_PILL, "border border-input")}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave || saving} className={cn(MODAL_PILL, "font-bold")}>
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </Button>
        </div>
      </header>
      {saveError && (
        <p
          role="alert"
          className="shrink-0 border-b border-border bg-destructive/10 px-5 py-2.5 text-label-sm text-destructive min-[761px]:px-7.5"
        >
          {saveError}
        </p>
      )}

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto overscroll-contain px-5 pt-5 pb-7 min-[761px]:px-7.5"
      >
        <section className="flex flex-col gap-3">
          <h3 className={MODAL_HEADING}>Details</h3>
          <Field id="edit-name" label="Recipe name" required>
            <Input
              id="edit-name"
              value={details.name}
              onChange={setDetail("name")}
              maxLength={60}
              autoFocus={isNew}
              className={INPUT}
            />
          </Field>
          <Field id="edit-category" label="Category">
            <NativeSelect
              id="edit-category"
              value={details.category}
              onChange={(e) => setDetails((d) => ({ ...d, category: e.target.value }))}
              className="font-normal text-foreground-ingredient"
            >
              {categoryOptions.map((c) => (
                <NativeSelectOption key={c} value={c}>
                  {c}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="edit-temp" label="Temp">
              <UnitField
                id="edit-temp"
                value={temp.value}
                unit={temp.unit}
                units={TEMPERATURE_UNITS}
                placeholder="180"
                onValueChange={(value) => setTemp((t) => ({ ...t, value }))}
                onUnitChange={(unit) => setTemp((t) => ({ ...t, unit }))}
              />
            </Field>
            <Field id="edit-time" label="Est. Time">
              <Input
                id="edit-time"
                value={details.time}
                placeholder="2 hr 30 min"
                onChange={setDetail("time")}
                className={INPUT}
              />
            </Field>
            <div className="col-span-2">
              <Field id="edit-quantity" label="Quantity">
                <Input
                  id="edit-quantity"
                  inputMode="numeric"
                  value={details.quantity}
                  placeholder="12"
                  onChange={(e) => setDetails((d) => ({ ...d, quantity: toIntegerInput(e.target.value) }))}
                  className={cn(INPUT, "font-semibold text-honey tabular")}
                />
              </Field>
            </div>
          </div>
          <Field id="edit-description" label="Description" hint="(optional)">
            <AutoTextarea
              id="edit-description"
              value={details.description}
              placeholder="What makes this recipe special"
              onChange={setDetail("description")}
              className={cn(AREA, "min-h-20")}
            />
          </Field>
          <Field id="edit-note" label="Baker's note" hint="(optional)">
            <AutoTextarea
              id="edit-note"
              value={details.note}
              placeholder="Tips, swaps or reminders"
              onChange={setDetail("note")}
              className={cn(AREA, "min-h-20")}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className={MODAL_HEADING}>Ingredients</h3>
          {rows.map((row, i) =>
            row.kind === "section" ? (
              <div key={row.key} data-drag-key={row.key} data-drag-list="rows" className="flex items-center gap-2">
                <Input
                  aria-label="Section name"
                  autoFocus={row.key === focusKey}
                  value={row.name}
                  placeholder="Section name, e.g. Dough"
                  onChange={(e) => updateRow(row.key, { name: e.target.value })}
                  className={cn(INPUT, "h-9 flex-1 border-dashed border-input bg-transparent font-bold text-honey")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove section"
                  onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                  className={REMOVE}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ) : (
              <div
                key={row.key}
                data-drag-key={row.key}
                data-drag-list="rows"
                className={cn(
                  "flex items-center gap-2 rounded-card transition-[background-color,box-shadow] motion-reduce:transition-none",
                  drag?.key === row.key && "bg-surface-chip shadow-card-side ring-1 ring-line-active",
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Reorder ingredient ${i + 1}. Drag, or use the up and down arrow keys`}
                  onPointerDown={onGripDown("rows", row.key)}
                  onKeyDown={onGripKey("rows", row.key, i)}
                  className={cn(
                    "-mr-1.5 h-11 w-6 shrink-0 touch-none rounded-pill text-foreground-faint",
                    drag?.key === row.key ? "cursor-grabbing" : "cursor-grab",
                  )}
                >
                  <GripVerticalIcon className="size-4" />
                </Button>
                <Input
                  aria-label={`Ingredient ${i + 1} quantity`}
                  autoFocus={row.key === focusKey}
                  inputMode="decimal"
                  value={row.quantity}
                  placeholder="0"
                  onChange={(e) => updateRow(row.key, { quantity: toNumberInput(e.target.value) })}
                  className={cn(INPUT, "w-16 shrink-0 px-2 text-center font-semibold text-honey tabular")}
                />
                <NativeSelect
                  aria-label={`Ingredient ${i + 1} unit`}
                  value={row.unit}
                  onChange={(e) => updateRow(row.key, { unit: e.target.value as IngredientUnit })}
                  wrapperClassName="w-20 shrink-0"
                >
                  {INGREDIENT_UNITS.map((u) => (
                    <NativeSelectOption key={u} value={u}>
                      {u}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Input
                  aria-label={`Ingredient ${i + 1} name`}
                  value={row.ingredient_name}
                  placeholder="Ingredient"
                  onChange={(e) => updateRow(row.key, { ingredient_name: e.target.value })}
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
            ),
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="ghost" onClick={() => addRow("item")} className={ADD}>
              <PlusIcon className="size-4" />
              Add ingredient
            </Button>
            <Button type="button" variant="ghost" onClick={() => addRow("section")} className={ADD}>
              <PlusIcon className="size-4" />
              Add section
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className={MODAL_HEADING}>Steps</h3>
          {steps.map((st, i) => (
            <div
              key={st.key}
              data-drag-key={st.key}
              data-drag-list="steps"
              className={cn(
                "flex flex-col gap-1.5 rounded-card transition-[background-color,box-shadow] motion-reduce:transition-none",
                drag?.key === st.key && "bg-surface-chip shadow-card-side ring-1 ring-line-active",
              )}
            >
              <div className="flex items-start gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Reorder step ${i + 1}. Drag, or use the up and down arrow keys`}
                  onPointerDown={onGripDown("steps", st.key)}
                  onKeyDown={onGripKey("steps", st.key, i)}
                  className={cn(
                    "-mr-2 h-11 w-7 shrink-0 touch-none rounded-pill text-foreground-faint",
                    drag?.key === st.key ? "cursor-grabbing" : "cursor-grab",
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
                  onChange={(e) => updateStep(st.key, { text: e.target.value })}
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

              <div className="flex flex-wrap items-center gap-1.5 pl-16">
                {st.tags.map((tag, t) => (
                  <span
                    key={tag.description}
                    className="flex items-center gap-1 rounded-pill bg-primary/15 py-0.5 pr-1 pl-2.5 text-label-sm font-semibold text-honey"
                  >
                    {tag.description}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${tag.description ?? "tag"} from step ${i + 1}`}
                      onClick={() => updateStep(st.key, { tags: st.tags.filter((_, j) => j !== t) })}
                      className="size-5 rounded-full p-0 text-honey"
                    >
                      <XIcon className="size-3" />
                    </Button>
                  </span>
                ))}
                {tagStepKey === st.key ? (
                  <div className="flex w-full flex-wrap items-center gap-1.5">
                    <Input
                      aria-label="Tag description"
                      autoFocus
                      value={tagDraft}
                      placeholder="Rest · overnight"
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        addTag(st.key);
                      }}
                      className={cn(INPUT, "h-9 w-56")}
                    />
                    <Button
                      type="button"
                      onClick={() => addTag(st.key)}
                      disabled={!tagDraft.trim()}
                      className="h-9 rounded-pill px-3 text-label font-bold"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setTagStepKey(null)}
                      className="h-9 rounded-pill px-3 text-label"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => openTagForm(st.key)}
                    className="h-7 gap-1 rounded-pill px-2 text-label-sm text-muted-foreground"
                  >
                    <PlusIcon className="size-3" />
                    Add description
                  </Button>
                )}
              </div>
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
