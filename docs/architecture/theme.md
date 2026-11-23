# Theme (all pages)

One shared theme with **Butter Yellow** (light, default; `docs/COLOR_THEME_V1.md`) and **Dark Roast** (dark). A page opts in with the `theme-dark-roast` class on its layout wrapper (the name is historical; it covers both).

| To change | Edit |
| --- | --- |
| Light colors | `:root:not([data-theme="dark"]):has(.theme-dark-roast)` in `client/app/globals.css` |
| Dark colors | `:root:has(.theme-dark-roast)` in `client/app/globals.css` |
| Shadows | `--elev-*` in both blocks (light has no card shadows) |
| Sizes, radii, spacing tokens | `@theme inline` in `globals.css`; add new names to `cn` in `client/lib/utils.ts` |
| Fonts | `client/app/layout.tsx` |
| Toggle, saved key, browser bar color | `client/components/theme-toggle.tsx`, `client/lib/theme.ts` (a pre-paint script sets `<html data-theme>`) |

**Rules**
- **Yellow (`bg-primary`) is a fill only.** Text on it is `text-primary-foreground`.
- **Yellow-family text is `text-honey`**, never `text-primary` (fails contrast on cream; in dark mode honey is the yellow).
- **A new color token** needs a value in both blocks, a `--color-*` entry in `@theme inline`, and its name in `cn`.
- **Shadows use the tokens.** Tailwind inlines theme values, so don't hardcode `rgb(0 0 0 …)` shadows.
- Check WCAG AA contrast (4.5:1 for text) in both modes.
