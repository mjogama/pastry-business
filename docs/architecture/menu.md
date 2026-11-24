# Menu `/menu` and Landing `/`

Public, read-only pages; no cart. **Landing:** hero (name, tagline, image, View Menu), Today's picks, call footer. **Menu:** sticky category chips (`?c=`), category sections, product cards that open a detail sheet (`?p=`; a Dialog from 640px, a Drawer below). Design spec: `docs/MENU_UI_V1.md` (landing §7.1, menu §7.2–7.5, rules §4).

## Where to change what

Paths are under `client/features/menu/` unless shown in full.

| To change | Edit | Also check |
| --- | --- | --- |
| Landing hero | `client/app/(site)/page.tsx` | Name, tagline and image come from `GET /menu` settings |
| Which items are Today's picks | `todaysPicks()` in `lib/menu.ts` | |
| Menu title and layout | `client/app/(site)/menu/page.tsx` | |
| Sections, sorting, item count | `buildSections()` in `lib/menu.ts` | `components/menu-content.tsx` renders them and `TodaysPicks` |
| Product card | `components/product-card.tsx`, `product-card-button.tsx` | `components/skeletons.tsx` mirrors its boxes |
| Detail sheet | `components/product-sheet.tsx` | |
| Price, SALE badge, availability | `components/price-block.tsx`, `sale-badge.tsx`, `availability-tag.tsx` | Sale rules in `lib/pricing.ts` |
| Chips and filtering | `components/category-chips.tsx`, `components/menu-provider.tsx` | `MenuProvider` takes the sheet as a `Sheet` prop |
| Header and footer (both pages) | `components/site-chrome.tsx` | |
| Products, categories, business info | The API: `/products`, `/categories`, `PUT /menu/settings` (no owner UI yet) | Types in `types.ts`, `shared/modules/product.ts`, `category.ts`, `menu.ts` |
| What the API call returns and how it is cleaned | `api.ts`, `lib/normalize.ts` | Server rules in `server/src/modules/{products,categories,menu}` |
| Image upload | `POST /media/images` (`server/src/modules/media`) | Cloudinary env vars; `images.remotePatterns` in `client/next.config.ts` |
| Phone display and `tel:` links | `lib/phone.ts` | E.164 in data, local format on screen |

## Rules that must stay true

- **Sale:** `discountPrice` is the amount taken off (₱40 with ₱15 off sells for ₱25, ₱40 struck). On sale while `0 < discountPrice < price` and today ≤ `discountEndsAt`; it ends by itself the next day.
- **Out of stock:** still shown, dimmed, greyscale, last in its category; the sheet still opens. Never in Today's picks.
- **Picks:** up to 4, featured first, then available on-sale items; the section hides when empty.
- **Sort:** available first, then `sortOrder`. Empty categories and archived products are hidden. Missing images get a placeholder.
- **Dates are Manila days** (`manilaToday()` in `lib/pricing.ts`).
- Business name, tagline, phone and hero image are owner settings; never hardcode them.

## Important for changes

- **Data comes from the API.** `getMenuData()` / `getBusinessSettings()` in `data/menu-data.ts` call `GET /menu` through `api.ts` and `lib/normalize.ts`, cached with `"use cache"` (stale time and revalidate are both 5 minutes: a shorter stale time keeps it out of the static shell, tag `menu`). When the API is down `getMenuData()` returns `null`: `/menu` shows a message, Today's picks hides, and the chrome uses default settings.
- **No contact number, no Call button.** Settings default to an empty number until the owner saves one; the footer pill and the sheet's Call button are hidden while it is empty.
- **Images are Cloudinary only.** The server accepts only `https://res.cloudinary.com/...` URLs and the client treats any other host as a missing image, because `next/image` allows no other host.
- **Server rules** (see `docs/specs/2026-11-24-menu-api.md`): product discount < price; a sale end date needs a discount price and, when new or changed, is today or later (Manila); a category with products can't be deleted; reads are public, writes need the owner session.
- **Cache Components is on.** The shell prerenders; anything that depends on today (prices, picks, © year) renders per request inside `<Suspense>` after `await io()`. Keep date logic out of cached functions.
