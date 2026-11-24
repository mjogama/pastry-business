import type { ProductsRepository } from "./products.repository";
import type { ListProductsQuery } from "@common/modules/product";
import { BadRequestError, NotFoundError } from "@shared/errors/AppError";
import type { CategoriesRepository } from "../categories/categories.repository";
import type { DateKey, Product, CreateProductInput, UpdateProductInput } from "./products.schema";

/** Manila is UTC+8 all year (no daylight saving). */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

export const manilaToday = (now: Date): DateKey =>
  new Date(now.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10);

export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository,
    private readonly categories: CategoriesRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  list(query?: ListProductsQuery): Promise<Product[]> {
    return this.repository.findAll(query);
  }

  async getById(id: string): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) throw new NotFoundError(`Product ${id} not found`);
    return product;
  }

  async create(input: CreateProductInput): Promise<Product> {
    await this.assertCategoryExists(input.categoryId);
    this.assertDiscount(input.discountPrice, input.discountEndsAt);
    this.assertEndsAtNotPast(input.discountEndsAt);
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const current = await this.getById(id);
    if (input.categoryId !== undefined) await this.assertCategoryExists(input.categoryId);

    // The rules apply to the product as it will be after the change, not to the fields sent alone.
    const price = input.price ?? current.price;
    const discountPrice =
      input.discountPrice === undefined ? current.discountPrice : (input.discountPrice ?? undefined);
    // No discount price means no end date: the two are tied, so removing the price drops the date too.
    const clearsDiscount = input.discountPrice === null && input.discountEndsAt === undefined;
    const discountEndsAt = clearsDiscount
      ? undefined
      : input.discountEndsAt === undefined
        ? current.discountEndsAt
        : (input.discountEndsAt ?? undefined);
    if (discountPrice !== undefined && discountPrice >= price) {
      throw new BadRequestError("Discount must be lower than the price");
    }
    this.assertDiscount(discountPrice, discountEndsAt);
    // Only a new or changed end date has to be today or later; an old sale can keep its past date.
    if (discountEndsAt !== current.discountEndsAt) this.assertEndsAtNotPast(discountEndsAt);

    return this.repository.update(id, clearsDiscount ? { ...input, discountEndsAt: null } : input);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }

  private async assertCategoryExists(categoryId: string) {
    if (!(await this.categories.findById(categoryId))) throw new NotFoundError(`Category ${categoryId} not found`);
  }

  private assertDiscount(discountPrice: number | undefined, discountEndsAt: DateKey | undefined) {
    if (discountEndsAt !== undefined && discountPrice === undefined) {
      throw new BadRequestError("A sale end date needs a discount price");
    }
  }

  private assertEndsAtNotPast(discountEndsAt: DateKey | undefined) {
    if (discountEndsAt !== undefined && discountEndsAt < manilaToday(this.clock())) {
      throw new BadRequestError("The sale end date can’t be in the past.");
    }
  }
}
