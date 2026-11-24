import type { CategoriesRepository } from "./categories.repository";
import { ConflictError, NotFoundError } from "@shared/errors/AppError";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "./categories.schema";

export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  list(limit?: number): Promise<Category[]> {
    return this.repository.findAll(limit);
  }

  async getById(id: string): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) throw new NotFoundError(`Category ${id} not found`);
    return category;
  }

  async create({ name, sortOrder }: CreateCategoryInput): Promise<Category> {
    await this.assertNameFree(name);
    return this.repository.create({ name, sortOrder: sortOrder ?? (await this.repository.maxSortOrder()) + 1 });
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    await this.getById(id);
    if (input.name !== undefined) await this.assertNameFree(input.name, id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    const products = await this.repository.countProducts(id);
    if (products > 0) {
      throw new ConflictError(
        `This category still has ${products} product${products === 1 ? "" : "s"}. Move or delete them first`,
      );
    }
    await this.repository.delete(id);
  }

  /** Category names are unique, ignoring case; `exceptId` lets a category keep its own name on update. */
  private async assertNameFree(name: string, exceptId?: string) {
    const existing = await this.repository.findByName(name);
    if (existing && existing.id !== exceptId) throw new ConflictError(`A category named "${name}" already exists`);
  }
}
