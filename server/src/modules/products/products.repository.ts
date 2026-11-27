import db from "@app/config/db";
import type { Prisma } from "../../generated/prisma/client";
import type { ListProductsQuery } from "@common/modules/product";
import type { DateKey, Product, ProductVariant, CreateProductInput, UpdateProductInput } from "./products.schema";

const WITH_VARIANTS = { variants: { orderBy: { position: "asc" } } } as const satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof WITH_VARIANTS }>;

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
  ...(row.variants.length > 0 && {
    variants: row.variants.map(
      (v): ProductVariant => ({
        name: v.name,
        price: v.price.toNumber(),
        ...(v.discountPrice !== null && { discountPrice: v.discountPrice.toNumber() }),
        isAvailable: v.isAvailable,
      }),
    ),
  }),
});

const toVariantRows = (variants: ProductVariant[]) =>
  variants.map((v, position) => ({
    position,
    name: v.name,
    price: v.price,
    discountPrice: v.discountPrice ?? null,
    isAvailable: v.isAvailable,
  }));

/** Only the keys that were sent; `null` (or an omitted field on create) clears an optional column. Sizes sent replace the old ones. */
const toData = ({ discountEndsAt, variants, ...rest }: CreateProductInput | UpdateProductInput, replace: boolean) => ({
  ...rest,
  ...(discountEndsAt !== undefined && { discountEndsAt: discountEndsAt === null ? null : toDbDay(discountEndsAt) }),
  ...(variants !== undefined && {
    variants: { ...(replace && { deleteMany: {} }), create: toVariantRows(variants) },
  }),
});

export interface ProductsRepository {
  /** In menu order: category, then `sortOrder`. Archived products only when `includeArchived`. */
  findAll(query?: ListProductsQuery): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(input: CreateProductInput): Promise<Product>;
  /** Changes only the fields sent; `variants` replaces every size. */
  update(id: string, input: UpdateProductInput): Promise<Product>;
  delete(id: string): Promise<void>;
}

export class PrismaProductsRepository implements ProductsRepository {
  async findAll({ limit, categoryId, includeArchived }: ListProductsQuery = {}): Promise<Product[]> {
    const rows = await db.product.findMany({
      where: { ...(categoryId && { categoryId }), ...(!includeArchived && { isArchived: false }) },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
      ...(limit && { take: limit }),
      include: WITH_VARIANTS,
    });
    return rows.map(toProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const row = await db.product.findUnique({ where: { id }, include: WITH_VARIANTS });
    return row && toProduct(row);
  }

  async create(input: CreateProductInput): Promise<Product> {
    return toProduct(
      await db.product.create({
        data: toData(input, false) as Prisma.ProductUncheckedCreateInput,
        include: WITH_VARIANTS,
      }),
    );
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    return toProduct(
      await db.product.update({
        where: { id },
        data: toData(input, true) as Prisma.ProductUncheckedUpdateInput,
        include: WITH_VARIANTS,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await db.product.delete({ where: { id } });
  }
}
