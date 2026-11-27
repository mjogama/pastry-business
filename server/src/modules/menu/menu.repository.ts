import db from "@app/config/db";
import type { BusinessSettings, UpdateBusinessSettingsInput } from "./menu.schema";

const SETTINGS_ID = "singleton";

export interface MenuRepository {
  /** The settings row, or null before the owner has saved any. */
  findSettings(): Promise<BusinessSettings | null>;
  /** Replaces the single settings row; an omitted hero image is cleared. The pre-order switch is kept. */
  saveSettings(input: UpdateBusinessSettingsInput): Promise<BusinessSettings>;
  /** Turns pre-orders on or off, creating the row with `defaults` when there is none yet. */
  savePreOrdersOpen(open: boolean, defaults: UpdateBusinessSettingsInput): Promise<BusinessSettings>;
}

const toSettings = (row: {
  businessName: string;
  tagline: string;
  contactNumber: string;
  heroImageUrl: string | null;
  preOrdersOpen: boolean;
}): BusinessSettings => ({
  businessName: row.businessName,
  tagline: row.tagline,
  contactNumber: row.contactNumber,
  ...(row.heroImageUrl !== null && { heroImageUrl: row.heroImageUrl }),
  preOrdersOpen: row.preOrdersOpen,
});

export class PrismaMenuRepository implements MenuRepository {
  async findSettings(): Promise<BusinessSettings | null> {
    const row = await db.businessSettings.findUnique({ where: { id: SETTINGS_ID } });
    return row && toSettings(row);
  }

  async saveSettings({ heroImageUrl, ...input }: UpdateBusinessSettingsInput): Promise<BusinessSettings> {
    const data = { ...input, heroImageUrl: heroImageUrl ?? null };
    return toSettings(
      await db.businessSettings.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, ...data },
        update: data,
      }),
    );
  }

  async savePreOrdersOpen(
    preOrdersOpen: boolean,
    { heroImageUrl, ...defaults }: UpdateBusinessSettingsInput,
  ): Promise<BusinessSettings> {
    return toSettings(
      await db.businessSettings.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, ...defaults, heroImageUrl: heroImageUrl ?? null, preOrdersOpen },
        update: { preOrdersOpen },
      }),
    );
  }
}
