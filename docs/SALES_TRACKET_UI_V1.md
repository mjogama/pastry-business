# Sales Tracker — Calendar Module · Context

> **Superseded in places.** The built page differs from this spec in the header (§7.1, §8.1, §7.5, §8.6), day cell (§7.3, §8.2), day details (§7.6, §8.3, §8.4) and entry popover (§7.7). Where they disagree, `docs/architecture/sales-tracker.md` ("Differences from the design spec") wins.

> **For the implementing agent:** this is the source of truth for the Sales Tracker calendar. Read the whole file before writing code. **Set up the design tokens (§5) and shared primitives (§6) first**, then build the screens from them. Never hardcode a color, font size, radius or spacing value that already exists as a token. The UI must match the reference prototype exactly.
>
> Reference prototype (interactive): https://claude.ai/artifact/MyB67TruKWgLNScZSXKPTE

---

## 1. Product summary

A private, single-business tool for recording **daily revenue** on a calendar.

- The owner holds a day for 2 seconds, fills in a sales entry (title, products, price × quantity, note), and saves.
- Each day on the calendar shows its entry titles, a 🦆 indicator, and its revenue total.
- The month's total revenue is shown below the calendar.
- Tapping a day opens a side panel with everything recorded for that date.

The look is based on the **macOS Calendar month view**, restyled with a warm **bakery / pastry theme** ("Dark Roast").

---

## 2. Scope

### In scope (this module)

- Month calendar with navigation
- Create, read, edit and delete sales entries
- Day cell display: titles, indicator, day revenue
- Day detail side panel
- Entry popover (create and edit)
- Monthly revenue total

### Out of scope (do NOT build)

- Profit and cost tracking (**revenue only**)
- Ordering, cart, payments
- Inventory and stock counts
- Multiple businesses or branches, multiple users or roles
- **Any link between the tracker and the public menu.** The tracker is standalone; product names in the tracker are free text, not menu items.
- A header or footer on the calendar page (not designed yet)

### Planned later (not specified yet; leave room in the architecture)

- Year view: a bar graph of monthly revenue with momentum messages
- Public landing page and menu page (separate from the tracker)
- Light mode

---

## 3. Domain model (conceptual)

```
SalesEntry
  id
  date        datetime (local, Asia/Manila)   required, not in the future
  title       string, 1–60 chars              required
  items       SalesItem[]  (≥ 1)              required
  note        long text                       optional
  createdAt, updatedAt

SalesItem
  productName string (trimmed)                required
  price       decimal > 0 (PHP)               required
  quantity    integer ≥ 1                     required
```

**Derived values (never stored; always computed):**

- `itemRevenue  = price × quantity`
- `entryTotal   = Σ itemRevenue` of the entry
- `dayTotal     = Σ entryTotal` of entries whose date falls on that calendar day
- `monthTotal   = Σ dayTotal` of the days in that month

**Reusable product names:** product names entered before are suggested as the user types (autocomplete). Choosing a remembered name auto-fills its **most recent price** (by entry date). The auto-filled price stays editable. If the user then changes the name, the price is replaced only while it is still the auto-filled value, never after the user typed it.

Currency is PHP, formatted as `₱1,234` (en-PH grouping, up to 2 decimals, no trailing `.00`).

---

## 4. Business rules

| Rule                           | Behavior                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry date default             | Now, local time. Shown as `mm-dd-yy · h:mm AM/PM`.                                                                                            |
| Opening the popover from a day | Date = that day + the current time (clamped to now if that would be in the future)                                                            |
| Future dates                   | Cannot be saved. Holding a future day does nothing. The side panel for a future day shows "This day hasn't happened yet." with no add action. |
| Multiple entries per day       | Allowed, unlimited. Sorted by time ascending.                                                                                                 |
| Day indicator                  | **🦆** if `dayTotal > 0`, otherwise nothing. There is one indicator only: no tiers, no legend.                                                |
| Validation order               | Date → Title → each product (name → price > 0 → qty ≥ 1). Show the first error only, in an inline alert.                                      |
| Delete                         | Immediate, with no confirm dialog (from the popover or the side panel).                                                                       |
| Holidays                       | Fixed-date PH holidays are shown as a small sage label in the cell (see §7.3).                                                                |

---

## 5. Design tokens: set these up FIRST

Define them as CSS variables or a theme object, and use them everywhere.

### 5.1 Color: "Dark Roast"

| Token                 | Hex                 | Used for                                                            |
| --------------------- | ------------------- | ------------------------------------------------------------------- |
| `--bg`                | `#1C1511`           | Page background, outer inputs                                       |
| `--surface-1`         | `#2A201A`           | Nav buttons, month revenue card                                     |
| `--surface-2`         | `#261D17`           | Side panel                                                          |
| `--surface-popover`   | `#2B211B`           | Entry popover                                                       |
| `--surface-card`      | `#352920`           | Cards inside the popover                                            |
| `--surface-inset`     | `#241B16`           | Boxed inputs inside cards                                           |
| `--surface-note`      | `#1F1712`           | Note block in the side panel                                        |
| `--surface-button`    | `#3A2C23`           | Secondary buttons in the popover                                    |
| `--line`              | `#3A2C23`           | Grid lines, borders                                                 |
| `--line-strong`       | `#4A392D`           | Popover border, dashed dividers                                     |
| `--line-dashed`       | `#5A4536`           | Dashed rule above the day total, cell hover ring                    |
| `--text`              | `#F3E9DC`           | Primary text                                                        |
| `--text-2`            | `#CDBBA9`           | Year in the title, labels                                           |
| `--text-muted`        | `#B9A796`           | Weekday labels, secondary text                                      |
| `--text-faint`        | `#8E7C6E`           | Placeholders                                                        |
| `--text-outside`      | `#7A685B`           | Day numbers outside the current month                               |
| `--accent`            | `#E8B04A`           | Butter gold: today, totals, primary buttons, accent bar, focus ring |
| `--on-accent`         | `#241B16`           | Text on gold                                                        |
| `--danger-text`       | `#F0A391`           | Delete and remove                                                   |
| `--danger-bg`         | `#3A1F18`           | Error alert background                                              |
| `--danger-alert-text` | `#F7B7A6`           | Error alert text                                                    |
| `--holiday-bg`        | `#3E4A33`           | Holiday label                                                       |
| `--holiday-text`      | `#DCE6D0`           | Holiday label text                                                  |
| `--scrim`             | `rgba(10,6,4,0.55)` | Side panel backdrop (0.6 for a centered popover)                    |

**Bake-level cell tint:** for a day with sales, the background is `rgba(232,176,74, 0.05 + 0.20 × dayTotal / maxDayTotalOfThatMonth)`. Days with no sales are transparent.

### 5.2 Typography

| Token               | Font             | Size / weight                            | Used for                          |
| ------------------- | ---------------- | ---------------------------------------- | --------------------------------- |
| `display`           | Fraunces (serif) | 44 / 700 for the month, 400 for the year | Calendar title                    |
| `display-amount`    | Inter            | 44 / 700, tracking −0.5                  | Month revenue amount              |
| `heading`           | Fraunces         | 24 / 600                                 | Side panel date                   |
| `entry-title-input` | Fraunces         | 22 / 600                                 | Title field in the popover        |
| `cell-title`        | Inter            | 15 / 600, line-height 1.25               | Entry titles in a cell            |
| `cell-total`        | Inter            | 15 / 700                                 | Day total                         |
| `day-number`        | Inter            | 15 / 500 (700 for today)                 | Date number                       |
| `body`              | Inter            | 14–16 / 400–600                          | General text                      |
| `label`             | Inter            | 12–13 / 500–600                          | Small labels, weekdays (14 / 500) |

- Fonts come from Google Fonts: **Fraunces** (opsz 9..144; 400, 600, 700) and **Inter** (400, 500, 600, 700).
- **Every number uses `font-variant-numeric: tabular-nums`.**

### 5.3 Shape and spacing

| Token                    | Value                                                          |
| ------------------------ | -------------------------------------------------------------- |
| Radius: pill             | 999px (nav buttons, today circle, revenue card)                |
| Radius: popover          | 22px                                                           |
| Radius: card             | 14px                                                           |
| Radius: input and button | 10px                                                           |
| Radius: holiday label    | 6px                                                            |
| Page padding             | 20px top · 24px sides · 32px bottom                            |
| Section gap              | 18px                                                           |
| Minimum touch target     | 44 × 44px                                                      |
| Focus ring               | 2px solid `--accent`, 2px offset (inset 2px on popover fields) |
| Popover shadow           | `0 24px 60px rgba(0,0,0,0.55)`                                 |

### 5.4 Icons

Inline stroke SVGs: 2px stroke, round caps, `currentColor`. Icons used: chevron-left, chevron-right, close (×). The only emoji in the UI is the 🦆 indicator.

---

## 6. Shared primitives (build before the screens)

| Primitive         | Spec                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `IconButton`      | 44×44, pill radius, `--surface-1` background, icon 18px, `aria-label` required                                                        |
| `PillButton`      | 44px tall, 18px horizontal padding, `--surface-1`, 15/500                                                                             |
| `PrimaryButton`   | `--accent` background, `--on-accent` text, 700 weight                                                                                 |
| `SecondaryButton` | `--surface-button` background, `--text`                                                                                               |
| `DangerButton`    | `--surface-button` background, `--danger-text`                                                                                        |
| `PopoverField`    | Borderless and transparent, 44px minimum height, inset gold ring on focus. The `boxed` variant uses the `--surface-inset` background. |
| `Card`            | `--surface-card`, radius 14                                                                                                           |
| `Money`           | Formats PHP (§3), tabular figures                                                                                                     |
| `Scrim`           | A full-screen **button** that closes its overlay (not a clickable div)                                                                |

---

## 7. Screen spec: Calendar page

The page has three blocks stacked vertically with an 18px gap: **title row → month grid → month revenue**. No header, no footer, no add button. Adding happens only through hold-to-add.

### 7.1 Title row

- Left: `November 2026`. The month is in Fraunces 44/700 `--text`; the year is in Fraunces 44/400 `--text-2`.
- Right: `[‹] [Today] [›]` with a 6px gap. ‹ and › change the month; **Today** jumps to the current month.
- The row is aligned to the bottom (`flex-end`) and wraps on narrow screens.

### 7.2 Weekday header

- 7 equal columns, **Sun–Sat** (the week starts on Sunday). Labels are right-aligned with 10px right padding, 14/500 `--text-muted`, and a 1px `--line` bottom border.

### 7.3 Month grid and day cell

- 7 equal columns, and only as many week rows as the month needs (5 or 6). Leading and trailing days from adjacent months are shown at **50% opacity**.
- Grid lines are 1px `--line` (left border on the grid; right and bottom borders on each cell).
- Each cell is a **`<button>`**, **138px tall**, padded 6px top, 8px sides and 8px bottom, with a 4px internal gap and overflow hidden.

**Cell layout (exact):**

```
┌──────────────────────────────┐
│ Morning walk-ins          18 │  ← titles (left, top-aligned with the date) │ date (right)
│ Merienda rush             🦆 │  ← 2nd title                                │ 🦆 under the date
│ +1 more                      │
│ [All Saints' Day]            │  ← holiday label (if any)
│                              │  ← flexible spacer
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ← 1px dashed --line-dashed
│ ₱2,450                       │  ← day total, bottom-left, fixed position
└──────────────────────────────┘
```

- **Top row:** two columns.
  - **Left column** (fills the width, 5px top padding so it lines up with the date): up to **2 entry titles**, `cell-title` style, one line each, truncated with an ellipsis. If there are more than 2 entries, add `+N more` (12px `--text-muted`).
  - **Right column** (right-aligned, 6px gap): the **date number**, then the **🦆 (20px) below it**.
- **Date number:** a 30px-tall row. **Today** is drawn as a gold circle (min 30×30, `--accent` background, `--on-accent` text, 700). Other days use `--text`, or `--text-outside` outside the month. The **first of the month** reads `Nov 1`, as in macOS.
- **Products are never shown in the cell.**
- **Day total** always sits at the bottom of the cell, with a dashed rule above it. It's hidden when the total is 0.
- Background: the bake-level tint from §5.1.
- Hover: inset 1px `--line-dashed` ring. Focus: the gold focus ring.
- `aria-label`: e.g. `"Wed Nov 18 2026, revenue ₱1,950"` or `"…, no sales"`.

### 7.4 Interactions on a cell

| Gesture                                                                     | Result                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tap / click**                                                             | Opens the **Day detail panel** (§7.6) for that date                                                                                                                                                                                                       |
| **Press and hold for 2 seconds** (mouse, touch or pen; primary button only) | A 3px gold **hold bar** fills along the bottom edge of the cell over 2 seconds (linear). When it completes, the **Entry popover** (§7.7) opens anchored to that cell in create mode. The click that follows the release must **not** open the side panel. |
| Release, leave or cancel before 2 seconds                                   | Cancel the hold and remove the bar                                                                                                                                                                                                                        |
| Hold on a future day                                                        | Nothing happens                                                                                                                                                                                                                                           |

The cell must suppress text selection, the iOS callout and the context menu, and use `touch-action: manipulation`.

### 7.5 Month revenue (below the grid)

- A pill card: width **537px** (max 100%), min-height **106px**, padding 14px 32px, `--surface-1` background, 1px `--line` border.
- Label: `November revenue`, 15/500 `--text-muted`.
- Amount: `display-amount` style (Inter 44/700), `--accent`.

### 7.6 Day detail panel (side panel)

- A right-hand drawer, `min(460px, 100%)` wide, full height, `--surface-2` background, 1px `--line` left border, over a scrim. Closes via the scrim or the × button.
- **Header:** the full date in Fraunces 24/600 (e.g. `Wednesday, November 18, 2026`). Below it: 🦆 · `Day total` · the amount (18/700 `--accent`). A dashed bottom border.
- **Entry list** (scrolls), one block per entry, separated by dashed lines:
  - Row 1: **title** (16/600) with the **time** below it (12/500 `--text-muted`, e.g. `8:30 AM`). Entry total on the right (16/700 `--accent`).
  - Product lines: `name · ₱price × qty · ₱revenue` (14px; revenue right-aligned, min-width 72px).
  - Note (if any): a `--surface-note` block, 13px, keeps line breaks.
  - Actions: `[Edit]` (outline) and `[Delete]` (danger outline), right-aligned, 36px tall.
- **Empty state:** "No sales recorded for this day." (or the future-day message).
- **Footer** (today and past days only): a full-width gold `+ Add entry for this day` button, 48px tall, which opens the popover **centered**.
- **Edit** opens the popover **centered**, on top of the panel.

### 7.7 Entry popover (create and edit), modeled on the macOS new-event popover

- Width `min(440px, 100vw − 24px)`, max height `100vh − 24px` (scrolls), radius 22, `--surface-popover`, 1px `--line-strong` border, 16px padding, 12px gap.
- **Placement:**
  - Opened by **hold:** anchored beside the held cell. It goes to the right of the cell if it fits, otherwise to the left, with 14px of space. It has an **18px arrow**, rotated 45°, pointing at the cell's vertical center. Top = clamp(cellMidY − 90, 12, viewportH − popoverH − 12). The scrim is **transparent** (a click outside closes it).
  - Opened from the panel, or on viewports **under 720px:** centered with a dimmed scrim (0.6), and no arrow.

**Contents, top to bottom (exact order):**

1. **Title and date group:** a 4px gold **accent bar** runs down the left of two stacked cards (8px gap):
   - Card: **Title** input. Placeholder "Title of this sale", `entry-title-input` style, min-height 56. The label is visually hidden but present.
   - Card: **Date and time** input (`datetime-local`, max = now, 16/600), with the formatted helper `mm-dd-yy · h:mm AM` below it (13px `--text-muted`).
2. **Products card** (12px padding, 8px gap):
   - Column header: `Product | Price ₱ | Qty | Revenue | ·`, 12/600 `--text-muted`.
   - One row per product, grid `2fr 1fr 0.8fr 1fr 36px`, 6px gap: name input (autocomplete), price, qty (default `1`), **live revenue** (right-aligned, 14/600), and a remove × on every row **except the first**.
   - Footer, above a dashed top border: `+ Add product` (gold text button) on the left; `Total ₱X` (20/700 `--accent`) on the right.
3. **Note card:** a textarea, placeholder "Add notes", 3 rows, resizable vertically.
4. **Error alert** (only when present): `--danger-bg` background, `--danger-alert-text`, `role="alert"`.
5. **Action row:** `[Delete]` on the left (**edit mode only**); `[Cancel] [Save]` on the right. 40px tall, radius 10.

Saving closes the popover, switches the calendar to the entry's month, and refreshes the panel if it's open.

---

## 8. Responsive behavior (no detail may be lost on any device)

**Principle:** every piece of information shown on desktop (titles, 🦆, day total, holiday, entry details) must still be reachable and readable on every device. Smaller screens **move** details elsewhere; they never **drop** them. Build mobile-first with fluid sizes (`clamp()`, `minmax(0,1fr)`), never fixed pixel layouts that overflow.

| Breakpoint | Range                                        | Notes                                    |
| ---------- | -------------------------------------------- | ---------------------------------------- |
| Phone      | < 640px (test at 320, 360, 390, 430)         | Portrait first; landscape must also work |
| Tablet     | 640–1023px (test at 768, 820, 1024 portrait) |                                          |
| Desktop    | 1024–1439px                                  |                                          |
| Wide       | ≥ 1440px                                     | Content max-width 1600px, centered       |

### 8.1 Title row

- Title: `clamp(28px, 6vw, 44px)`. Nav buttons stay 44×44 at every size.
- Phone: the title and nav share one row; the nav never wraps below the title unless the width is under 340px.

### 8.2 Day cell per breakpoint

| Element         | Desktop / Wide                           | Tablet                       | Phone                                                                |
| --------------- | ---------------------------------------- | ---------------------------- | -------------------------------------------------------------------- |
| Cell height     | 138px                                    | 112px                        | `clamp(56px, 15vw, 72px)`                                            |
| Entry titles    | Up to 2 + `+N more` (15/600)             | 1 title + `+N more` (13/600) | Not in the cell. Shown in the **Day agenda** (§8.3)                  |
| Date number     | 15px top-right; today = 30px gold circle | Same                         | 13px top-right; today = 24px gold circle                             |
| 🦆              | 20px under the date                      | 18px                         | 14px under the date                                                  |
| Holiday         | Sage label                               | Sage label, 10px             | A 4px sage dot at the bottom-left; full name in the agenda           |
| Day total       | 15/700 with dashed rule                  | 13/700                       | 11/700 compact (`₱950`, `₱1.9k`, `₱12k`); exact amount in the agenda |
| Bake-level tint | Yes                                      | Yes                          | Yes                                                                  |

### 8.3 Phone: Day agenda (replaces the side panel on phones)

- Below the grid and above the month revenue: an inline **agenda** for the **selected day** (default: today).
- Tapping a cell **selects** it (2px gold inset ring) and updates the agenda; it doesn't open a drawer.
- The agenda shows exactly what the desktop side panel shows: the date heading, 🦆 + day total, holiday name, and every entry (title, time, products with price × qty = revenue, note, Edit/Delete), plus `+ Add entry for this day`.

### 8.4 Overlays per breakpoint

| Overlay                       | Desktop / Wide                         | Tablet                                       | Phone                                                                                                                                  |
| ----------------------------- | -------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Day detail                    | Right drawer, 460px                    | Right drawer, `min(420px, 60vw)`             | Inline agenda (§8.3)                                                                                                                   |
| Entry popover (from hold)     | Anchored beside the cell with an arrow | Anchored if it fits (≥ 720px), else centered | **Bottom sheet**: full width, max-height 90dvh, radius 22 on the top corners only, a drag handle, and sticky Cancel/Save at the bottom |
| Entry popover (from Edit/Add) | Centered                               | Centered                                     | Bottom sheet                                                                                                                           |

### 8.5 Popover / sheet internals

- Product rows: ≥ 560px use the 5-column grid. Under 560px each product becomes a mini card: the name on a full row, then `Price | Qty | ×`, then the revenue right-aligned.
- Inputs are at least 16px on phones, so iOS doesn't zoom on focus.
- `datetime-local` uses `color-scheme: dark`.

### 8.6 Month revenue card

- Desktop: 537px pill as specified. Tablet and phone: full width, radius 24, amount `clamp(32px, 8vw, 44px)`.

### 8.7 Platform details

- Use `100dvh` instead of `100vh`; respect `env(safe-area-inset-*)` on the page padding and the bottom sheet.
- Hold-to-add works with touch, mouse and pen (Pointer Events). Cancel it if the pointer moves more than 10px (so scrolling never triggers a hold). Optionally vibrate (`navigator.vibrate(10)`) when the hold completes on supported devices.
- Hover styles only under `@media (hover: hover)`.
- Respect `prefers-reduced-motion`: the hold bar still shows progress, but without easing effects.
- No horizontal page scroll at any width from 320px up.

## 9. Accessibility (required)

- Every clickable thing is a real `<button>` (cells, scrims and actions included). Never `onClick` on a div.
- Icon-only buttons have an `aria-label`. Popover fields have labels (visually hidden is fine).
- The panel and popover have `role="dialog"` with an `aria-label`.
- Text contrast is at least 4.5:1 against its surface (the tokens above pass on their intended surfaces).
- Hold-to-add is a pointer gesture, so it **must** have a keyboard equivalent: Enter or Space on a cell opens the panel (the agenda on phones) → `+ Add entry for this day`.
- Every touch target is at least 44px (except the in-row remove button, which is 36×44).

---

## 10. Consistency checklist (verify before calling the UI done)

- [ ] Every color, font, radius and shadow comes from a token (§5); no stray hex values in components
- [ ] Fraunces is used only for the month title, panel date heading and popover title input; everything else is Inter
- [ ] Every money value goes through `Money` and uses tabular figures
- [ ] The cell layout matches §7.3: titles left and level with the date, 🦆 under the date, day total pinned to the bottom, no product names
- [ ] 🦆 is the only indicator; there's no legend
- [ ] There's no add button on the page; hold-to-add is the only way in from the grid (plus the panel's add button)
- [ ] The hold takes exactly 2 seconds, shows the fill bar, and the following click doesn't open the panel
- [ ] The popover anchors with an arrow when opened by hold, and is centered otherwise
- [ ] Remembered product names autocomplete and auto-fill their latest price
- [ ] Future dates can't be saved or held
- [ ] Day and month totals are always derived, never stored
- [ ] No information is lost at any breakpoint: phone details move into the Day agenda, compact totals, and the holiday dot
- [ ] Hold-to-add cancels after 10px of pointer movement, so scrolling never triggers it
- [ ] Phone overlays are bottom sheets with safe-area padding; inputs are ≥ 16px
- [ ] No horizontal scroll from 320px up; verified at 320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920 (portrait and landscape on phone and tablet)
- [ ] The UI matches the reference prototype side by side on desktop
