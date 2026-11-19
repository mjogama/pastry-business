/** Applies the Dark Roast shadcn theme (app/globals.css) while the Recipe Book is mounted. */
export default function RecipiesLayout({ children }: LayoutProps<"/recipies">) {
  return (
    <div className="theme-dark-roast flex h-dvh flex-col overflow-hidden bg-background font-sans leading-prototype text-foreground">
      {children}
    </div>
  );
}
