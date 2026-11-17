# fullstack-starter-express-next

A starting point for full-stack TypeScript projects: an Express 5 API, a Next.js 16 client, and one folder of types both of them share.

| Folder    | What it is                                                     | Docs                                   |
| --------- | -------------------------------------------------------------- | -------------------------------------- |
| `server/` | Express 5 API: validation, errors, logging, tests, Docker      | [server/README.md](server/README.md)   |
| `client/` | Next.js 16 App Router + Tailwind 4 with a typed API client     | [client/README.md](client/README.md)   |
| `shared/` | Types used by both apps, so a module's contract is written once | [shared/README.md](shared/README.md)   |

## Getting started

Requires Node 22+, npm and pnpm.

```bash
npm run setup                          # install server and client
cp server/.env.example server/.env     # fill in DB_URI and BASE_URL
cp client/.env.example client/.env.local
npm run dev                            # start both
```

Open http://localhost:3000. The page shows **API connected** when the client can reach the server.

## Commands

| Command         | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `npm run setup` | Install dependencies for both apps                    |
| `npm run dev`   | Run server and client together; Ctrl+C stops both     |
| `npm run check` | Typecheck and lint both apps, and run the server tests |
| `npm run imports` | Fix the import order in `server/src/` (`imports:check` only reports) |

## Adding a feature

1. Write its types in `shared/modules/<name>.ts`.
2. Build the server module in `server/src/modules/<name>/` by copying `example/`, and mount it in `server/src/app/routes/v1/routes.ts`.
3. Build the client side in `client/features/<name>/`, using the same shared types.

Step-by-step detail is in [AGENTS.md](AGENTS.md) and the server README.

## Starting a new project from this template

1. Copy the repo and rename it; update `name` in the root, server and client `package.json` files.
2. Delete the `example` module: `server/src/modules/example/`, its mount in `server/src/app/routes/v1/routes.ts`, `server/tests/example*.test.ts`, and `shared/modules/example.ts`.
3. Install a database driver: see [server/docs/DEPENDENCIES.md](server/docs/DEPENDENCIES.md).

## Working with AI agents

[AGENTS.md](AGENTS.md) maps the repo for coding agents so they don't spend time and tokens exploring it. Claude Code loads it automatically through `CLAUDE.md`. Keep it updated when the structure changes.

Claude Code skills in `.claude/skills/`:

- `/write-module-tests <module>`: writes the tests for a server module
- `/sort-imports`: orders imports in `server/src/`
- `/commit`: reviews staged changes and commits
