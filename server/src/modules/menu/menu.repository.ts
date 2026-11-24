import db from "@app/config/db";
import type { BusinessSettings } from "./menu.schema";

const SETTINGS_ID = "singleton";

export interface MenuRepository {
  /** The settings row, or null before the owner has saved any. */
  findSettings(): Promise<BusinessSettings | null>;
  /** Replaces the single settings row; an omitted hero image is cleared. */
  saveSettings(input: BusinessSettings): Promise<BusinessSettings>;
}

const toSettings = (row: {
  businessName: string;
  tagline: string;
  contactNumber: string;
  heroImageUrl: string | null;
}): BusinessSettings => ({
  businessName: row.businessName,
  tagline: row.tagline,
  contactNumber: row.contactNumber,
  ...(row.heroImageUrl !== null && { heroImageUrl: row.heroImageUrl }),
});

export class PrismaMenuRepository implements MenuRepository {
  async findSettings(): Promise<BusinessSettings | null> {
    const row = await db.businessSettings.findUnique({ where: { id: SETTINGS_ID } });
    return row && toSettings(row);
  }

  async saveSettings({ heroImageUrl, ...input }: BusinessSettings): Promise<BusinessSettings> {
    const data = { ...input, heroImageUrl: heroImageUrl ?? null };
    return toSettings(
      await db.businessSettings.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, ...data },
        update: data,
      }),
    );
  }
}
