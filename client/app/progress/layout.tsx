import { RequireAuth } from "@/features/auth/components/require-auth";

/** Owner page in the app theme (Butter Yellow, or Dark Roast when toggled; app/globals.css). */
export default function ProgressLayout({ children }: LayoutProps<"/progress">) {
  return (
    <div className="theme-dark-roast flex min-h-dvh flex-1 flex-col bg-background font-sans leading-prototype text-foreground">
      <RequireAuth>{children}</RequireAuth>
    </div>
  );
}
