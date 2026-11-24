import { z } from "zod";

import type { Category, CreateCategoryInput, ListCategoriesQuery, UpdateCategoryInput } from "@common/modules/category";

export type { Category, CreateCategoryInput, UpdateCategoryInput } from "@common/modules/category";

const nameSchema = z.string().trim().min(1).max(60);
const sortOrderSchema = z.number().int().min(0).max(1_000_000);

export const categorySchema = z.object({
  id: z.uuid(),
  name: nameSchema,
  sortOrder: sortOrderSchema,
}) satisfies z.ZodType<Category>;

const idParams = z.object({ id: z.uuid() });

export const listCategoriesSchemas = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).exactOptional(),
  }) satisfies z.ZodType<ListCategoriesQuery>,
};

export const getCategorySchemas = { params: idParams };

export const createCategorySchemas = {
  body: z.object({
    name: nameSchema,
    sortOrder: sortOrderSchema.exactOptional(),
  }) satisfies z.ZodType<CreateCategoryInput>,
};

export const updateCategorySchemas = {
  params: idParams,
  body: z
    .object({ name: nameSchema.exactOptional(), sortOrder: sortOrderSchema.exactOptional() })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Send at least one field to change",
    ) satisfies z.ZodType<UpdateCategoryInput>,
};

export const deleteCategorySchemas = { params: idParams };
