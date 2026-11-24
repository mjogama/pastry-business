/** Applies the app theme (Butter Yellow, or Dark Roast when toggled; app/globals.css) on the login page. */
export default function LoginLayout({ children }: LayoutProps<"/sc/auth/login">) {
  return (
    <div className="theme-dark-roast flex min-h-dvh flex-1 flex-col items-center justify-center bg-background p-4 font-sans leading-prototype text-foreground">
      {children}
    </div>
  );
}
