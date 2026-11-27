# CMS `/cms`

The owner's editor. Every page under `/cms` is drawn with the public page's own components and tokens, with controls added, so the owner edits what customers see. Behind the owner login (`docs/architecture/auth.md`). Spec: `docs/specs/2026-11-24-cms.md`.

| Route | What it shows | Editing |
| --- | --- | --- |
| `/cms` | Redirects to `/cms/menu` | |
| `/cms/landing` | The Landing hero and Today's picks | Add to, remove from and edit picks (products) |
| `/cms/menu` | The Menu page: categories and product cards | Add, edit, archive, delete products; optional sizes; availability switch (on a product with sizes it sets every size); filters and search |
| `/cms/pre-orders` | Pre-orders from `/menu` (`docs/architecture/pre-orders.md`) | Open/close pre-orders; bake list per day; confirm, hand over, cancel, delete |
| `/cms/recipes` | The Recipe Book, unchanged | Its own add, edit, delete |
| `/cms/sales-tracker` | The Sales Tracker, unchanged | Its own add, edit, delete |
| `/cms/progress` | The Progress page (charts of the Sales Tracker), unchanged | Read only |

## How it works

- `app/cms/layout.tsx`: theme wrapper, `RequireAuth`, and `AdminShell`: a sidebar with the six pages, a slim top bar (phones only) with the menu button and page title. From 900px the sidebar is a rail with "Pato’s CMS" at the top left with the round open/close button at its right (it slides to the middle of the rail when collapsed), and the theme switch above "View site"; it opens and closes (remembered in this browser, key `pato.admin.sidebar.collapsed`); below that it is a drawer from the left.
- The menu pages load through `AdminMenuLoader` / `AdminLandingLoader` (`connection()`, then `getAdminMenu()` in `features/admin/api.ts`): straight from the API, archived products included, never the public 5-minute cache.
- `useProducts()` holds the list and the dialogs (form, delete confirm). Every save calls the API, updates state, then calls the `refreshPublicMenu` server action, which expires the `menu` cache tag so `/` and `/menu` update at once.
- Cards are the public ones (`ProductCardContent`, `PickCardContent`, `LandingHero` in `features/menu/components/`) so a design change shows in both places.
- Images upload to Cloudinary through `POST /media/images` (axios, `authClient.upload`); the product form previews them in the 4:3 card.

## Where to change what

| To change | Edit |
| --- | --- |
| CMS pages in the sidebar (each row also has an arrow link to the public page it edits: `live`) | `PAGES` in `features/admin/components/admin-shell.tsx` |
| Menu list, filters, card controls | `features/admin/components/admin-menu.tsx` |
| Landing picks controls | `features/admin/components/admin-landing.tsx` |
| Product form and its checks, Sizes section (`SizesEditor`) | `features/admin/components/product-form-dialog.tsx` (the server's rules in `server/src/modules/products` are final) |
| Save, delete, cache refresh | `features/admin/components/use-products.tsx`, `features/admin/actions.ts` |
| API calls | `features/admin/api.ts` |

## Not built yet

Business settings (name, tagline, phone, hero image), renaming, reordering and deleting categories (a category can only be created inline from the product form), drag-to-reorder products (use the product's sort order via the API).
