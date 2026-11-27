import { randomUUID } from "node:crypto";
import type { CategoriesRepository } from "@modules/categories/categories.repository";
import type { ProductsRepository } from "@modules/products/products.repository";
import type { Product } from "@modules/products/products.schema";
import { manilaToday, ProductsService } from "@modules/products/products.service";
import { BadRequestError, NotFoundError } from "@shared/errors/AppError";
import { beforeEach, describe, expect, it } from "vitest";

// 2026-11-23 10:00 in Manila.
const NOW = new Date("2026-11-23T02:00:00Z");
const categoryId = randomUUID();

const base = {
  name: "Ube Croissant",
  categoryId,
  shortDescription: "Flaky and buttery.",
  price: 85,
  isAvailable: true,
  isFeatured: false,
  sortOrder: 0,
  isArchived: false,
};

describe("ProductsService", () => {
  let service: ProductsService;
  let products: Product[];

  beforeEach(() => {
    products = [];
    const repository: ProductsRepository = {
      findAll: async ({ includeArchived } = {}) => products.filter((p) => includeArchived || !p.isArchived),
      findById: async (id) => products.find((p) => p.id === id) ?? null,
      create: async (input) => {
        const product = { id: randomUUID(), ...input };
        products.push(product);
        return product;
      },
      update: async (id, input) => {
        const current = products.find((p) => p.id === id) as Product;
        const next = { ...current } as Record<string, unknown>;
        for (const [key, value] of Object.entries(input)) {
          if (value === null) delete next[key];
          else next[key] = value;
        }
        products = products.map((p) => (p.id === id ? (next as unknown as Product) : p));
        return next as unknown as Product;
      },
      delete: async (id) => {
        products = products.filter((p) => p.id !== id);
      },
    };
    const categories = {
      findById: async (id: string) => (id === categoryId ? { id, name: "Pastries", sortOrder: 0 } : null),
    };
    service = new ProductsService(repository, categories as unknown as CategoriesRepository, () => NOW);
  });

  it("computes today in Manila", () => {
    expect(manilaToday(new Date("2026-11-22T17:00:00Z"))).toBe("2026-11-23");
  });

  it("creates a product in an existing category", async () => {
    expect(await service.create(base)).toMatchObject({ name: "Ube Croissant", price: 85 });
    await expect(service.create({ ...base, categoryId: randomUUID() })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("needs a discount price for a sale end date, and not in the past", async () => {
    await expect(service.create({ ...base, discountEndsAt: "2026-12-01" })).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.create({ ...base, discountPrice: 69, discountEndsAt: "2026-11-22" })).rejects.toBeInstanceOf(
      BadRequestError,
    );
    await service.create({ ...base, discountPrice: 69, discountEndsAt: "2026-11-23" });
  });

  it("checks the discount against the price after the change", async () => {
    const product = await service.create({ ...base, discountPrice: 69 });
    await expect(service.update(product.id, { price: 60 })).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.update(product.id, { discountPrice: 85 })).rejects.toBeInstanceOf(BadRequestError);
    expect(await service.update(product.id, { price: 90 })).toMatchObject({ price: 90, discountPrice: 69 });
  });

  it("keeps an old end date unless it is changed, and clears fields with null", async () => {
    const product = await service.create({ ...base, discountPrice: 69, discountEndsAt: "2026-11-23" });
    products[0] = { ...(products[0] as Product), discountEndsAt: "2026-11-01" };
    expect(await service.update(product.id, { name: "Ube Croissant II" })).toMatchObject({
      discountEndsAt: "2026-11-01",
    });
    await expect(service.update(product.id, { discountEndsAt: "2026-11-02" })).rejects.toBeInstanceOf(BadRequestError);
    const cleared = await service.update(product.id, { discountPrice: null, discountEndsAt: null });
    expect(cleared.discountPrice).toBeUndefined();
    expect(cleared.discountEndsAt).toBeUndefined();
  });

  it("drops the end date when the discount price is removed", async () => {
    const product = await service.create({ ...base, discountPrice: 69, discountEndsAt: "2026-11-23" });
    const cleared = await service.update(product.id, { discountPrice: null });
    expect(cleared.discountPrice).toBeUndefined();
    expect(cleared.discountEndsAt).toBeUndefined();
  });

  describe("sizes", () => {
    const sizes = [
      { name: "Small", price: 40, isAvailable: false },
      { name: "Medium", price: 60, discountPrice: 10, isAvailable: true },
      { name: "Large", price: 80, isAvailable: true },
    ];

    it("takes the price from the cheapest size and is available while any size is", async () => {
      const created = await service.create({
        ...base,
        price: 1,
        discountPrice: 0.5,
        isAvailable: false,
        variants: sizes,
      });
      expect(created).toMatchObject({ price: 40, isAvailable: true, variants: sizes });
      expect(created.discountPrice).toBeUndefined();
    });

    it("needs a size discount for a sale end date", async () => {
      const plain = sizes.map(({ discountPrice: _, ...v }) => v);
      await expect(service.create({ ...base, variants: plain, discountEndsAt: "2026-11-30" })).rejects.toBeInstanceOf(
        BadRequestError,
      );
      await service.create({ ...base, variants: sizes, discountEndsAt: "2026-11-30" });
    });

    it("turns every size on or off with the product's availability", async () => {
      const product = await service.create({ ...base, variants: sizes });
      const off = await service.update(product.id, { isAvailable: false });
      expect(off.isAvailable).toBe(false);
      expect(off.variants?.every((v) => !v.isAvailable)).toBe(true);
      const on = await service.update(product.id, { isAvailable: true });
      expect(on.variants?.every((v) => v.isAvailable)).toBe(true);
    });

    it("re-derives on a size change and drops the end date with the last discount", async () => {
      const product = await service.create({ ...base, variants: sizes, discountEndsAt: "2026-11-30" });
      const plain = sizes.map(({ discountPrice: _, ...v }) => ({ ...v, price: v.price + 5 }));
      const updated = await service.update(product.id, { variants: plain });
      expect(updated).toMatchObject({ price: 45, isAvailable: true });
      expect(updated.discountEndsAt).toBeUndefined();
    });
  });

  it("404s on a missing product and deletes an existing one", async () => {
    await expect(service.getById(randomUUID())).rejects.toBeInstanceOf(NotFoundError);
    const product = await service.create(base);
    await service.delete(product.id);
    expect(await service.list()).toEqual([]);
  });
});
