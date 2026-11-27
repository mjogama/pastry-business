import type { ProductsRepository } from "./products.repository";
import type { ListProductsQuery } from "@common/modules/product";
import { BadRequestError, NotFoundError } from "@shared/errors/AppError";
import type { CategoriesRepository } from "../categories/categories.repository";
import type { DateKey, Product, ProductVariant, CreateProductInput, UpdateProductInput } from "./products.schema";

/** Manila is UTC+8 all year (no daylight saving). */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

export const manilaToday = (now: Date): DateKey =>
  new Date(now.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10);

type Discounted = { discountPrice?: number | null | undefined; variants?: ProductVariant[] | undefined };

/** The product or any of its sizes has a discount. */
const hasDiscount = ({ discountPrice, variants }: Discounted) =>
  discountPrice != null || (variants ?? []).some((v) => v.discountPrice !== undefined);

const withoutDiscount = <T extends { discountPrice?: number }>({ discountPrice: _, ...rest }: T) => rest;

/**
 * A product with sizes takes its price and discount from the cheapest size (the first one on a tie)
 * and is available while any size is.
 */
export const fromVariants = (variants: ProductVariant[]) => {
  const cheapest = variants.reduce((low, v) => (v.price < low.price ? v : low));
  return {
    variants,
    price: cheapest.price,
    ...(cheapest.discountPrice !== undefined && { discountPrice: cheapest.discountPrice }),
    isAvailable: variants.some((v) => v.isAvailable),
  };
};

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
    const { variants, ...rest } = input;
    const data: CreateProductInput = variants?.length ? { ...withoutDiscount(rest), ...fromVariants(variants) } : rest;
    this.assertDiscount(hasDiscount(data), data.discountEndsAt);
    this.assertEndsAtNotPast(data.discountEndsAt);
    return this.repository.create(data);
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const current = await this.getById(id);
    if (input.categoryId !== undefined) await this.assertCategoryExists(input.categoryId);

    // The rules apply to the product as it will be after the change, not to the fields sent alone.
    let changes: UpdateProductInput = input;
    let variants = input.variants ?? current.variants ?? [];
    // The card's availability switch on a product with sizes turns every size on or off.
    if (input.variants === undefined && input.isAvailable !== undefined && variants.length > 0) {
      variants = variants.map((v) => ({ ...v, isAvailable: input.isAvailable as boolean }));
      changes = { ...changes, variants };
    }
    if (variants.length > 0) {
      const derived = fromVariants(variants);
      changes = {
        ...changes,
        price: derived.price,
        discountPrice: derived.discountPrice ?? null,
        isAvailable: derived.isAvailable,
      };
    }

    const price = changes.price ?? current.price;
    const discountPrice =
      changes.discountPrice === undefined ? current.discountPrice : (changes.discountPrice ?? undefined);
    const anyDiscount = hasDiscount({ discountPrice, variants });
    // No discount means no end date: the two are tied, so removing the last discount drops the date too.
    const clearsDiscount = !anyDiscount && changes.discountEndsAt === undefined && current.discountEndsAt !== undefined;
    const discountEndsAt = clearsDiscount
      ? undefined
      : changes.discountEndsAt === undefined
        ? current.discountEndsAt
        : (changes.discountEndsAt ?? undefined);
    if (discountPrice !== undefined && discountPrice >= price) {
      throw new BadRequestError("Discount must be lower than the price");
    }
    this.assertDiscount(anyDiscount, discountEndsAt);
    // Only a new or changed end date has to be today or later; an old sale can keep its past date.
    if (discountEndsAt !== current.discountEndsAt) this.assertEndsAtNotPast(discountEndsAt);

    return this.repository.update(id, clearsDiscount ? { ...changes, discountEndsAt: null } : changes);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }

  private async assertCategoryExists(categoryId: string) {
    if (!(await this.categories.findById(categoryId))) throw new NotFoundError(`Category ${categoryId} not found`);
  }

  private assertDiscount(anyDiscount: boolean, discountEndsAt: DateKey | undefined) {
    if (discountEndsAt !== undefined && !anyDiscount) {
      throw new BadRequestError("A sale end date needs a discount price");
    }
  }

  private assertEndsAtNotPast(discountEndsAt: DateKey | undefined) {
    if (discountEndsAt !== undefined && discountEndsAt < manilaToday(this.clock())) {
      throw new BadRequestError("The sale end date can’t be in the past.");
    }
  }
}
