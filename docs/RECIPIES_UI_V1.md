# Recipe Book — Swipeable Book Cards & Recipe Modal · Context

> **For the implementing agent:** this is the source of truth for the Recipe Book (the card carousel and the recipe modal). Read the whole file before writing code.
>
> **Consistency first:** this module shares the **Dark Roast** tokens and primitives from `SALES_TRACKER_CONTEXT.md` (§5–§6). Reuse them; add only the new tokens in §5 below to the same token file. Never hardcode a color, font size, radius or spacing value that already exists as a token.
>
> Reference prototype (interactive): https://claude.ai/artifact/6K7AZuSKQZNW79UTTfuN5H
> Frames in the prototype: **Recipe Book — carousel** (interactive), **Recipe modal — desktop**, **Recipe modal — phone**.

---

## 1. Product summary

A private recipe book for the bakery. Recipes appear as **tall, book-shaped cards stacked close together in a carousel** (inspired by a folder carousel: one big card in the center, smaller tilted cards on both sides).

- **Swipe left or right** to flip to the next or previous recipe.
- The **front of each card** shows its ingredients, with temperature, time and quantity in the footer.
- **Double-tap the centered card** to open the recipe in a modal laid out like an open book (ingredients on the left page, steps on the right page).
- The last card is **+ New recipe**, where you type a name and create it.

---

## 2. Scope

### In scope

- Carousel with swipe, drag, tap-to-center and page dots
- Card front (category, name, ingredients, footer)
- Double-tap to open the recipe modal (desktop two-page spread, phone single column)
- "+ New recipe" card with name field and Create button

### Not designed yet (do NOT invent; ask me first)

- Editing a recipe's ingredients, steps, category, temperature, time, quantity or note (the prototype can only create a recipe by name)
- Deleting or reordering recipes, search, category filters
- Photos on cards

### Assumption to confirm

This is a **private owner tool** (same login as the Sales Tracker), not part of the public menu. If customers should see it, tell me and the access rules change.

---

## 3. Domain model (conceptual)

```
Recipe
  id
  name          string, 1–60 chars              required
  category      string                          required   (new recipes start as "Uncategorized")
  quantity      string, e.g. "Makes 24 rolls"   optional
  totalMinutes  integer                         optional   (formatted by the rules in §6.3)
  temperature   string, e.g. "180 °C", "Cold"   optional
  ingredients   Ingredient[]                    optional   (≥ 5 recommended for a full card front)
  steps         string[]                        optional   (shown numbered 1, 2, 3…)
  note          long text                       optional   ("Baker's note")
  sortOrder, createdAt, updatedAt

Ingredient
  qty           string, e.g. "500 g", "½ cup"   required
  item          string, e.g. "bread flour"      required
```

The prototype stores time and quantity as free text (`"2 hr 30 min"`, `"Makes 24 rolls"`). Storing `totalMinutes` as a number is recommended; the display rules in §6.3 still apply to whichever you store.

Unset values display as an em dash `—`, never as blank or "undefined".

---

## 4. Behavior

### 4.1 Carousel geometry (exact; implement these formulas)

Let `i` be a card's index and `active` the selected index. While dragging, add the drag fraction: `d = (i − active) + dragX / spacing`, and `ad = |d|`.

| Value                                 | Formula                                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Card width `cw`                       | `clamp(190px, 58vw, 280px)`                                                                                            |
| Card height `ch`                      | `cw × 1.62` (tall, like a book)                                                                                        |
| `spacing`                             | `cw × 0.74` (cards overlap, so they sit close together)                                                                |
| Horizontal offset `x`                 | `ad ≤ 1 ? d × spacing : sign(d) × (spacing + (ad − 1) × spacing × 0.78)`                                               |
| Scale                                 | `1 − min(ad, 2.2) × 0.17`                                                                                              |
| Rotation                              | `clamp(d × 3.5, −7, 7)` degrees (cards lean outward)                                                                   |
| Opacity                               | `max(0, 1 − min(ad, 3) × 0.3)`                                                                                         |
| Brightness (darker when not selected) | `filter: brightness(1 − min(ad, 1) × 0.32)` → the centered card is 100%, side cards about 68%                          |
| Stacking                              | `z-index = 100 − round(ad × 10)`; the centered card is on top                                                          |
| Hidden                                | `ad > 2.6`: opacity 0, `pointer-events: none`, `tabindex=-1`                                                           |
| Transition                            | `transform .42s cubic-bezier(.2,.8,.2,1), opacity .42s ease, filter .42s ease`; **none while dragging**                |
| Stage height                          | `ch + 70px`, cards centered with `left: 50%; top: 50%; transform: translate(-50%,-50%) translateX(x) scale() rotate()` |

Use CSS variables (`--cw`, `--ch`, `--spacing`) so the first server render is already correct at any viewport; don't depend on `window.innerWidth` at render time.

### 4.2 Gestures

| Gesture                                                                               | Result                                                                           |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --- | -------------------------------------- | --- | ---------------------------------------------------------------------------------- |
| **Swipe / drag horizontally** (pointer events: touch, mouse, pen)                     | Cards follow the pointer. On release: if `                                       | dx  | > spacing × 0.22`, move `max(1, round( | dx  | / spacing))` cards (left drag → next, right drag → previous). Otherwise snap back. |
| Drag past the first or last card                                                      | Rubber-band: `dx × 0.35`                                                         |
| Movement over 6px                                                                     | Counts as a drag; the tap that follows the release must **not** trigger anything |
| **Tap a side card**                                                                   | That card slides to the center                                                   |
| **Double-tap the centered recipe card** (two taps on the same card within **350 ms**) | Opens the recipe modal (§7)                                                      |
| Tap the centered **+ New recipe** card                                                | Nothing (the name field below it is the action)                                  |
| Tap a page dot                                                                        | Go to that card                                                                  |

The stage uses `touch-action: pan-y` (vertical page scroll still works), `user-select: none` and `cursor: grab` (`grabbing` while pressed).

### 4.3 Creating a recipe

When the **+ New recipe** card is centered, the area under the carousel shows the form (§6.5). **Create recipe** (only enabled when the name isn't empty) adds a recipe with category "Uncategorized", no ingredients or steps, and unset quantity/time/temperature, then moves the carousel to the new card.

### 4.4 Modal navigation

**‹ Previous page / Next page ›** inside the modal switch to the previous or next recipe **and** move the carousel to that recipe, so closing the modal leaves the carousel on the recipe you were reading. The buttons are disabled (35% opacity) on the first and last recipe.

---

## 5. Design tokens

**Reuse everything** from `SALES_TRACKER_CONTEXT.md` §5 (colors, Fraunces and Inter, radii, focus ring, 44px touch targets). Dark Roast values used here: page `#1C1511`, card `#2A201A`, text `#F3E9DC`, muted `#B9A796`, faint `#8E7C6E`, accent `#E8B04A`, line `#3A2C23`, strong line `#4A392D`, dashed line `#5A4536`.

**Add these new tokens:**

| Token                  | Value                          | Used for                                                   |
| ---------------------- | ------------------------------ | ---------------------------------------------------------- |
| `--surface-spine`      | `#1F1712`                      | Card spine (the book's spine strip), Baker's note box      |
| `--surface-chip`       | `#33271F`                      | Close button, yield and time chips, disabled Create button |
| `--surface-new-card`   | `#221A15`                      | "+ New recipe" card background                             |
| `--surface-icon-tile`  | `#352920`                      | Icon tile on the card header                               |
| `--text-ingredient`    | `#EADBC8`                      | Ingredient names, step text                                |
| `--scrim-modal`        | `rgba(10,6,4,0.7)`             | Modal backdrop                                             |
| `--card-border-active` | `#5A4536`                      | Border of the centered card (others use `--line`)          |
| Radius: book card      | 22px                           |                                                            |
| Radius: modal          | 24px                           |                                                            |
| Shadow: active card    | `0 26px 60px rgba(0,0,0,0.55)` |                                                            |
| Shadow: side card      | `0 12px 30px rgba(0,0,0,0.35)` |                                                            |
| Shadow: modal          | `0 30px 80px rgba(0,0,0,0.6)`  |                                                            |

**Typography:** Fraunces for the page title, the card recipe name, the active recipe name and the modal title. Inter for everything else. All numbers use `font-variant-numeric: tabular-nums`.

---

## 6. Screen spec: Carousel page

Page: background `--bg`, text `--text`, `overflow-x: hidden`, padding 32px top and 40px bottom, content centered in a column.

### 6.1 Page heading

- **Recipe Book**: Fraunces `clamp(36px, 6vw, 52px)` / 700, tracking −0.6px, centered.
- Subtitle: "Swipe left or right to flip through your recipes." 16px, `--text-muted`.

### 6.2 Book card front (exact)

```
┌─┬────────────────────────────┐
│ │ BREADS               [icon]│  ← category eyebrow (left) + icon tile (right)
│s│ Pandesal                   │  ← recipe name, Fraunces, max 2 lines
│p│ ────────────────────────── │  ← 1px divider
│i│ INGREDIENTS                │
│n│ 500 g   bread flour        │  ← qty (gold, fixed column) + ingredient
│e│ 60 g    sugar              │     each row has a dashed bottom border
│ │ 7 g     instant yeast      │
│ │ 8 g     salt               │
│ │ 300 ml  warm milk          │
│ │ +3 more ingredients        │  ← only if more exist than fit
│ │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ │ Temp:    Time:   Quantity: │  ← footer labels
│ │ 180 °C   2h 30m  24 rolls  │  ← footer values
└─┴────────────────────────────┘
```

| Part                  | Spec                                                                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Container             | `cw × ch`, radius 22, background `--surface-1` (`#2A201A`), 1px border (centered card `--card-border-active`, others `--line`), `overflow: hidden`, active/side shadows per §5. It's a **real `<button>`**. |
| Spine                 | A 14px strip on the left, `--surface-spine` with a 1px right border `--line`, so the card reads as a book                                                                                                   |
| Content padding       | 22px top · 20px right · 20px bottom · 18px left, column layout with a 12px gap                                                                                                                              |
| Category              | 11 / 700, uppercase, tracking 1.4px, `--accent`                                                                                                                                                             |
| Icon tile             | 30×30, radius 9, `--surface-icon-tile`, a 16px bread icon in `--accent` (inline SVG, no emoji)                                                                                                              |
| Name                  | Fraunces, size `round(cw × 0.085)` (about 19–24px), line-height 1.12, 700, `--text`, **clamped to 2 lines**                                                                                                 |
| Divider               | 1px `--line-strong`                                                                                                                                                                                         |
| "Ingredients" label   | 11 / 700, uppercase, tracking 1.2px, `--text-muted`                                                                                                                                                         |
| Ingredient row        | Padding 4px 0, 1px dashed bottom border `--line`, line-height 1.4, font size `clamp(11px, round(cw × 0.054), 13px)`                                                                                         |
| Quantity column       | Width `round(cw × 0.27)`, 600, `--accent`, one line with ellipsis                                                                                                                                           |
| Ingredient name       | `--text-ingredient`, one line with ellipsis                                                                                                                                                                 |
| Empty state           | "No ingredients yet." 12px `--text-faint`                                                                                                                                                                   |
| "+N more ingredients" | 11px `--text-muted`, 6px above it; singular "ingredient" when N = 1                                                                                                                                         |
| Footer                | Pinned to the bottom (a flexible spacer above it). A 1px dashed top border `--line-strong`, 9px top padding, 3 equal columns with a 6px gap                                                                 |
| Footer label          | **Temp:**, **Time:**, **Quantity:** (text, **no icons or emoji**). 10 / 600, `--text-muted`                                                                                                                 |
| Footer value          | 12 / 600, `--text`, one line with ellipsis, 2px under its label                                                                                                                                             |

**How many ingredients show (always at least 5 if the recipe has them, up to 8):**

```
ts       = round(cw × 0.085)
fs       = clamp(11, round(cw × 0.054), 13)
rowH     = fs × 1.4 + 9
fixedTop = 110 + ts × 1.12 × 2
shown    = clamp(5, floor((ch − fixedTop − 64) / rowH), 8)
```

Measure `cw` from the real element (ResizeObserver) if you can't compute it from CSS alone.

### 6.3 Footer value formatting

| Field                  | Rule                                                           | Example                                                                   |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Temp                   | Show as stored; unset → `—`                                    | `180 °C`, `Cold`                                                          |
| Time                   | Compact: drop anything in parentheses, `hr` → `h`, `min` → `m` | `2 hr 30 min` → `2h 30m` · `1 day (laminated)` → `1 day` · `5 min` → `5m` |
| Quantity               | Drop a leading "Makes "                                        | `Makes 24 rolls` → `24 rolls` · `Makes 1 glass` → `1 glass`               |
| Any unset or "not set" | `—`                                                            |                                                                           |

### 6.4 "+ New recipe" card

Same size and position rules as recipe cards. Background `--surface-new-card`, a **2px dashed** border (`--card-border-active` when centered, `--line` otherwise), a 56px plus icon in `--text` and the label "New recipe" (15 / 600, `--text-2`), both centered.

### 6.5 Under the carousel (max-width 560px, 18px gap, centered)

**When a recipe is centered:**

- Recipe name: Fraunces 26 / 700, `--text`
- Category: 14px, `--text-muted`. **Category only**; the yield and time are not repeated here.
- Hint: "Double-tap the card to open", 13px, `--text-faint`
- The group is an `aria-live="polite"` region, so changes are announced.

**When the + New recipe card is centered:** a form with

- a text input, placeholder "Give it a name", 52px tall, radius 14, background `--bg-input` (`#241B16`), 1px `--line` border, 16px text, gold border on focus, `maxlength` 60, a visually hidden label "Recipe name";
- a **Create recipe** button, 48px tall, radius 14, 15 / 700. Enabled: `--accent` background with `--on-accent` text. Disabled (empty name): `--surface-chip` background with `--text-faint` text.

**Page indicator (keep exactly as built; there are no arrow buttons):**

- A row of dots, one per card (recipes plus the New card). Each dot has a **26×44 hit area**; the dot itself is 8px tall, **8px wide** (`#4A392D`) or **22px wide** (`--accent`) for the active one, animating the width in .25s.
- Below the dots: the counter, e.g. `2 / 6`, 13px `--text-faint`.

---

## 7. Recipe modal (opens on double-tap)

Opened from the carousel by double-tapping the centered recipe card. It looks like an **open book**: left page ingredients, right page steps.

### 7.1 Shell

| Part      | Spec                                                                                                                                                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backdrop  | Full-screen **button** (closes the modal), `--scrim-modal`, 16px padding around the modal                                                                                                                                                |
| Modal     | `role="dialog"` `aria-modal="true"`, labelled by the recipe name. Width `min(980px, 100%)`, max height `calc(100dvh − 32px)` (scrolls inside), radius 24, background `--surface-2` (`#261D17`), 1px border `--line-strong`, modal shadow |
| Close     | 44×44 round button, top 14 / right 14, `--surface-chip` background, × icon, `aria-label="Close"`                                                                                                                                         |
| Layout    | A 2-column grid of equal pages (the "spread")                                                                                                                                                                                            |
| Page fold | Left page: inset shadow `inset -18px 0 24px -18px rgba(0,0,0,.6)`. Right page: 1px left border `--line` plus `inset 18px 0 24px -18px rgba(0,0,0,.6)`. Together they look like the book's fold.                                          |

### 7.2 Left page: ingredients

Padding 32px 30px 30px, column with an 18px gap.

1. **Category** eyebrow: 12 / 700, uppercase, tracking 1.4px, `--accent`
2. **Recipe name** (h2): Fraunces `clamp(28px, 4vw, 38px)`, line-height 1.1, 700, with 48px right padding so it never runs under the close button
3. **Chips:** the quantity text (e.g. "Makes 24 rolls") and the time (e.g. "2 hr 30 min"). Each chip has padding 7px 12px, radius 999, `--surface-chip`, 13px `--text-ingredient`. Here the **full, uncompacted** text shows.
4. **Ingredients** heading (h3): 13 / 700, uppercase, tracking 1.2px, `--text-muted`
5. **Ingredient list:** every ingredient (not truncated). Each row has padding 10px 0, a 1px dashed bottom border `--line`, 15px text, line-height 1.4. Quantity: min-width 84px, 600, `--accent`; name: `--text-ingredient`. Empty: "No ingredients yet." (15px, `--text-faint`).

### 7.3 Right page: steps

Padding 32px 30px 30px, column with an 18px gap.

1. **Steps** heading: same style as the Ingredients heading, with 48px right padding
2. **Numbered steps:** a vertical list with a 16px gap. Each step is a **28px gold circle** (`--accent`, number in `--on-accent`, 13 / 700) next to the text (15px, line-height 1.55, `--text-ingredient`, 3px top padding). Empty: "No steps yet."
3. **Baker's note** (only if there is a note): `--surface-spine` background, 1px dashed `--line-strong` border, radius 14, padding 14px 16px. Label "Baker's note" is 12 / 700 uppercase `--text-muted`; the text is 14px, line-height 1.6, `--text-2`.
4. A flexible spacer, then the page buttons: **‹ Previous page** (left) and **Next page ›** (right). Each is 44px tall with padding 0 16px, a pill shape, a 1px `--line-strong` border, a transparent background, 14 / 500, and 35% opacity when disabled.

### 7.4 Phone (≤ 760px)

- The spread becomes **one column**: the left page, then the right page below it. Remove the inset fold shadows. The right page gets a **1px dashed `--line-strong` top border** instead of the left border.
- Page padding: left page 28px 20px 24px, right page 24px 20px 24px, gap 16px. Recipe name 30px.
- Page buttons are shortened to **‹ Previous** and **Next ›**.
- The modal keeps a 16px margin on every side and scrolls inside (`max-height: calc(100dvh − 32px)`).

---

## 8. Responsive behavior (no detail lost on any device)

The carousel is fluid because `cw = clamp(190px, 58vw, 280px)`; everything inside the card scales from `cw` (see §6.2), so the card never overflows.

| Viewport                                   | Behavior                                                                                                                                                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phone < 640px (test 320 / 360 / 390 / 430) | Card width follows `58vw` (about 187–250px). At 320px it's held at the 190px minimum, and it still shows at least 5 ingredients with the footer fully visible. The page heading is `clamp()`-sized. The modal is single column.                         |
| Tablet 640–1023px                          | Cards at 280px max, two side cards visible on each side                                                                                                                                                                                                 |
| Desktop ≥ 1024px                           | Cards at 280px max, the modal as a two-page spread (980px)                                                                                                                                                                                              |
| All                                        | No horizontal page scroll (the stage clips the outer cards). Swipe still allows vertical scrolling (`touch-action: pan-y`). Use `100dvh` and safe-area insets. Respect `prefers-reduced-motion` by removing the card transitions and the dot animation. |

Check these small details at every width:

- The footer's three columns never overlap; values truncate with an ellipsis.
- A long recipe name clamps to 2 lines; a long ingredient truncates to 1 line.
- The "+N more ingredients" line never gets cut off.
- Side cards stay visibly darker than the centered card (about 68% brightness).

---

## 9. Implementation notes: Next.js + Tailwind + shadcn/ui

| Need                         | Use                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modal                        | shadcn `Dialog` (on phones, keep the same full-width dialog as designed; do **not** convert it to a bottom sheet)                                        |
| Close and page buttons       | shadcn `Button` with variants mapped to tokens                                                                                                           |
| Name input and Create button | shadcn `Input` and `Button`                                                                                                                              |
| Carousel                     | **Custom** (pointer events + the formulas in §4.1). Don't swap in a stock carousel library unless it reproduces the overlap, tilt and darkening exactly. |
| Card                         | A `<button>` styled with tokens, not a div with `onClick`                                                                                                |
| Fonts                        | `next/font/google` (Fraunces, Inter) as CSS variables                                                                                                    |

- Map shadcn's theme variables to Dark Roast in `globals.css` (`--background → --bg`, `--card`/`--popover → --surface-1`/`--surface-2`, `--primary → --accent`, `--border → --line`, `--ring → --accent`).
- Keep the carousel a Client Component; the recipe data can come from a Server Component.
- Recipe data lives in PostgreSQL via the NestJS API (private route, owner login). The prototype's sample recipes (Pandesal, Ensaymada, Ube Croissant, Spanish Bread, Iced Latte) are **sample data only**; the temperatures in them are placeholders.

---

## 10. Accessibility (required)

- The carousel is a `role="region"` with `aria-roledescription="carousel"` and an `aria-label`; every card is a `<button>` with an `aria-label` like "Pandesal, Breads. Double-tap to open" (centered) or "Pandesal, Breads. Show this recipe" (side).
- **Keyboard (production addition):** ← / → on the focused carousel move between recipes; **Enter or Space on the centered card opens the recipe** (a double-tap is a pointer gesture, so keyboard and screen-reader users need a direct way in). Double-click opens it with a mouse.
- The modal traps focus, closes with Escape, and returns focus to the card that opened it. The backdrop and Close are real buttons.
- Page dots have `aria-label` ("Go to Pandesal") and `aria-current="true"` on the active one.
- Hidden cards (`ad > 2.6`) are removed from the tab order.
- Text contrast is at least 4.5:1 on its surface; every touch target is at least 44px (the 8px dots have 26×44 hit areas).

---

## 11. Consistency checklist (verify before calling it done)

- [ ] All colors, radii and shadows come from tokens (shared plus §5); no stray hex values
- [ ] Geometry matches §4.1: tall cards (`ch = cw × 1.62`), close together (`spacing = cw × 0.74`), tilted outward, scaled and faded by distance
- [ ] Side cards are about 32% darker than the centered card, with the brightness fading in and out smoothly while swiping
- [ ] Swipe and drag work with touch, mouse and pen; rubber-band at both ends; vertical scroll still works
- [ ] Double-tap (350 ms) opens the modal only on the centered recipe card; a drag never counts as a tap
- [ ] Card front: category and icon, 2-line name, **at least 5 ingredients** (up to 8) with the "+N more ingredients" line, and the footer **Temp: / Time: / Quantity:** as text labels with no emoji or icons
- [ ] Footer values follow §6.3 (compact time, "Makes " removed, `—` for unset)
- [ ] Under the carousel shows the name, **category only**, and the hint; the page indicator is dots plus the counter, with **no arrow buttons**
- [ ] "+ New recipe" has the name field and the Create button, enabled only with a name
- [ ] The modal is a two-page spread with a fold on desktop and one column on phones, with the correct button labels ("Previous page / Next page" vs "Previous / Next")
- [ ] Previous and next in the modal move the carousel too and disable at the ends
- [ ] No horizontal scroll from 320px up; verified at 320, 360, 390, 430, 768, 1024, 1280, 1440
- [ ] Matches the reference prototype side by side
