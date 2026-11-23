# Menu `/menu` and Landing `/`

Public, read-only pages; no cart. **Landing:** hero (name, tagline, image, View Menu), Today's picks, call footer. **Menu:** sticky category chips (`?c=`), category sections, product cards that open a detail sheet (`?p=`; a Dialog from 640px, a Drawer below). Design spec: `docs/MENU_UI_V1.md` (landing §7.1, menu §7.2–7.5, rules §4).

## Where to change what

Paths are under `client/features/menu/` unless shown in full.

| To change | Edit | Also check |
| --- | --- | --- |
| Landing hero | `client/app/(site)/page.tsx` | Name, tagline and image come from `data/seed.ts` |
| Which items are Today's picks | `todaysPicks()` in `lib/menu.ts` | |
| Menu title and layout | `client/app/(site)/menu/page.tsx` | |
| Sections, sorting, item count | `buildSections()` in `lib/menu.ts` | `components/menu-content.tsx` renders them and `TodaysPicks` |
| Product card | `components/product-card.tsx`, `product-card-button.tsx` | `components/skeletons.tsx` mirrors its boxes |
| Detail sheet | `components/product-sheet.tsx` | |
| Price, SALE badge, availability | `components/price-block.tsx`, `sale-badge.tsx`, `availability-tag.tsx` | Sale rules in `lib/pricing.ts` |
| Chips and filtering | `components/category-chips.tsx`, `components/menu-provider.tsx` | `MenuProvider` takes the sheet as a `Sheet` prop |
| Header and footer (both pages) | `components/site-chrome.tsx` | |
| Products, categories, business info | `data/seed.ts` | Types in `types.ts`, `shared/modules/product.ts`, `category.ts`, `menu.ts` |
| Phone display and `tel:` links | `lib/phone.ts` | E.164 in data, local format on screen |

## Rules that must stay true

- **Sale:** while `0 < discountPrice < price` and today ≤ `discountEndsAt`; it ends by itself the next day.
- **Out of stock:** still shown, dimmed, greyscale, last in its category; the sheet still opens. Never in Today's picks.
- **Picks:** up to 4, featured first, then available on-sale items; the section hides when empty.
- **Sort:** available first, then `sortOrder`. Empty categories and archived products are hidden. Missing images get a placeholder.
- **Dates are Manila days** (`manilaToday()` in `lib/pricing.ts`).
- Business name, tagline, phone and hero image are owner settings; never hardcode them.

## Important for changes

- **No server API yet.** Data is the seed, served by `getMenuData()` / `getBusinessSettings()` in `data/menu-data.ts` with `"use cache"`. When a products API lands, only those functions change.
- **Cache Components is on.** The shell prerenders; anything that depends on today (prices, picks, © year) renders per request inside `<Suspense>` after `await io()`. Keep date logic out of cached functions.
