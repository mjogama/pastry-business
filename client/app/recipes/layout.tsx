import { RequireAuth } from "@/features/auth/components/require-auth";

/** Applies the app theme (Butter Yellow, or Dark Roast when toggled; app/globals.css) while the Recipe Book is mounted. */
export default function RecipesLayout({ children }: LayoutProps<"/recipes">) {
  return (
    <div className="theme-dark-roast flex h-dvh flex-col overflow-hidden bg-background font-sans leading-prototype text-foreground">
      <RequireAuth>{children}</RequireAuth>
    </div>
  );
}
