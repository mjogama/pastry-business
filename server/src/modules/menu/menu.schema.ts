import { z } from "zod";

import { cloudinaryUrl } from "@shared/validation/primitives";
import type { UpdateBusinessSettingsInput } from "@common/modules/menu";
import type { UpdatePreOrderSettingsInput } from "@common/modules/pre-order";

export type {
  MenuData,
  BusinessSettings,
  PreOrderSettingsKey,
  UpdateBusinessSettingsInput,
} from "@common/modules/menu";

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(200),
  contactNumber: z.string().regex(/^\+\d{8,15}$/, "Use the international format, e.g. +639170000000"),
  heroImageUrl: cloudinaryUrl.exactOptional(),
}) satisfies z.ZodType<UpdateBusinessSettingsInput>;

export const updateSettingsSchemas = {
  body: businessSettingsSchema satisfies z.ZodType<UpdateBusinessSettingsInput>,
};

export const updatePreOrderSettingsSchemas = {
  body: z
    .object({
      open: z.boolean().exactOptional(),
      days: z
        .array(z.number().int().min(1, "Pick Monday to Friday").max(5, "Pick Monday to Friday"))
        .min(1, "Pick at least one day")
        .max(5)
        .transform((days) => [...new Set(days)].sort((a, b) => a - b))
        .exactOptional(),
      cutoffDays: z.number().int().min(1).max(6).exactOptional(),
      cutoffTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 18:00")
        .exactOptional(),
      handoffTime: z.string().trim().max(80).exactOptional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "Nothing to change",
    }) satisfies z.ZodType<UpdatePreOrderSettingsInput>,
};
