# AGENTS.md

Guidance for AI agents working in this repository.

## Project Overview

Pato's Pâtisserie: a bakery's website and owner tools. Next.js 16 + Tailwind 4 in `client/` (pnpm), Express 5 API in `server/` (npm), shared TypeScript contracts in `shared/`, Postgres on Neon through Prisma. Pages: public **Landing** `/` and **Menu** `/menu` (with pre-orders); owner **Sales Tracker** `/sales-tracker`, **Progress** `/progress` and **Recipe Book** `/recipes`. One theme with light (default) and dark modes. Original design specs are in `docs/*_V1.md`; new features get a spec in `docs/specs/`.

## Commands

Needs Node ≥ 22, npm and pnpm. Copy `server/.env.example` to `server/.env` before running the API or migrating.

```bash
npm run setup            # install both apps
npm run dev              # API and web
npm run check            # typecheck + lint both, server tests; "done" means this passes
npm run server:migrate   # apply Prisma migrations
(cd server && npx vitest run tests/recipes.test.ts -t "name")   # one server test
npm run module:create -- <name>         # scaffold a server module
npm run module:remove -- <name> --yes   # only when the user asked
```

## Rules by area

Always loaded:

- Conventions: code rules, safety rules, adding a feature, specs. @docs/architecture/conventions.md
- Theme: light and dark colors, tokens, `text-honey`, shadows. @docs/architecture/theme.md

Loaded when you open files in that folder (each folder's `CLAUDE.md` imports its story). Agents without `CLAUDE.md` support: read the story before changing that area. Each has a **Where to change what** table.

| Area | Folder | Story |
| --- | --- | --- |
| Recipe Book `/recipes` | `client/features/recipes/` | `docs/architecture/recipes.md` |
| Menu `/menu` and Landing `/` | `client/features/menu/` | `docs/architecture/menu.md` |
| Pre-orders (bag on `/menu`, `/cms/pre-orders`) | `client/features/pre-orders/` | `docs/architecture/pre-orders.md` |
| Sales Tracker `/sales-tracker` | `client/features/sales-tracker/` | `docs/architecture/sales-tracker.md` |
| Progress `/progress` | `client/features/progress/` | `docs/architecture/progress.md` |
| CMS `/cms` | `client/features/admin/` | `docs/architecture/admin.md` |
| Owner login `/sc/auth/login` | `client/features/auth/` | `docs/architecture/auth.md` |
| Server, layout, request path, deployment | `server/` | `docs/architecture/system.md` |
