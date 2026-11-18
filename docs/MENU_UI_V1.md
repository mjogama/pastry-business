# Business Menu — Landing, Menu & Products · Context

> **For the implementing agent:** this is the source of truth for the customer-facing menu (landing page, menu page, product detail sheet) and the private Products manager. Read the whole file before writing code.
>
> **Consistency first:** this module shares the **Dark Roast** design tokens and primitives defined in `SALES_TRACKER_CONTEXT.md` (§5–§6). Reuse them; never redefine them. Add only the new tokens in §5 below, in the same token file. Never hardcode a color, font size, radius or spacing value that already exists as a token.
>
> Reference prototype (interactive; open in Play): https://claude.ai/artifact/QBk5H5o9bEQx8YL7is3pax

---

## 1. Product summary

A public, mobile-first menu for a single bakery and café business:

- **Landing page (`/`):** introduces the business and moves the customer into the menu.
- **Menu page (`/menu`):** all products grouped by category. Each product card shows the image, title, availability, price (with discount), and a short description.
- **Product detail sheet:** tapping a card shows the larger image, full description, price details, and a tap-to-call button.
- **Footer (both pages):** business name and tap-to-call contact number.
- **Products manager (private, admin):** where the owner adds and edits what the menu shows.

---

## 2. Scope

### In scope

- Landing page, menu page, product detail sheet, footer
- Category filtering
- Discount display with automatic expiry
- Availability states (Available / Out of stock)
- Private Products manager and business Settings (concept in §9)

### Out of scope (do NOT build)

- Online ordering, cart, checkout, payments
- Customer accounts and reviews
- Inventory counts (availability is a manual toggle)
- **Any connection to the Sales Tracker.** Menu products and tracker product names are separate.
- Multiple businesses or branches
- Light mode (not designed yet)

### Placeholders (owner fills these in through Settings; never hardcode)

`[Business Name]`, `[tagline]`, `[contact number]`, hero photo, product photos. The prototype's product list and prices are **sample data only**.

---

## 3. Domain model (conceptual)

```
Category
  id, name (unique), sortOrder

Product
  id
  name              string, 1–60 chars              required
  categoryId        → Category                      required
  shortDescription  string, ≤ 120 chars             required   (cards)
  description       long text                       optional   (detail sheet; falls back to shortDescription)
  imageUrl          uploaded image                  optional   (placeholder if empty)
  price             decimal > 0 (PHP)               required
  discountPrice     decimal > 0 and < price         optional
  discountEndsAt    date                            optional   (no date = runs until removed)
  isAvailable       boolean                         default true
  isFeatured        boolean                         default false  ("Today's picks")
  sortOrder         int                             (within category)
  isArchived        boolean                         (hidden everywhere)

BusinessSettings (single row)
  businessName, tagline, contactNumber, heroImageUrl
```

**Derived (computed, never stored):**

- `isOnSale = discountPrice != null && discountPrice < price && (discountEndsAt == null || today ≤ discountEndsAt)`, using Asia/Manila dates
- `finalPrice = isOnSale ? discountPrice : price`
- `savings = price − finalPrice`

Currency is PHP, formatted `₱1,234` (en-PH grouping, up to 2 decimals, no trailing `.00`). Every number uses tabular figures.

---

## 4. Business rules

| Rule                       | Behavior                                                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expired discount           | Hidden automatically on the day after `discountEndsAt`; the regular price shows again. No manual cleanup needed.                                                                  |
| Discount validation        | Must be > 0 and < price; anything else is rejected on save                                                                                                                        |
| Out of stock               | **Still visible**: dimmed, image in greyscale, sorted **last** within its category. The detail sheet still opens.                                                                 |
| Sort order                 | Within each category: available items first, then by `sortOrder`                                                                                                                  |
| Empty category             | Hidden on the menu                                                                                                                                                                |
| Archived product           | Never shown publicly                                                                                                                                                              |
| Featured ("Today's picks") | Up to 4, preferring featured items; if fewer than 4 are featured, fill with on-sale available items. Hide the section if nothing qualifies. Out-of-stock items never appear here. |
| Missing image              | Branded placeholder (icon on `--img-placeholder`), never a broken image                                                                                                           |
| Phone links                | `tel:` with E.164 format (e.g. `+63917…`); display the local format                                                                                                               |

---

## 5. Design tokens

**Reuse everything** from `SALES_TRACKER_CONTEXT.md` §5 (colors, Fraunces and Inter, radii, focus ring, 44px touch targets). **Add these:**

| Token                | Value                               | Used for                     |
| -------------------- | ----------------------------------- | ---------------------------- |
| `--surface-product`  | `#241B16`                           | Product card, detail sheet   |
| `--img-placeholder`  | `#2F241E`                           | Image placeholder background |
| `--footer-bg`        | `#181210`                           | Footer background            |
| `--status-available` | `#9CCB8E`                           | "Available" dot and text     |
| `--status-out`       | `#A8968A`                           | "Out of stock" dot and text  |
| `--badge-sale-bg`    | `= --accent` `#E8B04A`              | SALE badge                   |
| `--badge-sale-text`  | `= --on-accent` `#241B16`           | SALE badge text              |
| `--chip-save-bg`     | `#3A2C23`                           | "Save ₱X" chip               |
| Radius: product card | 20px                                |                              |
| Radius: hero image   | 28px                                |                              |
| Radius: sheet        | 24px (top corners only on phones)   |                              |
| Card shadow (sheet)  | `0 24px 60px rgba(0,0,0,0.55)`      |                              |
| Content max-width    | 1280px, centered, 24px side padding |                              |

**Typography additions**

| Use                        | Font     | Size / weight                                              |
| -------------------------- | -------- | ---------------------------------------------------------- |
| Landing hero name          | Fraunces | `clamp(44px, 7vw, 84px)` / 700, tracking −1px              |
| Menu page title            | Fraunces | `clamp(40px, 6vw, 60px)` / 700                             |
| Section heading (category) | Fraunces | `clamp(26px, 3.6vw, 34px)` / 700                           |
| Sheet product name         | Fraunces | 30 / 700                                                   |
| Card title                 | Inter    | 17 / 600, 1 line with ellipsis                             |
| Card description           | Inter    | 14 / 400, line-height 1.45, **2-line clamp**               |
| Card final price           | Inter    | 19 / 700, `--accent`                                       |
| Struck original price      | Inter    | 14 / 400, `--text-faint`, line-through                     |
| Eyebrow / category label   | Inter    | 12–14 / 600–700, uppercase, tracking 1.4–1.6px, `--accent` |

Icons: inline stroke SVGs (2px, round caps, `currentColor`), used for the arrow, phone, close and bread placeholder. **No emoji** in the customer UI.

---

## 6. Shared components

| Component         | Spec                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `SiteTopBar`      | Business name (Fraunces 22/700) on the left, linking to `/`. A pill link on the right: **Menu** on the landing page, **Home** on the menu page. |
| `ProductImage`    | 4:3 (16:10 in the sheet). Image cropped to fill (`object-fit: cover`), or a placeholder (bread icon + label). Greyscale when out of stock.      |
| `SaleBadge`       | Pill `SALE`, 12/700, tracking 0.6px, absolutely positioned at the image's top-left with a 12px inset                                            |
| `PriceBlock`      | `[₱85 struck] ₱69 [Save ₱16]` when on sale, otherwise just `₱85`                                                                                |
| `AvailabilityTag` | An 8px dot plus text: `Available` (`--status-available`) or `Out of stock` (`--status-out`)                                                     |
| `ProductCard`     | A real `<button>` (see §7.3)                                                                                                                    |
| `CategoryChips`   | A row of toggle buttons (`aria-pressed`)                                                                                                        |
| `ProductSheet`    | Dialog (see §7.4)                                                                                                                               |
| `SiteFooter`      | See §7.5                                                                                                                                        |
| `Money`           | Reused from the tracker                                                                                                                         |

---

## 7. Screen specs

### 7.1 Landing page `/`

Top to bottom:

1. **SiteTopBar**
2. **Hero:** a two-column flex row that wraps (text `flex: 1 1 420px`, image `flex: 1 1 380px`, gap 48px):
   - Eyebrow "Freshly baked" (`--accent`, uppercase)
   - `[Business Name]` (hero size)
   - Tagline (18px, line-height 1.6, `--text-2`, max-width 480px)
   - **View Menu →** primary pill link: 52px tall, `--accent` background, 17/700, links to `/menu`
   - Hero image: 4:3, radius 28, `--surface-1` background, 1px `--line` border
3. **Today's picks:** heading (Fraunces `clamp(28px, 4vw, 40px)`) with "See full menu →" on the right, then a grid of up to 4 compact cards (image, SALE badge, name, price). Each card links to `/menu` (and may open that product's sheet there).
4. **SiteFooter**

Section gap 72px; page bottom padding 64px.

### 7.2 Menu page `/menu`

1. **SiteTopBar**
2. Title **Menu**, subtitle "Tap any item to see more." (16px, `--text-muted`)
3. **CategoryChips**, **sticky** at the top of the viewport (`--bg` background, 1px bottom border). Order: **All**, then categories by `sortOrder`. Chips are 44px tall, 20px horizontal padding, pill radius, 15/600.
   - Active: `--accent` background, `--on-accent` text
   - Inactive: `--surface-product` background, `--line` border
   - On phones the row scrolls sideways with the scrollbar hidden.
4. **Sections:** "All" shows every non-empty category in order; a chip shows only that category. Each section has a heading plus a count (`4 items`, 14px `--text-faint`) and a grid:
   `grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr)); gap: 20px`
5. **SiteFooter**

Optional enhancement: the selected category is kept in the URL (`/menu?c=pastries`) so it can be shared.

### 7.3 Product card (exact)

```
┌──────────────────────────┐
│ [SALE]                   │
│      [ image 4:3 ]       │
├──────────────────────────┤  padding 16 / 16 / 18, gap 8
│ Ube Croissant            │  title, 1 line
│ Flaky, buttery croissant │  short description, 2-line clamp,
│ filled with ube halaya.  │  min-height 40px (keeps cards aligned)
│ ₱̶8̶5̶  ₱69  (Save ₱16)    │  PriceBlock
│ ● Available              │  AvailabilityTag
└──────────────────────────┘
```

- A `<button>` with radius 20, `--surface-product` background, 1px `--line` border, and overflow hidden.
- Hover (only under `@media (hover: hover)`): border `--line-dashed`, lifted by 2px (0.15s).
- Out of stock: card opacity 0.6 and the image in greyscale.
- `aria-label`: e.g. `"Ube Croissant, on sale ₱69, was ₱85, available"`.
- Click opens the **ProductSheet** for that product.

### 7.4 Product detail sheet

- **Desktop and tablet (> 640px):** a centered modal, `min(560px, 100vw − 32px)` wide, max height `100dvh − 32px` (scrolls), radius 24.
- **Phone (≤ 640px):** a bottom sheet, full width, max height 90dvh, rounded top corners only, a 44×5 drag handle, and safe-area bottom padding.
- Scrim `rgba(10,6,4,0.6)` as a real button; there's also a 44px × button over the image. Escape closes it; focus is trapped inside and returns to the card on close.
- Contents, in order:
  1. Image (16:10, radius 16, 14px inset) with the SALE badge
  2. Category eyebrow
  3. Name (Fraunces 30/700)
  4. AvailabilityTag
  5. **Price panel:** `--surface-note` background, dashed `--line-strong` border, radius 14. The struck original (17px) and the final price (30/700 `--accent`), and below them `Save ₱16 · Sale ends Nov 30` (13px), or "Limited time" when there's no end date.
  6. Full description (15px, line-height 1.65, `--text-2`)
  7. **Call [contact number]**: a full-width primary button (50px tall, radius 14) with a `tel:` link
- `role="dialog"`, `aria-modal="true"`, labelled by the product name.

### 7.5 Footer (both pages)

- `--footer-bg` background, 1px `--line` top border, 32px padding (plus the safe-area inset at the bottom).
- Left: business name (Fraunces 20/700) and `© {year} {businessName}` (13px `--text-muted`).
- Right: a **tap-to-call pill**, at least 48px tall, with a 1px `--line-strong` border, a phone icon in `--accent`, and two lines: "Call us" (12px muted) above the number (16/600).
- It wraps and stacks on phones.

---

## 8. Responsive behavior (no detail lost on any device)

| Breakpoint                                    | Behavior                                                                                                                                                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phone < 640px (test at 320 / 360 / 390 / 430) | Hero stacks (text above image). Product grid is 1 column (2 columns from 360px if each card stays ≥ 160px wide; prefer 1 for readability). Chips scroll sideways. Sheet becomes a bottom sheet. Footer stacks.         |
| Tablet 640–1023px                             | 2–3 columns. The hero may stay side by side from 900px up.                                                                                                                                                             |
| Desktop ≥ 1024px                              | 3–4 columns in a 1280px container                                                                                                                                                                                      |
| All                                           | Fluid type with `clamp()`. No horizontal page scroll from 320px up. Use `100dvh`, safe-area insets and `prefers-reduced-motion` (turns off the card lift). Images use `srcset`/`next/image` with sizes per breakpoint. |

---

## 9. Products manager (private): concept

Behind the same owner login as the Sales Tracker. It uses the same tokens and primitives.

**Products list**

- Grouped by category, with drag-to-reorder within a category
- Each row shows: thumbnail, name, price (with the sale price if active), and an **availability switch** that flips instantly without opening the product
- Filters: All / On sale / Out of stock / Featured. Search by name.
- Actions: Add product, Edit, Archive

**Product form** (add and edit)

| Field             | Input                                 | Validation                 |
| ----------------- | ------------------------------------- | -------------------------- |
| Image             | Upload with a preview and a 4:3 crop  | jpg/png/webp, ≤ 5 MB       |
| Name              | Text                                  | Required, ≤ 60 characters  |
| Category          | Select, with an "Add category" option | Required                   |
| Short description | Text with a live counter              | Required, ≤ 120 characters |
| Full description  | Textarea                              | Optional                   |
| Price             | Number (₱)                            | Required, > 0              |
| Discount price    | Number (₱)                            | Optional, > 0 and < price  |
| Discount ends     | Date                                  | Optional, today or later   |
| Available         | Switch                                |                            |
| Featured          | Switch                                |                            |

A **live preview** of the product card sits next to the form and updates as the owner types.

**Settings:** business name, tagline, contact number, and hero image. These feed the top bar, hero, footer and every Call button.

---

## 10. Accessibility (required)

- Cards are `<button>`s; navigation uses real `<a href>`; chips use `aria-pressed`; the sheet is a proper modal dialog with a focus trap, Escape to close, and focus returned to the card.
- Icon-only buttons have an `aria-label`; decorative SVGs are `aria-hidden`.
- Prices are announced in full in the card's `aria-label` (sale and original).
- Availability is never shown by color alone: there's always a text label next to the dot.
- Text contrast is at least 4.5:1 on its surface; touch targets are at least 44px.
- Product images need real `alt` text (the product name).

---

## 11. Consistency checklist (verify before calling it done)

- [ ] All tokens come from the shared token file (tracker §5 plus §5 here); no stray hex values
- [ ] Fraunces is used only for the business name, headings, the menu title and the sheet product name; everything else is Inter
- [ ] Every price goes through `Money` and uses tabular figures; the sale shows the struck original, the gold final price and the Save chip
- [ ] Discounts expire automatically after `discountEndsAt` (Asia/Manila date)
- [ ] Out-of-stock items are visible, dimmed, in greyscale and sorted last, and never appear in "Today's picks"
- [ ] Card descriptions are clamped to 2 lines with a fixed min-height, so cards in a row line up
- [ ] The chips stay pinned while scrolling; "All" shows grouped sections
- [ ] The detail sheet is a modal on > 640px and a bottom sheet on phones
- [ ] The footer and Call buttons use `BusinessSettings.contactNumber` (`tel:` link)
- [ ] No ordering, cart or tracker coupling has been added
- [ ] No horizontal scroll at 320–1920px; verified at 320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920
- [ ] Matches the reference prototype side by side
