import db from "@app/config/db";
import type { BusinessSettings, PreOrderSettingsKey, UpdateBusinessSettingsInput } from "./menu.schema";

const SETTINGS_ID = "singleton";

export interface MenuRepository {
  /** The settings row, or null before the owner has saved any. */
  findSettings(): Promise<BusinessSettings | null>;
  /** Replaces the single settings row; an omitted hero image is cleared. The pre-order settings are kept. */
  saveSettings(input: UpdateBusinessSettingsInput): Promise<BusinessSettings>;
  /** Changes the given pre-order settings, creating the row with `defaults` when there is none yet. */
  savePreOrderSettings(patch: PreOrderSettingsPatch, defaults: UpdateBusinessSettingsInput): Promise<BusinessSettings>;
}

export type PreOrderSettingsPatch = Partial<Pick<BusinessSettings, PreOrderSettingsKey>>;

const toSettings = (row: {
  businessName: string;
  tagline: string;
  contactNumber: string;
  heroImageUrl: string | null;
  preOrdersOpen: boolean;
  preOrderDays: number[];
  preOrderCutoffDays: number;
  preOrderCutoffTime: string;
  preOrderHandoffTime: string;
}): BusinessSettings => ({
  businessName: row.businessName,
  tagline: row.tagline,
  contactNumber: row.contactNumber,
  ...(row.heroImageUrl !== null && { heroImageUrl: row.heroImageUrl }),
  preOrdersOpen: row.preOrdersOpen,
  preOrderDays: row.preOrderDays,
  preOrderCutoffDays: row.preOrderCutoffDays,
  preOrderCutoffTime: row.preOrderCutoffTime,
  preOrderHandoffTime: row.preOrderHandoffTime,
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

  async savePreOrderSettings(
    patch: PreOrderSettingsPatch,
    { heroImageUrl, ...defaults }: UpdateBusinessSettingsInput,
  ): Promise<BusinessSettings> {
    return toSettings(
      await db.businessSettings.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, ...defaults, heroImageUrl: heroImageUrl ?? null, ...patch },
        update: patch,
      }),
    );
  }
}
