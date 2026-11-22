import type { CreateRecipeInput, ListRecipesQuery, Recipe, UpdateRecipeInput } from "@common/modules/recipes";

import { api, isApiError } from "@/lib/api/client";

import { normalizeRecipe, normalizeRecipes } from "./lib/normalize";

/** GET /recipes. The carousel shows every recipe, so it asks for the server's maximum page size (100). */
export const getRecipes = async (query: ListRecipesQuery = { page: 1, limit: 100 }) =>
  normalizeRecipes(await api.get<Recipe[]>("/recipes", { query: { ...query }, cache: "no-store" }));

/** POST /recipes */
export const createRecipe = async (input: CreateRecipeInput) =>
  normalizeRecipe(await api.post<Recipe>("/recipes", input));

/** PUT /recipes/:id. Replaces the whole recipe. */
export const updateRecipe = async (id: string, input: UpdateRecipeInput) =>
  normalizeRecipe(await api.put<Recipe>(`/recipes/${id}`, input));

/** DELETE /recipes/:id */
export const deleteRecipe = (id: string) => api.delete<null>(`/recipes/${id}`);

/** A message to show the user for a failed request, including the first field error from validation. */
export const recipeErrorMessage = (error: unknown) => {
  if (!isApiError(error)) return "Something went wrong. Please try again.";
  const [field] = Object.entries(error.fieldErrors);
  return field ? `${error.message}: ${field[0]} ${field[1]}` : error.message;
};
