/** The app has two themes (app/globals.css): Butter Yellow (light, the default) and Dark Roast. */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** Browser bar color per theme: each theme's page background. */
export const THEME_COLORS: Record<Theme, string> = { light: "#FFF8EC", dark: "#1B1610" };

/**
 * Runs in <head> before the first paint (app/layout.tsx), so a saved dark theme never flashes
 * light. Keep it in sync with `applyTheme`.
 */
export const THEME_SCRIPT = `(function(){try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark"){document.documentElement.setAttribute("data-theme","dark");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","${THEME_COLORS.dark}")}}catch(e){}})()`;

export const readTheme = (): Theme =>
  document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";

/** Switches the theme, remembers it on this device and recolors the browser bar. */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the switch still applies until the page reloads.
  }
}
