import { connection } from "next/server";

import { getRecipes } from "../api";
import { RecipeBook } from "./recipe-book";

/** Server component: loads recipes per request, then hands them to the carousel. Render it inside <Suspense>. */
export async function RecipeBookLoader() {
  await connection();
  // `null` tells the book the request failed, so it can say so instead of showing an empty book.
  const recipes = await getRecipes().catch(() => null);
  return <RecipeBook initialRecipes={recipes} />;
}
