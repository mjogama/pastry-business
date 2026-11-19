export interface Ingredient {
  /** Plain number; the UI adds the "g". */
  grams?: number;
  item: string;
}

export interface Recipe {
  id: string;
  /** Up to 60 characters. */
  name: string;
  category: string;
  /** e.g. "Makes 24 rolls". */
  quantity?: string;
  /** e.g. "2 hr 30 min". */
  time?: string;
  temperature?: string;
  description?: string;
  ingredients: Ingredient[];
  /** In order. */
  steps: string[];
  /** Baker's note. */
  note?: string;
}

export interface ListRecipesQuery {
  limit?: number;
  category?: string;
}

export type CreateRecipeInput = Omit<Recipe, "id">;

/** `PUT /recipes/:id` replaces the whole recipe (the editor saves every field). */
export type UpdateRecipeInput = CreateRecipeInput;
