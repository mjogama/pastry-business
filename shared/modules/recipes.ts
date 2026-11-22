export type IngredientUnit = "mg" | "g" | "tsp" | "tbsp" | "c" | "pc";
export type TemperatureUnit = "°C" | "°F";

export interface Ingredient {
  quantity: number;
  unit: IngredientUnit;
  ingredient_name: string;
}

export interface Temperature {
  unit: TemperatureUnit;
  value: number;
}

export interface IngredientSection {
  id?: string;
  name?: string;
  ingredients: Ingredient[];
}

export interface StepTag {
  description?: string;
}

export interface RecipeStep {
  text: string;
  tags?: StepTag[];
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  quantity?: number;
  time?: string;
  temperature?: Temperature;
  description?: string;
  note?: string;
  sections: IngredientSection[];
  steps: RecipeStep[];
}

export interface ListRecipesQuery {
  page?: number;
  limit?: number;
}

export type CreateRecipeInput = Omit<Recipe, "id">;

export type UpdateRecipeInput = CreateRecipeInput;
