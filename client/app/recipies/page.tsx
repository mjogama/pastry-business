import type { Metadata } from "next";

import { RecipeBook } from "@/features/recipes/components/recipe-book";

export const metadata: Metadata = { title: "Recipe Book · Pato's Pâtisserie" };

export default function RecipiesPage() {
  return <RecipeBook />;
}
