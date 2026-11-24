import { z } from "zod";

import { cloudinaryUrl, dayKey, money } from "@shared/validation/primitives";
import type { Product, CreateProductInput, UpdateProductInput, ListProductsQuery } from "@common/modules/product";

export type { DateKey, Product, CreateProductInput, UpdateProductInput } from "@common/modules/product";

const fields = {
  name: z.string().trim().min(1).max(60),
  categoryId: z.uuid(),
  shortDescription: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000),
  imageUrl: cloudinaryUrl,
  price: money,
  discountPrice: money,
  discountEndsAt: dayKey,
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0).max(1_000_000),
  isArchived: z.boolean(),
};

const discountBelowPrice = {
  check: (p: { price?: number | undefined; discountPrice?: number | null | undefined }) =>
    p.price === undefined || p.discountPrice == null || p.discountPrice < p.price,
  message: "Discount must be lower than the price",
  path: ["discountPrice"],
};

const createProductBody = z
  .object({
    name: fields.name,
    categoryId: fields.categoryId,
    shortDescription: fields.shortDescription,
    description: fields.description.exactOptional(),
    imageUrl: fields.imageUrl.exactOptional(),
    price: fields.price,
    discountPrice: fields.discountPrice.exactOptional(),
    discountEndsAt: fields.discountEndsAt.exactOptional(),
    isAvailable: fields.isAvailable,
    isFeatured: fields.isFeatured,
    sortOrder: fields.sortOrder,
    isArchived: fields.isArchived,
  })
  .refine(discountBelowPrice.check, discountBelowPrice) satisfies z.ZodType<CreateProductInput>;

const updateProductBody = z
  .object({
    name: fields.name.exactOptional(),
    categoryId: fields.categoryId.exactOptional(),
    shortDescription: fields.shortDescription.exactOptional(),
    description: fields.description.nullable().exactOptional(),
    imageUrl: fields.imageUrl.nullable().exactOptional(),
    price: fields.price.exactOptional(),
    discountPrice: fields.discountPrice.nullable().exactOptional(),
    discountEndsAt: fields.discountEndsAt.nullable().exactOptional(),
    isAvailable: fields.isAvailable.exactOptional(),
    isFeatured: fields.isFeatured.exactOptional(),
    sortOrder: fields.sortOrder.exactOptional(),
    isArchived: fields.isArchived.exactOptional(),
  })
  .refine((body) => Object.keys(body).length > 0, "Send at least one field to change")
  .refine(discountBelowPrice.check, discountBelowPrice) satisfies z.ZodType<UpdateProductInput>;

export const productSchema = z.object({
  id: z.uuid(),
  ...fields,
}) satisfies z.ZodType<Omit<Product, "description" | "imageUrl" | "discountPrice" | "discountEndsAt">>;

const idParams = z.object({ id: z.uuid() });

export const listProductsSchemas = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(500).exactOptional(),
    categoryId: z.uuid().exactOptional(),
    includeArchived: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .exactOptional(),
  }) satisfies z.ZodType<ListProductsQuery, unknown>,
};

export const getProductSchemas = { params: idParams };

export const createProductSchemas = { body: createProductBody };

export const updateProductSchemas = { params: idParams, body: updateProductBody };

export const deleteProductSchemas = { params: idParams };
