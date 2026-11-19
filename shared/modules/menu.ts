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
}

/** `GET /menu`: everything the customer menu renders. Archived products are left out. */
export interface MenuData {
  settings: BusinessSettings;
  categories: Category[];
  products: Product[];
}

/** `PUT /menu/settings`. */
export type UpdateBusinessSettingsInput = BusinessSettings;
