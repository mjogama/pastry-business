# Backend Node + Express + TypeScript Starter

Reusable Express 5 + TypeScript backend template, structured as a **modular monolith** with class-based (OOP) feature modules. Everything outside `src/modules/` is plain functions. Copy it as the starting point for a new backend instead of re-wiring the same baseline every time.

What you get out of the box:

- Security and transport: Helmet, CORS (multiple origins), rate limiting, compression, body size limit
- Zod-validated environment variables with a readable error on boot
- Zod request validation (`validate()`) with typed handlers
- One response envelope for success and errors, and a central error handler that never leaks internals
- Structured logging (pino) with a request id on every request
- Health and readiness endpoints, graceful shutdown
- Tests (Vitest + Supertest), lint and format (Biome), Dockerfile

Deliberately **not** pre-installed (database driver, auth packages): see [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md).

## Getting started

```bash
npm install
cp .env.example .env   # fill in DB_URI and BASE_URL
npm run dev
```

Requires Node 22 or newer (`.nvmrc` pins 24).

### npm scripts

| Script               | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `npm run dev`        | Run from source with reload (`tsx watch`), pretty logs   |
| `npm run build`      | Bundle to `dist/server.js` with tsup                     |
| `npm start`          | Run the built bundle with Node (production)              |
| `npm run typecheck`  | `tsc --noEmit`                                           |
| `npm run lint`       | Biome lint + format check                                |
| `npm run format`     | Biome lint fixes + format, written to disk               |
| `npm test`           | Run the test suite once (`npm run test:watch` to watch)  |
| `npm run check`      | typecheck + lint + test in one command                   |

### Environment variables

Validated at boot by [`src/app/config/env.ts`](src/app/config/env.ts). If anything is missing or invalid, the process prints which variable and why, then exits.

| Variable               | Required | Default       | Purpose                                                           |
| ---------------------- | -------- | ------------- | ----------------------------------------------------------------- |
| `DB_URI`               | yes      |               | Database connection string (wire up your driver)                  |
| `BASE_URL`             | yes      |               | Allowed CORS origin(s), comma-separated URLs                      |
| `NODE_ENV`             | no       | `development` | `development`, `test` or `production`                             |
| `HOST`                 | no       | `0.0.0.0`     | Interface to bind                                                 |
| `PORT`                 | no       | `8001`        | Port to listen on                                                 |
| `TRUST_PROXY`          | no       | `false`       | Express `trust proxy`. Set it (e.g. `1`) behind a load balancer   |
| `LOG_LEVEL`            | no       | by `NODE_ENV` | `debug` in development, `info` in production, `silent` in tests   |
| `BODY_LIMIT`           | no       | `100kb`       | Max JSON / urlencoded body size                                   |
| `RATE_LIMIT_WINDOW_MS` | no       | `900000`      | Rate-limit window                                                 |
| `RATE_LIMIT_MAX`       | no       | `100`         | Requests allowed per IP per window                                |

To add a variable, add it to the schema in `env.ts` and to `.env.example`. Always read config through `env`, never `process.env`.

## Folder structure

```
server/
├── Dockerfile
├── biome.json                  # lint + format
├── tsup.config.ts              # production bundle
├── vitest.config.ts            # tests (sets its own env, never reads .env)
├── tsconfig.json               # path aliases: @app/*, @modules/*, @shared/*
├── docs/DEPENDENCIES.md        # packages intentionally not pre-installed
├── tests/                      # Supertest tests against createApp()
└── src/
    ├── app/                    # application shell: wiring only, no business logic
    │   ├── server.ts           # entrypoint: listen, graceful shutdown, process handlers
    │   ├── app.ts              # createApp(): middleware pipeline
    │   ├── config/env.ts       # Zod-validated environment
    │   ├── middlewares/        # requestLogger, rateLimit, notFoundHandler, globalErrorHandler
    │   └── routes/             # registerRoutes(app) -> /api/v1 -> feature routers
    ├── shared/                 # reusable building blocks, imported by app/ and modules/
    │   ├── errors/AppError.ts  # AppError + NotFoundError, ConflictError, ...
    │   ├── http/response.ts    # sendSuccess() and the response envelope types
    │   ├── middlewares/validate.ts
    │   └── logger.ts
    └── modules/                # one folder per business capability
        ├── health/             # /health and /ready
        └── example/            # reference module: copy it, then delete it
            ├── example.schema.ts      # Zod schemas + types
            ├── example.repository.ts  # ExampleRepository interface + implementation
            ├── example.service.ts     # ExampleService: business rules
            ├── example.controller.ts  # ExampleController: HTTP <-> service
            ├── example.routes.ts      # ExampleRouter: paths + validation
            └── example.module.ts      # ExampleModule: wires the classes together
```

Dependency rule: `modules/` may import from `shared/`; `app/` may import from both; `shared/` never imports from `modules/` (it only reads `app/config/env`); modules do not import each other's internals. That keeps a feature movable.

## Request lifecycle

`createApp()` in [`src/app/app.ts`](src/app/app.ts) wires middleware in this order:

1. `requestLogger`: assigns `req.id` (reuses an incoming `X-Request-Id`), logs one line per request
2. `helmet()`: security headers
3. `cors()`: origins from `BASE_URL`
4. `/health`, `/ready`: mounted before the rate limiter so probes are never limited
5. rate limiter: before body parsing, so rejected requests cost nothing to parse
6. `express.json()` / `express.urlencoded()`: limited to `BODY_LIMIT`
7. `compression()`
8. `registerRoutes(app)`: `/api/v1/...`
9. `notFoundHandler`: 404 for unmatched routes
10. `globalErrorHandler`: **must stay last**

## Response shape

Success, via `sendSuccess(res, { statusCode?, message?, data })`:

```json
{ "success": true, "statusCode": 201, "message": "Example created", "data": { "id": "..." } }
```

Error, produced only by `globalErrorHandler`:

```json
{
  "success": false,
  "statusCode": 400,
  "status": "Bad Request",
  "message": "Validation failed",
  "details": [{ "path": "name", "message": "Invalid input: expected string, received undefined" }],
  "requestId": "114b015b-4563-4eff-8d38-76fe5ed41513"
}
```

## Errors

Throw from anywhere (controller, service, async or not). Express 5 forwards it to the error handler, so no `try/catch` or async wrapper is needed.

```ts
import { ConflictError, NotFoundError } from "@shared/errors/AppError";

if (!user) throw new NotFoundError("User not found");
if (taken) throw new ConflictError("Email already in use", { field: "email" });
```

What the client sees:

| Thrown                                   | Response                                              |
| ---------------------------------------- | ----------------------------------------------------- |
| `AppError` or a subclass                 | Its status code, message and `details`                |
| `ZodError`                               | 400 `Validation failed` with per-field `details`      |
| Express client errors (bad JSON, too big)| Their 4xx status and message                          |
| Mongoose `ValidationError` / `CastError` | 400                                                   |
| Anything else                            | 500 `Internal server error`; the real error is logged |

Only `AppError` messages reach the client, so use it for anything the user should read.

## Adding a feature module

Every feature is a set of small classes, each with one job. Dependencies go in through the constructor, so nothing reaches for a global and every class can be tested alone.

```
Router -> Controller -> Service -> Repository
```

First write the feature's types in `../shared/modules/<feature>.ts` (see `../shared/README.md`); client and server both use them. Then copy `src/modules/example/` and rename it:

| File                      | Class                              | Job                                                                 |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| `<feature>.schema.ts`     | (none)                             | Zod schemas per route, each ending `satisfies z.ZodType<SharedType>` |
| `<feature>.repository.ts` | `UserRepository` (interface) + impl | Data access only                                                     |
| `<feature>.service.ts`    | `UserService`                      | Business rules. No `req`/`res`; throws `AppError`s                   |
| `<feature>.controller.ts` | `UserController`                   | Reads the validated request, calls the service, sends the response   |
| `<feature>.routes.ts`     | `UserRouter`                       | Pairs each path with `validate(schemas)` and a controller method     |
| `<feature>.module.ts`     | `UserModule`                       | Builds the classes and exposes `router`                              |

```ts
// users.service.ts
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async getById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return user;
  }
}

// users.controller.ts
export class UserController {
  constructor(private readonly service: UserService) {}

  // Arrow property, not a method: keeps `this` when the router calls it.
  getById = async (req: ValidatedRequest<typeof getUserSchemas>, res: Response) => {
    const user = await this.service.getById(req.params.id);
    sendSuccess(res, { message: "User retrieved", data: user });
  };
}
```

Then mount it in [`src/app/routes/v1/routes.ts`](src/app/routes/v1/routes.ts) and add tests in `tests/`:

```ts
v1Router.use("/users", new UserModule().router);
```

Swapping storage means writing one class that implements the feature's repository interface and passing it in: `new UserModule({ repository: new MongoUserRepository() })`. The service and controller do not change.

## Logging

Use `req.log` inside a request (it carries the request id) and `logger` from `@shared/logger` elsewhere. `console.*` is flagged by the linter.

```ts
req.log.info({ userId }, "User created");
```

Output is pretty-printed in development and JSON lines in production. `Authorization` and `Cookie` headers are redacted.

## Health checks and shutdown

- `GET /health`: liveness. The process is up.
- `GET /ready`: readiness. Runs every check registered with `healthModule.service.register(name, fn)` and returns 503 if one fails. Register your database there.

On `SIGTERM` / `SIGINT` the server stops accepting connections, lets in-flight requests finish (10 s limit) and exits. Close database connections in the `shutdown` function in `src/app/server.ts`, before `process.exit`.

## Production

```bash
npm run build && npm start
# or
docker build -t my-api .
docker run --env-file .env -p 8001:8001 my-api
```

Before going live:

- Set `TRUST_PROXY` if you are behind a load balancer, otherwise every client shares one rate-limit bucket.
- The rate-limit store is in-memory per process. Use a shared store (see `docs/DEPENDENCIES.md`) when running several instances.

## Using this template for a new project

1. Copy the repo and set `name` in `package.json`.
2. Delete `src/modules/example/`, its mount in `routes/v1/routes.ts`, `tests/example.test.ts` and `tests/example.service.test.ts`.
3. Install your database driver, add its readiness check and shutdown hook.
