import type { Category, MenuData, Product } from "../types";

/**
 * Development seed: the reference prototype's sample products (docs/MENU_UI_V1.md §2: sample data
 * only). The owner replaces all of it through the Products manager and Settings.
 */

const categories: Category[] = [
  { id: "breads", name: "Breads", sortOrder: 1 },
  { id: "pastries", name: "Pastries", sortOrder: 2 },
  { id: "drinks", name: "Drinks", sortOrder: 3 },
];

const FULL = " [Full description: ingredients, size, allergens.]";

type SeedRow = [
  id: string,
  categoryId: string,
  name: string,
  price: number,
  discountPrice: number | null,
  discountEndsAt: string | null,
  isAvailable: boolean,
  shortDescription: string,
];

const rows: SeedRow[] = [
  [
    "pandesal",
    "breads",
    "Pandesal (10 pcs)",
    50,
    null,
    null,
    true,
    "Soft, lightly sweet rolls — the classic breakfast staple.",
  ],
  ["spanish-bread", "breads", "Spanish Bread", 40, null, null, true, "Rolled bread with a buttery, sugary filling."],
  ["cheese-roll", "breads", "Cheese Roll", 45, null, null, true, "Fluffy roll with a buttery, cheesy swirl."],
  [
    "ensaymada",
    "breads",
    "Ensaymada",
    65,
    null,
    null,
    true,
    "Soft brioche-style coil topped with butter, sugar and cheese.",
  ],
  [
    "ube-croissant",
    "pastries",
    "Ube Croissant",
    85,
    69,
    "2026-11-30",
    true,
    "Flaky, buttery croissant filled with ube halaya.",
  ],
  [
    "choco-muffin",
    "pastries",
    "Choco Muffin",
    55,
    null,
    null,
    true,
    "Moist chocolate muffin loaded with chocolate chips.",
  ],
  ["egg-pie", "pastries", "Egg Pie (slice)", 60, null, null, false, "Classic custard pie with a golden, browned top."],
  ["iced-latte", "drinks", "Iced Latte", 120, 99, "2026-11-30", true, "Espresso and cold milk poured over ice."],
  ["hot-chocolate", "drinks", "Hot Chocolate", 95, null, null, true, "Rich, tablea-style hot chocolate."],
  ["calamansi-juice", "drinks", "Calamansi Juice", 70, null, null, false, "Freshly squeezed and lightly sweetened."],
];

/** The prototype's picks: the two sale items plus Ensaymada and Cheese Roll. */
const FEATURED = new Set(["ube-croissant", "iced-latte", "ensaymada", "cheese-roll"]);

const products: Product[] = rows.map(
  ([id, categoryId, name, price, discountPrice, discountEndsAt, isAvailable, shortDescription], index) => ({
    id,
    categoryId,
    name,
    price,
    discountPrice: discountPrice ?? undefined,
    discountEndsAt: discountEndsAt ?? undefined,
    isAvailable,
    shortDescription,
    description: shortDescription + FULL,
    isFeatured: FEATURED.has(id),
    sortOrder: index,
    isArchived: false,
  }),
);

export const seed: MenuData = {
  settings: {
    businessName: "Pato's Pâtisserie",
    tagline: "[Your tagline — one line about what you bake and pour.]",
    contactNumber: "+639170000000",
  },
  categories,
  products,
};
