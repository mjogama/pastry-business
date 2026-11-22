"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { applyTheme, readTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};

/** 44×44 round button that switches between the light and dark themes. */
export function ThemeToggle({ className }: { className?: string }) {
  // The server can't know the saved theme, so it renders the light state; the icons are
  // swapped by CSS from <html data-theme>, so even that first render shows the right one.
  const dark = useSyncExternalStore(
    subscribe,
    () => readTheme() === "dark",
    () => false,
  );
  return (
    <Button
      variant="secondary"
      size="icon-touch"
      aria-label="Dark mode"
      aria-pressed={dark}
      onClick={() => applyTheme(dark ? "light" : "dark")}
      className={cn("shrink-0 bg-muted text-foreground", className)}
    >
      <MoonIcon aria-hidden="true" className="[[data-theme=dark]_&]:hidden" />
      <SunIcon aria-hidden="true" className="hidden [[data-theme=dark]_&]:block" />
    </Button>
  );
}
