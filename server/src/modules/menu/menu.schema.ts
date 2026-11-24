import { z } from "zod";

import { cloudinaryUrl } from "@shared/validation/primitives";
import type { BusinessSettings, UpdateBusinessSettingsInput } from "@common/modules/menu";

export type { BusinessSettings, MenuData, UpdateBusinessSettingsInput } from "@common/modules/menu";

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(200),
  contactNumber: z.string().regex(/^\+\d{8,15}$/, "Use the international format, e.g. +639170000000"),
  heroImageUrl: cloudinaryUrl.exactOptional(),
}) satisfies z.ZodType<BusinessSettings>;

export const updateSettingsSchemas = {
  body: businessSettingsSchema satisfies z.ZodType<UpdateBusinessSettingsInput>,
};
