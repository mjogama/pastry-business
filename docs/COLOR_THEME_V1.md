# Recipe Book — Butter Yellow Theme

A light, bakery-style theme for the Recipe Book page. The page layout matches the current dark version; only the colors change.

---

## 1. Color palette

| Token      | Hex       | Role                                                                  |
| ---------- | --------- | --------------------------------------------------------------------- |
| `yellow`   | `#F2B705` | Primary. Actions, active states, card spine, ×1 chip, active page dot |
| `cocoa`    | `#3B2416` | Main text: titles, values, ingredient names, text on yellow           |
| `page`     | `#FFF8EC` | Page background (cream)                                               |
| `card`     | `#FFFFFF` | Main card surface                                                     |
| `dough`    | `#FBEBCB` | Soft fills: icon buttons, image placeholders                          |
| `crust`    | `#7A5C45` | Secondary text: labels, descriptions, "+N ingredients", page counter  |
| `honey`    | `#8A5A00` | Yellow-family text: ingredient amounts, category label                |
| `cinnamon` | `#C8553D` | Accent, used sparingly: badges like "Bestseller", "New", "Sold out"   |
| `border`   | `#EAD9BF` | Card borders, dividers, dashed row separators                         |
| `dashed`   | `#D9C3A0` | "New recipe" dashed outline                                           |
| `dot`      | `#E3CFAE` | Inactive pagination dots                                              |
| `ghost`    | `#FFFDF8` | Background cards in the stack                                         |
| `new-card` | `#FBF1DE` | "New recipe" card fill                                                |

### CSS variables

```css
:root {
  --color-yellow: #f2b705;
  --color-cocoa: #3b2416;
  --color-page: #fff8ec;
  --color-card: #ffffff;
  --color-dough: #fbebcb;
  --color-crust: #7a5c45;
  --color-honey: #8a5a00;
  --color-cinnamon: #c8553d;
  --color-border: #ead9bf;
  --color-dashed: #d9c3a0;
  --color-dot: #e3cfae;
  --color-ghost: #fffdf8;
  --color-new-card: #fbf1de;
}
```

### Tailwind (`tailwind.config.ts`)

```ts
theme: {
  extend: {
    colors: {
      yellow:   '#F2B705',
      cocoa:    '#3B2416',
      page:     '#FFF8EC',
      card:     '#FFFFFF',
      dough:    '#FBEBCB',
      crust:    '#7A5C45',
      honey:    '#8A5A00',
      cinnamon: '#C8553D',
      line:     '#EAD9BF',
      dashed:   '#D9C3A0',
      dot:      '#E3CFAE',
      ghost:    '#FFFDF8',
      newcard:  '#FBF1DE',
    },
    fontFamily: {
      display: ['Fraunces', 'Georgia', 'serif'],
      sans:    ['Inter', 'system-ui', 'sans-serif'],
    },
  },
},
```

---

## 2. Color usage rules

1. **Yellow is for actions and highlights only.** Don't use it for large surfaces or body text.
2. **Never put yellow text on cream or white.** It fails contrast. Use `honey` for yellow-family text.
3. **Text on a yellow fill is `cocoa`**, never white.
4. **`crust` is for secondary text only** (labels, hints, descriptions), never long paragraphs.
5. **`cinnamon` is for urgency badges only**, at most one per card.
6. Contrast checks (WCAG AA, 4.5:1 for body text):
   - `cocoa` on `page` / `card`: passes (about 14:1)
   - `honey` on `card`: passes (about 5.8:1)
   - `crust` on `card`: passes (about 6:1)
   - `cocoa` on `yellow`: passes (about 8:1)

---

## 3. Typography

| Element                                      | Font     | Size                                          | Weight | Color   |
| -------------------------------------------- | -------- | --------------------------------------------- | ------ | ------- |
| Page title "Recipe Book"                     | Fraunces | 52px                                          | 700    | `cocoa` |
| Card title                                   | Fraunces | 31px                                          | 700    | `cocoa` |
| Card description                             | Inter    | 14px                                          | 400    | `crust` |
| Category label ("CAKES")                     | Inter    | 11px, letter-spacing 0.16em, uppercase        | 600    | `honey` |
| Stat label (TEMP, EST. TIME, QUANTITY)       | Inter    | 9px, letter-spacing 0.12em, uppercase         | 600    | `crust` |
| Stat value                                   | Inter    | 16px                                          | 600    | `cocoa` |
| Section label (INGREDIENTS, DRY INGREDIENTS) | Inter    | 9–10px, letter-spacing 0.12–0.14em, uppercase | 600    | `crust` |
| Ingredient amount                            | Inter    | 15px, right-aligned                           | 600    | `honey` |
| Ingredient name                              | Inter    | 15px                                          | 400    | `cocoa` |
| Overflow ("+4 ingredients")                  | Inter    | 11px                                          | 400    | `crust` |
| Page counter ("2 / 4")                       | Inter    | 12px                                          | 400    | `crust` |

Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
```

---

## 4. Page layout (desktop, 1234 × 742 reference)

- **Background:** `page`
- **Title:** "Recipe Book", centered at the top
- **Card stack**, centered horizontally:
  - **Left:** "New recipe" card, 300 × 520, rotated −4°, `new-card` fill, 2px dashed `dashed` border, radius 22px, centered plus icon and the label "New recipe" in `crust`
  - **Center:** active recipe card, 412 × 618
  - **Right:** next cards fanned behind, rotated +3° and +5°, `ghost` fill, 1px `border`, opacity 0.8 / 0.6
- **Pagination**, centered below the card: "2 / 4" counter, then dots (5 × 8px, radius 3px, 14px gap). Active dot `yellow`, inactive `dot`

---

## 5. Recipe card

```
┌──────────────────────────────────────────┐
│▌ CAKES                            [icon] │
│▌ Banana Bites                            │
│▌ Moist and fluffy                        │
│▌ ─────────────────────────────────────── │
│▌ TEMP        EST. TIME      QUANTITY     │
│▌ 135 °C      20m            12           │
│▌ ─────────────────────────────────────── │
│▌ INGREDIENTS                       (×1)  │
│▌ DRY INGREDIENTS                         │
│▌      125 g  Flour                       │
│▌        4 g  Baking Soda                 │
│▌        4 g  Baking Powder               │
│▌        1 g  Salt                        │
│▌ +1 ingredient                           │
│▌ WET INGREDIENTS                         │
│▌       55 g  Oil                         │
│▌      100 g  Brown sugar                 │
│▌       60 g  Milk                        │
│▌ +4 ingredients                          │
│▌ TOPPING                                 │
│▌       10 g  Chocolate chips             │
└──────────────────────────────────────────┘
 ▌ = 10px spine in yellow
```

| Part                 | Spec                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Card                 | `card` background, 1px `border`, radius 24px, overflow hidden                               |
| Spine                | 10px wide, full height, left edge, `yellow` (can be set per category)                       |
| Padding              | 22px top/bottom, 26px left (after the spine), 32px right                                    |
| Category icon button | 38 × 38, radius 10px, `dough` fill, `cocoa` icon                                            |
| Stats row            | 3-column grid; 1px `border` top and bottom; 10px vertical padding                           |
| ×1 chip              | `yellow` fill, `cocoa` text, 11px/600, pill radius, padding 3px 10px                        |
| Ingredient rows      | 2-column grid `90px 1fr`, 9px gap; 6px vertical padding; 1px dashed `border` below each row |
| Section spacing      | 12px before the first section, 8px between sections                                         |

---

## 6. Accessibility notes

- The category icon button needs an `aria-label` (e.g., "Category: cakes").
- Background cards in the stack are decorative: `aria-hidden="true"`.
- Inactive pagination dots are decorative; the active one gets `aria-label="Recipe 2 of 4"`.
- Make "New recipe" a real `<button>`.
- Tap targets should be at least 44 × 44px on mobile. The 38px icon button can keep its look with a larger hit area (padding or a pseudo-element).
