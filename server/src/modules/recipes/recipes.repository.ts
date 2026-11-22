import db from "@app/config/db";
import { Prisma } from "../../generated/prisma/client";
import type { Temperature } from "@common/modules/recipes";
import type { CreateRecipeInput, Recipe, UpdateRecipeInput } from "./recipes.schema";

const include = {
  sections: { orderBy: { position: "asc" }, include: { ingredients: { orderBy: { position: "asc" } } } },
  steps: { orderBy: { position: "asc" }, include: { tags: { orderBy: { position: "asc" } } } },
} satisfies Prisma.RecipeInclude;

type RecipeRow = Prisma.RecipeGetPayload<{ include: typeof include }>;

const toRecipe = (row: RecipeRow): Recipe => ({
  id: row.id,
  name: row.name,
  category: row.category,
  ...(row.quantity !== null && { quantity: row.quantity }),
  ...(row.time !== null && { time: row.time }),
  ...(row.temperature !== null && { temperature: row.temperature as unknown as Temperature }),
  ...(row.description !== null && { description: row.description }),
  ...(row.note !== null && { note: row.note }),
  sections: row.sections.map((section) => ({
    id: section.id,
    ...(section.name !== null && { name: section.name }),
    ingredients: section.ingredients.map((ing) => ({
      quantity: ing.quantity,
      unit: ing.unit,
      ingredient_name: ing.ingredient_name,
    })),
  })),
  steps: row.steps.map((step) => ({
    text: step.text,
    ...(step.tags.length > 0 && {
      tags: step.tags.map((tag) => (tag.description !== null ? { description: tag.description } : {})),
    }),
  })),
});

/** Nested `create` data for a recipe's sections and steps; `position` keeps the order they were sent in. */
const toSectionsCreate = (sections: CreateRecipeInput["sections"]) =>
  sections.map(({ name, ingredients }, position) => ({
    position,
    name: name ?? null,

    ingredients: {
      create: ingredients.map(({ unit, quantity, ingredient_name }, position) => ({
        position,
        unit,
        quantity,
        ingredient_name,
      })),
    },
  }));

const toStepsCreate = (steps: CreateRecipeInput["steps"]) =>
  steps.map(({ text, tags = [] }, position) => ({
    position,
    text,
    tags: { create: tags.map((tag, i) => ({ ...tag, position: i })) },
  }));

/** Optional fields left out of the request are cleared, since an update replaces the whole recipe. */
const toScalars = ({ name, category, quantity, time, temperature, description, note }: CreateRecipeInput) => ({
  name,
  category,
  quantity: quantity ?? null,
  time: time ?? null,
  temperature: temperature ? { unit: temperature.unit, value: temperature.value } : Prisma.DbNull,
  description: description ?? null,
  note: note ?? null,
});

export interface RecipesRepository {
  findAll(page: number, limit: number): Promise<Recipe[]>;
  findById(id: string): Promise<Recipe | null>;
  findByName(name: string): Promise<Recipe | null>;
  create(input: CreateRecipeInput): Promise<Recipe>;
  update(id: string, input: UpdateRecipeInput): Promise<Recipe>;
  delete(id: string): Promise<void>;
}

export class PrismaRecipesRepository implements RecipesRepository {
  async create(input: CreateRecipeInput): Promise<Recipe> {
    const row = await db.recipe.create({
      data: {
        ...toScalars(input),
        sections: { create: toSectionsCreate(input.sections) },
        steps: { create: toStepsCreate(input.steps) },
      },
      include,
    });
    return toRecipe(row);
  }

  /** Replaces the recipe: old sections and steps are deleted (their ingredients and tags cascade) and recreated. */
  async update(id: string, input: UpdateRecipeInput): Promise<Recipe> {
    const row = await db.recipe.update({
      where: { id },
      data: {
        ...toScalars(input),
        sections: { deleteMany: {}, create: toSectionsCreate(input.sections) },
        steps: { deleteMany: {}, create: toStepsCreate(input.steps) },
      },
      include,
    });
    return toRecipe(row);
  }

  async delete(id: string): Promise<void> {
    await db.recipe.delete({ where: { id } });
  }

  async findAll(page: number, limit: number): Promise<Recipe[]> {
    const rows = await db.recipe.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include,
    });
    return rows.map(toRecipe);
  }

  async findById(id: string): Promise<Recipe | null> {
    const row = await db.recipe.findUnique({ where: { id }, include });
    return row ? toRecipe(row) : null;
  }

  async findByName(name: string): Promise<Recipe | null> {
    const row = await db.recipe.findFirst({ where: { name }, include });
    return row ? toRecipe(row) : null;
  }
}
