import { randomUUID } from "node:crypto";
import type { RecipesRepository } from "@modules/recipes/recipes.repository";
import type { Recipe } from "@modules/recipes/recipes.schema";
import { RecipesService } from "@modules/recipes/recipes.service";
import { ConflictError, NotFoundError } from "@shared/errors/AppError";
import { beforeEach, describe, expect, it } from "vitest";

const makeRecipe = (name: string): Recipe => ({
  id: randomUUID(),
  name,
  category: "bread",
  sections: [
    { id: randomUUID(), name: "Dough", ingredients: [{ quantity: 500, unit: "g", ingredient_name: "flour" }] },
  ],
  steps: [{ text: "Mix", tags: [{ description: "Rest 30 min" }] }],
});

describe("RecipesService", () => {
  let service: RecipesService;
  let items: Recipe[];

  beforeEach(() => {
    items = [makeRecipe("a"), makeRecipe("b")];
    const repository: RecipesRepository = {
      findAll: async (page, limit) => items.slice((page - 1) * limit, page * limit),
      findById: async (id) => items.find((item) => item.id === id) ?? null,
      findByName: async (name) => items.find((item) => item.name === name) ?? null,
      create: async (input) => {
        const recipe = { id: randomUUID(), ...input };
        items.push(recipe);
        return recipe;
      },
      update: async (id, input) => {
        const recipe = { id, ...input };
        items = items.map((item) => (item.id === id ? recipe : item));
        return recipe;
      },
      delete: async (id) => {
        items = items.filter((item) => item.id !== id);
      },
    };
    service = new RecipesService(repository);
  });

  it("returns a recipe by id", async () => {
    expect(await service.getById(items[0]!.id)).toEqual(items[0]);
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(service.getById(randomUUID())).rejects.toBeInstanceOf(NotFoundError);
  });

  it("creates a recipe", async () => {
    const { id: _, ...input } = makeRecipe("c");
    const created = await service.create(input);

    expect(created).toMatchObject(input);
    expect(await service.getById(created.id)).toEqual(created);
  });

  it("rejects a duplicate name on create", async () => {
    const { id: _, ...input } = makeRecipe("a");
    await expect(service.create(input)).rejects.toBeInstanceOf(ConflictError);
  });

  it("updates a recipe and lets it keep its own name", async () => {
    const [first] = items;
    if (!first) throw new Error("missing seed recipe");
    const { id, ...input } = first;

    const updated = await service.update(id, { ...input, category: "pastry" });

    expect(updated).toEqual({ ...first, category: "pastry" });
  });

  it("rejects renaming a recipe to another recipe's name", async () => {
    const [first] = items;
    if (!first) throw new Error("missing seed recipe");
    const { id, ...input } = first;

    await expect(service.update(id, { ...input, name: "b" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws NotFoundError when updating or deleting an unknown id", async () => {
    const { id: _, ...input } = makeRecipe("c");
    await expect(service.update(randomUUID(), input)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.delete(randomUUID())).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deletes a recipe", async () => {
    const [first] = items;
    if (!first) throw new Error("missing seed recipe");

    await service.delete(first.id);

    await expect(service.getById(first.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("respects page and limit", async () => {
    expect(await service.list(1, 1)).toEqual([items[0]]);
    expect(await service.list(2, 1)).toEqual([items[1]]);
  });
});
