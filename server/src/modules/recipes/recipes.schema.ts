import { z } from "zod";

import type { CreateRecipeInput, ListRecipesQuery, Recipe, UpdateRecipeInput } from "@common/modules/recipes";

export type { CreateRecipeInput, Recipe, UpdateRecipeInput } from "@common/modules/recipes";

const ingredientSchema = z.object({
  quantity: z.number(),
  unit: z.enum(["mg", "g", "tsp", "tbsp", "c", "pc"]),
  ingredient_name: z.string(),
});

const sectionSchema = z.object({
  id: z.string().min(1).exactOptional(),
  name: z.string().exactOptional(),
  ingredients: z.array(ingredientSchema),
});

const stepSchema = z.object({
  text: z.string(),
  tags: z.array(z.object({ description: z.string().exactOptional() })).exactOptional(),
});

export const recipeSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(60),
  category: z.string(),
  quantity: z.number().int().exactOptional(),
  time: z.string().exactOptional(),
  temperature: z.object({ value: z.number(), unit: z.enum(["°C", "°F"]) }).exactOptional(),
  description: z.string().exactOptional(),
  sections: z.array(sectionSchema),
  steps: z.array(stepSchema),
  note: z.string().exactOptional(),
}) satisfies z.ZodType<Recipe>;

export const listRecipesSchemas = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }) satisfies z.ZodType<Required<ListRecipesQuery>>,
};

const idParams = z.object({ id: z.uuid() });

export const getRecipesSchemas = {
  params: idParams,
};

export const createRecipesSchemas = {
  body: recipeSchema.omit({ id: true }) satisfies z.ZodType<CreateRecipeInput>,
};

export const updateRecipesSchemas = {
  params: idParams,
  body: recipeSchema.omit({ id: true }) satisfies z.ZodType<UpdateRecipeInput>,
};

export const deleteRecipesSchemas = {
  params: idParams,
};
