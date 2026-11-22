import type { Metadata } from "next";
import { Suspense } from "react";

import { RecipeBookLoader } from "@/features/recipes/components/recipe-book-loader";

export const metadata: Metadata = { title: "Recipe Book · Pato's Pâtisserie" };

export default function RecipesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-label text-foreground-faint">
          Loading recipes…
        </main>
      }
    >
      <RecipeBookLoader />
    </Suspense>
  );
}
