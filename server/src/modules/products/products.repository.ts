import db from "@app/config/db";
import type { Prisma } from "../../generated/prisma/client";
import type { ListProductsQuery } from "@common/modules/product";
import type { DateKey, Product, CreateProductInput, UpdateProductInput } from "./products.schema";

type ProductRow = Prisma.ProductGetPayload<object>;

/** `discountEndsAt` is a `DATE` column: a calendar day, read and written as UTC midnight. */
const toDbDay = (day: DateKey) => new Date(`${day}T00:00:00.000Z`);
const fromDbDay = (date: Date): DateKey => date.toISOString().slice(0, 10);

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  categoryId: row.categoryId,
  shortDescription: row.shortDescription,
  ...(row.description !== null && { description: row.description }),
  ...(row.imageUrl !== null && { imageUrl: row.imageUrl }),
  price: row.price.toNumber(),
  ...(row.discountPrice !== null && { discountPrice: row.discountPrice.toNumber() }),
  ...(row.discountEndsAt !== null && { discountEndsAt: fromDbDay(row.discountEndsAt) }),
  isAvailable: row.isAvailable,
  isFeatured: row.isFeatured,
  sortOrder: row.sortOrder,
  isArchived: row.isArchived,
});

/** Only the keys that were sent; `null` (or an omitted field on create) clears an optional column. */
const toData = ({ discountEndsAt, ...rest }: CreateProductInput | UpdateProductInput) => ({
  ...rest,
  ...(discountEndsAt !== undefined && { discountEndsAt: discountEndsAt === null ? null : toDbDay(discountEndsAt) }),
});

export interface ProductsRepository {
  /** In menu order: category, then `sortOrder`. Archived products only when `includeArchived`. */
  findAll(query?: ListProductsQuery): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(input: CreateProductInput): Promise<Product>;
  /** Changes only the fields sent. */
  update(id: string, input: UpdateProductInput): Promise<Product>;
  delete(id: string): Promise<void>;
}

export class PrismaProductsRepository implements ProductsRepository {
  async findAll({ limit, categoryId, includeArchived }: ListProductsQuery = {}): Promise<Product[]> {
    const rows = await db.product.findMany({
      where: { ...(categoryId && { categoryId }), ...(!includeArchived && { isArchived: false }) },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
      ...(limit && { take: limit }),
    });
    return rows.map(toProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const row = await db.product.findUnique({ where: { id } });
    return row && toProduct(row);
  }

  async create(input: CreateProductInput): Promise<Product> {
    return toProduct(await db.product.create({ data: toData(input) as Prisma.ProductUncheckedCreateInput }));
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    return toProduct(
      await db.product.update({ where: { id }, data: toData(input) as Prisma.ProductUncheckedUpdateInput }),
    );
  }

  async delete(id: string): Promise<void> {
    await db.product.delete({ where: { id } });
  }
}
