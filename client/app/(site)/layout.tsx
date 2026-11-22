import type { Viewport } from "next";

/** Public menu (docs/MENU_UI_V1.md): the app theme, like the Sales Tracker. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#FFF8EC",
};

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="theme-dark-roast flex min-h-dvh flex-1 flex-col bg-background font-sans leading-prototype text-foreground">
      {children}
    </div>
  );
}
