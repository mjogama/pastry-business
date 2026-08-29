# Backend Node + Express + TypeScript Starter

Reusable Express 5 + TypeScript backend template, structured as a **Modular Monolith**. Clone/copy this as the starting point for a new backend instead of re-installing and re-wiring the same baseline (Helmet, CORS, rate limiting, compression, logging, Zod env validation, centralized error/response handling, path aliases) every time.

Deliberately **not** pre-installed — add per-project as needed, see [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md): database driver (Mongoose/pg), request validators, cookie-parser, jsonwebtoken, nodemon.

## Getting Started

```bash
npm install
cp .env.example .env   # fill in real values
npm run dev             # tsx watch mode
```

### Environment variables

Validated at boot by [`src/app/config/env.ts`](src/app/config/env.ts) via Zod — the process fails fast with a clear error if any are missing/invalid.

| Variable   | Purpose                                          |
| ---------- | ------------------------------------------------ |
| `PORT`     | Port the HTTP server listens on                  |
| `DB_URI`   | Database connection string (wire up your driver) |
| `BASE_URL` | Allowed CORS origin                              |

### npm scripts

| Script          | Command                       | Purpose                                     |
| --------------- | ----------------------------- | ------------------------------------------- |
| `npm run dev`   | `tsx watch src/app/server.ts` | Local development with hot reload           |
| `npm start`     | `tsx src/app/server.ts`       | Run without watch mode                      |
| `npm run prod`  | `tsx src/app/server.ts`       | Run in production (executes TS directly)    |
| `npm run build` | `tsc --noEmit`                | Type-check only — does **not** emit `dist/` |

`tsx` executes TypeScript directly, so there is no compiled `dist/` artifact required to run the app. `dist/` is git-ignored; if you need real compiled output for deployment, change `build` to `tsc` (remove `--noEmit`) or add a bundler step.

## Request Lifecycle / Procedure

`src/app/app.ts` wires middleware in this exact order — order matters in Express:

1. `helmet()` — security headers
2. `cors()` — origin restricted to `env.BASE_URL`
3. `express.json()` / `express.urlencoded()` — body parsing (10mb limit)
4. `compression()` — gzip responses
5. `morgan("dev")` — request logging
6. `limiter` — rate limiting (100 req / 15 min per IP)
7. `registerRoutes(app)` — mounts versioned API routers (`/api/v1/...`)
8. `errorPathHandler` — catch-all 404 for unmatched routes
9. `globalErrorHandler` — centralized error formatter (**must stay last**)

Route handlers throw/forward errors with `createAppError(message, statusCode)` or `errorHandler(message, statusCode)` from [`src/modules/utils/errorHandler.ts`](src/modules/utils/errorHandler.ts); `globalErrorHandler` turns them into a consistent JSON shape:

```json
{ "status": "Bad request", "statusCode": 400, "errMessage": "..." }
```

Successful responses use `responseHandler(res, statusCode, message, data)` from [`src/modules/utils/responseHandler.ts`](src/modules/utils/responseHandler.ts) for a consistent shape:

```json
{ "status": "OK", "statusCode": 200, "message": "...", "data": {} }
```

### Adding a new route/module

1. Create a folder under `src/modules/<feature>/` (routes, controller, service, etc.).
2. Export a `Router` from it.
3. Mount it in [`src/app/routes/v1/routes.ts`](src/app/routes/v1/routes.ts) (or a new version folder under `src/app/routes/`).
4. `src/app/routes/index.ts` → `registerRoutes` already wires `/api/v1` for you.

## Folder Structure (Modular Monolith)

```
server/
├── .env / .env.example        # environment config (never commit real .env)
├── package.json
├── tsconfig.json               # path aliases: @app/*, @modules/*
├── docs/
│   └── DEPENDENCIES.md         # deps intentionally NOT pre-installed
└── src/
    ├── app/                     # application shell — framework wiring, not business logic
    │   ├── app.ts               # Express instance + middleware pipeline
    │   ├── server.ts            # process entrypoint, starts the HTTP listener
    │   ├── config/
    │   │   └── env.ts           # Zod-validated environment variables
    │   ├── constants/
    │   │   └── STATUS_CODE.ts   # HTTP status code → title lookup
    │   ├── middlewares/
    │   │   ├── errorPathHandler.ts    # 404 catch-all
    │   │   ├── globalErrorHandler.ts  # centralized error → JSON response
    │   │   └── rateLimit.ts           # express-rate-limit config
    │   ├── routes/
    │   │   ├── index.ts         # registerRoutes(app) — mounts versioned routers
    │   │   └── v1/
    │   │       └── routes.ts    # /api/v1 router (add feature routers here)
    │   └── types/
    │       └── StatusCode.ts    # shared TS types for status codes
    └── modules/                 # business/domain modules (the "monolith" bulk)
        ├── index.ts             # barrel for feature modules
        ├── helpers/             # use for application logic
        └── utils/
            ├── errorHandler.ts     # AppError class, createAppError/errorHandler
            └── responseHandler.ts  # standard success response shape
```

**Modular Monolith convention:** `src/app/` stays framework plumbing only (server bootstrapping, global middleware, routing table). Each business capability gets its own folder under `src/modules/<feature>/` with its own routes/controllers/services, imported into `src/app/routes/`. This keeps features independently movable (e.g. extractable into microservices later) while running as a single deployable process today.

Path aliases (`tsconfig.json`): use `@app/*` and `@modules/*` instead of long relative imports (e.g. `import { env } from "@app/config/env"`).

## Ecosystem Validation — Findings Fixed Before Push

I ran the app end-to-end (`npx tsc --noEmit`, boot the server, curl real endpoints) and found the following bugs, now fixed in this session:

1. **Routes were never mounted (critical).** `app.ts` never called `registerRoutes(app)`, so `/api/v1/status` — and any future route — was unreachable; every request 404'd. Fixed by wiring `registerRoutes(app)` into the middleware pipeline.
2. **Error handlers were registered before routes, and in reversed order (critical).** `globalErrorHandler` (which needs to be _last_) was added before `errorPathHandler`, and both were registered ahead of any routes. Since Express resolves error middleware based on registration order, thrown errors skipped `globalErrorHandler` entirely and fell through to Express's default HTML error page instead of the app's JSON error format. Fixed order is now: routes → `errorPathHandler` (404) → `globalErrorHandler` (last).
3. **`cors()` origin referenced an unvalidated env var.** `origin: process.env.BASE_URL` read directly from `process.env` (bypassing the Zod-validated `env` object) and `BASE_URL` wasn't even declared in the schema or `.env`/`.env.example`, so CORS was silently misconfigured. Added `BASE_URL` to the Zod schema and both env files, and switched `app.ts` to use `env.BASE_URL`.
4. **`.gitignore` didn't actually ignore macOS `.DS_Store` files.** It listed `DS_Store` (no leading dot), which doesn't match the real filename `.DS_Store`. Fixed, and also added `dist/` since build output shouldn't be committed for this run-via-`tsx` setup.
5. **Unused duplicate dependency `express-rate-limiter`** (distinct from the actually-used `express-rate-limit`) was installed and listed in `package.json` with no references in source. Removed via `npm uninstall`.

Verified after fixes: `tsc --noEmit` passes clean, `GET /api/v1/status` returns `200` with the expected JSON body, and an unmatched route returns a proper `404` JSON error (not Express's default HTML page).

### Still worth deciding before reuse

- `npm run build` only type-checks (`tsc --noEmit`); there's no real compiled-output pipeline. Fine for `tsx`-based deploys, but decide explicitly if a target environment needs a compiled `dist/` instead.
- `DB_URI` is validated but no database client is wired up yet — intentional per `docs/DEPENDENCIES.md` (Mongoose/pg are opt-in per project).
- `bcrypt`, `uuid`, `express-async-handler` are pre-installed but currently unused in source — intentional for a reusable starter, just be aware they add install weight to every clone.
