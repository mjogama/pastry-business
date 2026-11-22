import type { RecipesRepository } from "./recipes.repository";
import { ConflictError, NotFoundError } from "@shared/errors/AppError";
import type { CreateRecipeInput, Recipe, UpdateRecipeInput } from "./recipes.schema";

export class RecipesService {
  constructor(private readonly repository: RecipesRepository) {}

  list(page: number = 1, limit: number = 10): Promise<Recipe[]> {
    return this.repository.findAll(page, limit);
  }

  async getById(id: string): Promise<Recipe> {
    const recipe = await this.repository.findById(id);
    if (!recipe) throw new NotFoundError(`Recipe ${id} not found`);
    return recipe;
  }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    await this.assertNameFree(input.name);
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateRecipeInput): Promise<Recipe> {
    await this.getById(id);
    await this.assertNameFree(input.name, id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }

  /** Recipe names are unique; `exceptId` lets a recipe keep its own name on update. */
  private async assertNameFree(name: string, exceptId?: string) {
    const existing = await this.repository.findByName(name);
    if (existing && existing.id !== exceptId) throw new ConflictError(`A recipe named "${name}" already exists`);
  }
}
