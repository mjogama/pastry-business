# Dependencies that are not pre-installed

The template stays small on purpose. Add these per project when you need them.

## Database

- `mongoose` (MongoDB)
- `pg` (PostgreSQL), or an ORM such as `drizzle-orm` / `prisma`

After wiring a client, register a readiness check so `/ready` reflects it:

```ts
import { healthModule } from "@modules/health/health.module";

healthModule.service.register("database", () => db.ping());
```

and close the connection in the `shutdown` function in `src/app/server.ts`, before `process.exit`.

Then write a repository class that implements the feature's repository interface (see `src/modules/example/example.repository.ts`) and pass it to the module.

## Authentication

- `jsonwebtoken` (plus `@types/jsonwebtoken`)
- `cookie-parser` (plus `@types/cookie-parser`)
- `bcrypt` or `argon2` for password hashing

## Scaling

- `rate-limit-redis`: the default rate-limit store is per-process memory, so use a shared store when running more than one instance.

## Already covered, no package needed

- UUIDs: `crypto.randomUUID()` from `node:crypto`
- Async route errors: Express 5 forwards rejected promises to the error handler
- Watch mode: `npm run dev` uses `tsx watch`
