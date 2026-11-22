import type { Ingredient, IngredientSection, Recipe, RecipeStep, Temperature } from "@common/modules/recipes";

import { INGREDIENT_UNITS, TEMPERATURE_UNITS } from "./format";

/**
 * API data to display-safe `Recipe`s. The server can send `null` (or nothing) where the shared
 * types say a field is optional, so every field is checked here: missing text becomes "" or is
 * left out, missing numbers fall back or are left out, and missing lists become [].
 */

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const list = <T>(v: readonly (T | null | undefined)[] | null | undefined): T[] =>
  Array.isArray(v) ? v.filter((x): x is T => x !== null && x !== undefined) : [];
const isOneOf = <U extends string>(options: readonly U[], v: unknown): v is U => options.includes(v as U);

const normalizeTemperature = (t: Temperature | null | undefined): Temperature | undefined => {
  const value = num(t?.value);
  return t && value !== undefined && isOneOf(TEMPERATURE_UNITS, t.unit) ? { value, unit: t.unit } : undefined;
};

const normalizeIngredient = (i: Ingredient): Ingredient => ({
  quantity: num(i.quantity) ?? 0,
  unit: isOneOf(INGREDIENT_UNITS, i.unit) ? i.unit : "g",
  ingredient_name: text(i.ingredient_name),
});

const normalizeSection = (s: IngredientSection): IngredientSection => {
  const id = text(s.id);
  const name = text(s.name);
  return {
    ...(id && { id }),
    ...(name && { name }),
    ingredients: list(s.ingredients)
      .map(normalizeIngredient)
      .filter((i) => i.ingredient_name),
  };
};

const normalizeStep = (s: RecipeStep): RecipeStep => {
  const tags = list(s.tags)
    .map((tag) => text(tag.description))
    .filter(Boolean)
    .map((description) => ({ description }));
  return { text: text(s.text), ...(tags.length > 0 && { tags }) };
};

export const normalizeRecipe = (r: Recipe): Recipe => {
  const quantity = num(r.quantity);
  const temperature = normalizeTemperature(r.temperature);
  const time = text(r.time);
  const description = text(r.description);
  const note = text(r.note);
  return {
    id: text(r.id),
    name: text(r.name) || "Untitled recipe",
    category: text(r.category) || "Uncategorized",
    ...(quantity !== undefined && { quantity }),
    ...(time && { time }),
    ...(temperature && { temperature }),
    ...(description && { description }),
    ...(note && { note }),
    sections: list(r.sections).map(normalizeSection),
    steps: list(r.steps)
      .map(normalizeStep)
      .filter((s) => s.text),
  };
};

/** Recipes without an id are dropped: the carousel and the editor key everything by it. */
export const normalizeRecipes = (recipes: Recipe[] | null | undefined): Recipe[] =>
  list(recipes)
    .map(normalizeRecipe)
    .filter((r) => r.id);
