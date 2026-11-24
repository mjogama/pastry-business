import db from "@app/config/db";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "./categories.schema";

const toCategory = ({ id, name, sortOrder }: Category): Category => ({ id, name, sortOrder });

export interface CategoriesRepository {
  /** In menu order: `sortOrder`, then creation. */
  findAll(limit?: number): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  /** The highest `sortOrder`, or -1 with no categories. */
  maxSortOrder(): Promise<number>;
  countProducts(id: string): Promise<number>;
  create(input: Required<CreateCategoryInput>): Promise<Category>;
  update(id: string, input: UpdateCategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
}

export class PrismaCategoriesRepository implements CategoriesRepository {
  async findAll(limit?: number): Promise<Category[]> {
    const rows = await db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      ...(limit && { take: limit }),
    });
    return rows.map(toCategory);
  }

  async findById(id: string): Promise<Category | null> {
    const row = await db.category.findUnique({ where: { id } });
    return row && toCategory(row);
  }

  async findByName(name: string): Promise<Category | null> {
    const row = await db.category.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
    return row && toCategory(row);
  }

  async maxSortOrder(): Promise<number> {
    const { _max } = await db.category.aggregate({ _max: { sortOrder: true } });
    return _max.sortOrder ?? -1;
  }

  countProducts(id: string): Promise<number> {
    return db.product.count({ where: { categoryId: id } });
  }

  async create(input: Required<CreateCategoryInput>): Promise<Category> {
    return toCategory(await db.category.create({ data: input }));
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    return toCategory(await db.category.update({ where: { id }, data: input }));
  }

  async delete(id: string): Promise<void> {
    await db.category.delete({ where: { id } });
  }
}
