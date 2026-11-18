/** Applies the Dark Roast shadcn theme (app/globals.css) while the tracker is mounted. */
export default function SalesTrackerLayout({ children }: LayoutProps<"/sales-tracker">) {
  return (
    <div className="theme-dark-roast flex min-h-dvh flex-1 flex-col bg-background font-sans leading-prototype text-foreground">
      {children}
    </div>
  );
}
