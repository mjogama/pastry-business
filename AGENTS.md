# Agent guide

Read this instead of exploring the repo. It maps every part you normally need. Open other files only for the task at hand.

## Layout

```
.                          root: npm, runs both apps
├── server/                Express 5 + TypeScript API (npm, Node ≥ 22)
│   ├── src/app/           wiring only, plain functions
│   │   ├── server.ts      entrypoint: listen, graceful shutdown
│   │   ├── app.ts         createApp(): middleware order, mounts routes
│   │   ├── config/env.ts  Zod-validated env (read config via `env`, never process.env)
│   │   ├── middlewares/   requestLogger, rateLimit, notFoundHandler, globalErrorHandler
│   │   └── routes/v1/routes.ts   mounts each module: v1Router.use("/x", new XModule().router)
│   ├── src/shared/        reusable helpers, imported as @shared/*
│   │   ├── errors/AppError.ts    AppError, BadRequestError, NotFoundError, ConflictError, ...
│   │   ├── http/response.ts      sendSuccess(res, { statusCode?, message?, data })
│   │   ├── middlewares/validate.ts   validate({ body?, query?, params? }), ValidatedRequest<S>
│   │   ├── logger.ts             pino logger (use req.log inside requests)
│   │   ├── http/BaseController.ts, http/BaseRouter.ts, database/   optional OOP bases, not used yet
│   ├── src/modules/<name>/    one folder per feature, classes (see "Server module")
│   │   ├── example/           reference module to copy
│   │   └── health/            /health and /ready
│   ├── tests/             Vitest + Supertest, outside src/
│   └── docs/DEPENDENCIES.md   packages deliberately not installed (DB, auth)
├── client/                Next.js 16 App Router + Tailwind 4 (pnpm), functional only
│   ├── app/               routes: layout.tsx, page.tsx
│   ├── components/        shared UI (api-status.tsx)
│   ├── features/<name>/   client side of a server module (create when needed)
│   └── lib/
│       ├── env.ts         Zod-validated env (SERVER_API, inlined via next.config.ts)
│       └── api/client.ts  api.get/post/put/patch/delete, isApiError
├── shared/                types only, imported as @common/* by both apps
│   ├── http.ts            response envelope types
│   └── modules/<name>.ts  one contract file per server module
├── scripts/               new-module.mjs, remove-module.mjs (share module-names.mjs)
└── .claude/skills/        /write-module-tests, /sort-imports, /clean-comments, /commit
```

## Commands

From the root: `npm run setup` (install both), `npm run dev` (run both), `npm run check` (typecheck, lint, server tests for both), `npm run imports` (fix import order in `server/src/`; `imports:check` reports only), `npm run comments:clean` (remove comments on lines added since HEAD; `-- --check` lists only), `npm run module:create -- <name>` (scaffold steps 1–3 below from `scripts/new-module.mjs`; singular name, route is the kebab plural), `npm run module:remove -- <name> [--yes]` (deletes the module, its shared file, tests and client feature, and unmounts it; agents must pass `--yes` since there's no terminal to confirm in, and only when the user asked for the removal).

Per app: `server/` uses `npm run <script>`, `client/` uses `pnpm <script>`. Server: `dev`, `build`, `start`, `typecheck`, `lint`, `format`, `test`, `check`. Client: `dev`, `build`, `start`, `typecheck`, `lint`, `format`, `check`.

## Adding a feature (e.g. `auth`)

1. `shared/modules/auth.ts`: entity, request bodies, query types. Types only.
2. `server/src/modules/auth/`, copied from `example/`:
   - `auth.schema.ts`: Zod schemas per route, each ending `satisfies z.ZodType<SharedType>`
   - `auth.repository.ts`: interface + in-memory class
   - `auth.service.ts`: business rules, throws `AppError` subclasses, no req/res
   - `auth.controller.ts`: arrow-property handlers (`create = async (req, res) => {}`) calling `sendSuccess`
   - `auth.routes.ts`: `this.router.post("/", validate(schemas), controller.create)`
   - `auth.module.ts`: builds repository → service → controller → router, exposes `router`
3. Mount in `server/src/app/routes/v1/routes.ts`.
4. Tests in `server/tests/` (or run `/write-module-tests auth`).
5. Client: `client/features/auth/`, calling `api.*<SharedType>(...)` with types from `@common/modules/auth`.

## Rules

- **Server:** OOP only inside `src/modules/`; everything else is plain functions. Throw errors, never `try/catch` in controllers (Express 5 forwards them). Never send a response except through `sendSuccess`; errors are formatted only by `globalErrorHandler`.
- **Client:** no classes. Call the server only through `lib/api/client.ts`. Before writing client code, read `client/AGENTS.md`: this Next.js version differs from training data.
- **shared/:** types only, no runtime values or package imports, and import it with `import type`. See `shared/README.md`.
- **Env vars:** add to `server/src/app/config/env.ts` or `client/lib/env.ts`, plus the matching `.env.example`; test values go in `server/vitest.config.ts`.
- **Response envelope:** `{ success: true, statusCode, message, data }` or `{ success: false, statusCode, status, message, details?, requestId? }`.
- **Imports:** in `server/src/`, packages first, a blank line, then project files, each group shortest line to longest. Elsewhere Biome sorts them.
- **Done means** `npm run check` passes from the root.
