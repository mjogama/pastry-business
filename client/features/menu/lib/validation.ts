import { z } from "zod";

import type { BusinessSettings, Product } from "../types";

/**
 * Save-time rules for the Products manager (§3, §4, §9). The manager isn't built yet; these keep
 * the data model honest so it can reuse them.
 */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const money = z.number().positive().multipleOf(0.01);

export const productSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1, "Name is required").max(60, "Name is 60 characters at most"),
    categoryId: z.string().min(1, "Category is required"),
    shortDescription: z
      .string()
      .trim()
      .min(1, "Short description is required")
      .max(120, "Short description is 120 characters at most"),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    price: money,
    discountPrice: money.optional(),
    discountEndsAt: z.string().regex(DATE_KEY).optional(),
    isAvailable: z.boolean(),
    isFeatured: z.boolean(),
    sortOrder: z.number().int(),
    isArchived: z.boolean(),
  })
  .refine((product) => product.discountPrice == null || product.discountPrice < product.price, {
    message: "Discount must be lower than the price",
    path: ["discountPrice"],
  }) satisfies z.ZodType<Product>;

/** The form's extra rule (§9): a new or changed end date is today or later (Manila). */
export const discountEndsAtIsValid = (endsAt: string | undefined, today: string) => endsAt == null || endsAt >= today;

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(1),
  tagline: z.string().trim(),
  contactNumber: z.string().regex(/^\+\d{8,15}$/, "Use the international format, e.g. +639170000000"),
  heroImageUrl: z.string().optional(),
}) satisfies z.ZodType<BusinessSettings>;
