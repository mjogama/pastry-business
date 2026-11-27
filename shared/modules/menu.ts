import type { Category } from "./category";
import type { Product } from "./product";

/** Single row. */
export interface BusinessSettings {
  /** Required. */
  businessName: string;
  tagline: string;
  /** E.164, e.g. `+639170000000` (`^\+\d{8,15}$`). Shown in the local format. */
  contactNumber: string;
  heroImageUrl?: string;
  /** Whether /menu takes pre-orders. Changed only through `PUT /menu/settings/pre-orders`. */
  preOrdersOpen: boolean;
  /** Weekdays pre-orders are handed over, 1 (Monday) to 5 (Friday); at least one, ascending. */
  preOrderDays: number[];
  /** Orders for a hand-over day close this many days before it (1–6), at `preOrderCutoffTime`. */
  preOrderCutoffDays: number;
  /** Closing time on that day, Manila, `HH:mm` (24-hour), e.g. `18:00`. */
  preOrderCutoffTime: string;
  /** When and where at school, e.g. `12:00–1:00 PM, canteen`. Up to 80 characters, may be empty. */
  preOrderHandoffTime: string;
}

/** The fields `PUT /menu/settings/pre-orders` changes. */
export type PreOrderSettingsKey = 
  | "preOrdersOpen"
  | "preOrderDays"
  | "preOrderCutoffDays"
  | "preOrderCutoffTime"
  | "preOrderHandoffTime";

/** `GET /menu`: everything the customer menu renders. Archived products are left out. */
export interface MenuData {
  settings: BusinessSettings;
  categories: Category[];
  products: Product[];
}

/** `PUT /menu/settings`. The pre-order settings have their own route. */
export type UpdateBusinessSettingsInput = Omit<BusinessSettings, PreOrderSettingsKey>;
