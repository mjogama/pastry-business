# Full-stack template

- `server/`: Express 5 + TypeScript API (npm). Details: `server/README.md`.
- `shared/`: types only, used by both apps as `@common/*`. Rules: `shared/README.md`.
- `client/`: Next.js 16 App Router + Tailwind 4 (pnpm). Before writing client code, read `client/AGENTS.md`: this Next.js version differs from training data.

## Commands (repo root)

- `npm run setup`: install both apps
- `npm run dev`: run server and client together
- `npm run check`: typecheck + lint (+ server tests) for both

## Conventions

- New feature: write its types in `shared/modules/<name>.ts` first. The server's Zod schemas end with `satisfies z.ZodType<Type>`; the client imports the same types.
- Server feature code lives in `server/src/modules/<name>/` as classes: schema, repository, service, controller, routes, module.
- Server responses use one envelope: `{ success, statusCode, message, data }` or `{ success: false, statusCode, status, message, details?, requestId? }`.
- The client is functional only (components, hooks, plain functions); do not write classes there. OOP is a server-only convention.
- The client calls the server only through `client/lib/api/client.ts` (`api.get/post/...`), which returns `data` or throws an `ApiError` (check with `isApiError`). Envelope types live in `shared/http.ts`.
- Env vars are validated with Zod: `server/src/app/config/env.ts` and `client/lib/env.ts`. Add new ones there and to the matching `.env.example`.
- Imports in `server/src/` are ordered by `/sort-imports`; everything else uses Biome's default order.

## Skills

`/write-module-tests <module>`, `/sort-imports`, `/commit`.
