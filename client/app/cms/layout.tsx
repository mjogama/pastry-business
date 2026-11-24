import type { Metadata, Viewport } from "next";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { RequireAuth } from "@/features/auth/components/require-auth";

export const viewport: Viewport = { viewportFit: "cover", themeColor: "#FFF8EC" };

export const metadata: Metadata = { title: "CMS · Pato's Pâtisserie", robots: { index: false } };

/** The CMS: the public pages' theme with a collapsible sidebar, behind the owner login. Each page below draws its own design with controls. */
export default function AdminLayout({ children }: LayoutProps<"/cms">) {
  return (
    <div className="theme-dark-roast flex min-h-dvh flex-1 flex-col bg-background font-sans leading-prototype text-foreground">
      <RequireAuth>
        <AdminShell>{children}</AdminShell>
      </RequireAuth>
    </div>
  );
}
