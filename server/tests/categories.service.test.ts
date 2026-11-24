import { randomUUID } from "node:crypto";
import type { CategoriesRepository } from "@modules/categories/categories.repository";
import type { Category } from "@modules/categories/categories.schema";
import { CategoriesService } from "@modules/categories/categories.service";
import { ConflictError, NotFoundError } from "@shared/errors/AppError";
import { beforeEach, describe, expect, it } from "vitest";

describe("CategoriesService", () => {
  let service: CategoriesService;
  let categories: Category[];
  let productCount = 0;

  beforeEach(() => {
    categories = [];
    productCount = 0;
    const repository: CategoriesRepository = {
      findAll: async () => categories,
      findById: async (id) => categories.find((c) => c.id === id) ?? null,
      findByName: async (name) => categories.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null,
      maxSortOrder: async () => Math.max(-1, ...categories.map((c) => c.sortOrder)),
      countProducts: async () => productCount,
      create: async (input) => {
        const category = { id: randomUUID(), ...input };
        categories.push(category);
        return category;
      },
      update: async (id, input) => {
        const category = { ...(categories.find((c) => c.id === id) as Category), ...input };
        categories = categories.map((c) => (c.id === id ? category : c));
        return category;
      },
      delete: async (id) => {
        categories = categories.filter((c) => c.id !== id);
      },
    };
    service = new CategoriesService(repository);
  });

  it("puts a new category at the end unless told where", async () => {
    expect((await service.create({ name: "Breads" })).sortOrder).toBe(0);
    expect((await service.create({ name: "Pastries" })).sortOrder).toBe(1);
    expect((await service.create({ name: "Drinks", sortOrder: 9 })).sortOrder).toBe(9);
  });

  it("keeps names unique, ignoring case, but lets a category keep its own", async () => {
    const breads = await service.create({ name: "Breads" });
    await expect(service.create({ name: "breads" })).rejects.toBeInstanceOf(ConflictError);
    expect(await service.update(breads.id, { name: "BREADS" })).toMatchObject({ name: "BREADS" });
  });

  it("won't delete a category that still has products", async () => {
    const breads = await service.create({ name: "Breads" });
    productCount = 2;
    await expect(service.delete(breads.id)).rejects.toBeInstanceOf(ConflictError);
    productCount = 0;
    await service.delete(breads.id);
    await expect(service.getById(breads.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
