import { RequireAuth } from "@/features/auth/components/require-auth";

export default function ProgressLayout({ children }: LayoutProps<"/progress">) {
  return (
    <RequireAuth>
      <div className="theme-dark-roast flex min-h-dvh flex-1 flex-col bg-background font-sans leading-prototype text-foreground">{children}</div>
    </RequireAuth>
  );
}
