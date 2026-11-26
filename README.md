# Pato's Pâtisserie

The website and back-office tools for Pato's Pâtisserie, a small bakery and café in the Philippines.

The site has two jobs:

- **For customers:** show what the bakery sells today, what it costs, what's on sale, and how to call to order. There's no cart or online checkout. Customers browse the menu and phone the bakery.
- **For the owner:** run the business day to day. They can edit the menu, keep recipes, log each day's sales and see how the business is doing.

## What's in it

### Public pages

| Page | Path | What customers see |
| --- | --- | --- |
| **Landing** | `/` | The bakery's name, tagline and hero photo, **Today's picks** (up to 4 featured or on-sale items), and a tap-to-call button |
| **Menu** | `/menu` | Every product grouped by category, with photo, price, sale price and availability. Tapping a product opens a detail sheet with a Call button |

How the menu works:

- **Sales** are an amount off the price (₱40 with ₱15 off sells for ₱25). A sale ends on its own after its end date.
- **Out-of-stock** items stay on the menu, dimmed and listed last in their category.
- All dates use Manila time.

### Owner tools (login required)

The owner signs in at `/sc/auth/login`. Everything below is also available in one place in the **CMS** at `/cms`.

| Tool | Path | What it's for |
| --- | --- | --- |
| **CMS** | `/cms` | Edit the Landing page and Menu: add, edit, archive or delete products, upload photos, set prices and discounts, mark items out of stock, choose Today's picks. Changes show on the public site right away |
| **Sales Tracker** | `/sales-tracker` | A month calendar for logging each sale (time, title, products, price and quantity). Days with sales show the day's total, and the month's revenue is shown at the top |
| **Progress** | `/progress` | Charts built from the Sales Tracker: revenue and its change against the previous period, revenue per day/week/month, pace against the previous period, top products and best weekdays. Ranges: 7 days, 30 days, 90 days or 12 months |
| **Recipe Book** | `/recipes` | The bakery's recipes as a swipeable stack of cards, each with ingredients, steps, temperature, time and yield. A multiplier (×1–×6) scales the amounts for bigger batches |

Every page has a light theme (Butter Yellow, the default) and a dark theme (Dark Roast).

## How it's built

| Folder | What it is |
| --- | --- |
| `client/` | Next.js 16 + Tailwind 4 web app (pnpm). Deployed on Vercel |
| `server/` | Express 5 API with Prisma, on Postgres (Neon, Singapore). Deployed on Railway |
| `shared/` | TypeScript types used by both apps, so each API contract is written once |
| `docs/` | Design specs (`*_V1.md`), feature specs (`specs/`) and how each page works (`architecture/`) |

Product photos are stored on Cloudinary. Owner sessions use httpOnly JWT cookies.

## Running it locally

Requires Node 22+, npm and pnpm.

```bash
npm run setup                            # install server and client
cp server/.env.example server/.env       # DATABASE_URL, JWT secrets, Cloudinary keys
cp client/.env.example client/.env.local # SERVER_API (default http://localhost:8001/api/v1)
npm run server:migrate                   # apply database migrations
npm run dev                              # start API and web together
```

Open http://localhost:3000. Owner accounts are rows in the `users` table (see [docs/architecture/auth.md](docs/architecture/auth.md)).

## Commands

| Command | What it does |
| --- | --- |
| `npm run setup` | Install dependencies for both apps |
| `npm run dev` | Run server and client together; Ctrl+C stops both |
| `npm run check` | Typecheck and lint both apps and run the server tests. A change is done when this passes |
| `npm run server:migrate` | Apply Prisma migrations |
| `npm run imports` | Fix the import order in `server/src/` (`imports:check` only reports) |
| `npm run module:create -- <name>` | Scaffold a server module and its shared types, and mount it |
| `npm run module:remove -- <name>` | Delete a module and unmount it (asks first; `--yes` skips) |

## Contributing

- New features start with a spec in `docs/specs/` (copy `_TEMPLATE.md`). The steps for adding a feature are in [docs/architecture/conventions.md](docs/architecture/conventions.md).
- Each page has an architecture doc in `docs/architecture/` with a **Where to change what** table.
- [AGENTS.md](AGENTS.md) maps the repo for AI coding agents. Claude Code loads it through `CLAUDE.md`. Project skills in `.claude/skills/`: `/commit`, `/write-module-tests <module>`, `/sort-imports`, `/clean-comments`.
