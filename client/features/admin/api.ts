import type { Category, CreateCategoryInput } from "@common/modules/category";
import type { UploadedImage } from "@common/modules/media";
import type { BusinessSettings } from "@common/modules/menu";
import type { CreateProductInput, Product, UpdateProductInput } from "@common/modules/product";

import { normalizeMenu } from "@/features/menu/lib/normalize";
import { authClient } from "@/lib/api/auth-client";
import { api } from "@/lib/api/client";

/** Everything the CMS lists, straight from the API (never the public cache): archived products included. */
export const getAdminMenu = async () =>
  normalizeMenu({
    settings: await api.get<BusinessSettings>("/menu/settings", { cache: "no-store" }),
    categories: await api.get<Category[]>("/categories", { cache: "no-store" }),
    products: await api.get<Product[]>("/products", {
      query: { includeArchived: true, limit: 500 },
      cache: "no-store",
    }),
  });

/** POST /products */
export const createProduct = (input: CreateProductInput) => api.post<Product>("/products", input);

/** PATCH /products/:id. Only the fields sent change; `null` clears an optional field. */
export const updateProduct = (id: string, input: UpdateProductInput) => api.patch<Product>(`/products/${id}`, input);

/** DELETE /products/:id */
export const deleteProduct = (id: string) => api.delete<null>(`/products/${id}`);

/** POST /categories. The product form creates one inline when none fits. */
export const createCategory = (input: CreateCategoryInput) => api.post<Category>("/categories", input);

/** POST /media/images: stores the image on Cloudinary and returns its URL. */
export const uploadImage = (file: File) => {
  const form = new FormData();
  form.append("image", file);
  return authClient.upload<UploadedImage>("/media/images", form);
};
