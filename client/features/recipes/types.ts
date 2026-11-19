/** `grams` is a plain number; the UI adds the "g" when displaying it. */
export type Ingredient = { grams?: number; item: string };

/** Docs/RECIPIES_UI_V1.md §3. Time and quantity are free text until the API stores `totalMinutes`. */
export type Recipe = {
  id: string;
  name: string;
  category: string;
  quantity?: string;
  time?: string;
  temperature?: string;
  description?: string;
  ingredients: Ingredient[];
  steps: string[];
  note?: string;
};
