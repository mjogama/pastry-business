import type { MenuRepository } from "./menu.repository";
import type { ProductsRepository } from "../products/products.repository";
import type { CategoriesRepository } from "../categories/categories.repository";
import type { BusinessSettings, MenuData, UpdateBusinessSettingsInput } from "./menu.schema";

/** Shown until the owner saves settings. The contact number is left empty so no placeholder number is ever dialed. */
export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: "Pato's Pâtisserie",
  tagline: "",
  contactNumber: "",
};

export class MenuService {
  constructor(
    private readonly repository: MenuRepository,
    private readonly categories: CategoriesRepository,
    private readonly products: ProductsRepository,
  ) {}

  async getSettings(): Promise<BusinessSettings> {
    return (await this.repository.findSettings()) ?? DEFAULT_SETTINGS;
  }

  /** Everything the customer menu renders. Archived products are left out. */
  async getMenu(): Promise<MenuData> {
    const [settings, categories, products] = await Promise.all([
      this.getSettings(),
      this.categories.findAll(),
      this.products.findAll({ includeArchived: false }),
    ]);
    return { settings, categories, products };
  }

  updateSettings(input: UpdateBusinessSettingsInput): Promise<BusinessSettings> {
    return this.repository.saveSettings(input);
  }
}
