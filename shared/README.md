# shared

Types and interfaces used by both `server/` and `client/`. Imported as `@common/*` in both apps.

## Rules

- **Types only.** `interface`, `type`, and nothing that exists at runtime: no constants, functions, classes, enums or package imports. Both apps import from here with `import type`, which is removed at build time, so this folder never has to be bundled or installed.
- **One file per server module:** `shared/modules/<name>.ts` holds the entity, request bodies and query shapes for `server/src/modules/<name>/`.
- **The server proves it matches.** Each Zod schema in the module's `<name>.schema.ts` ends with `satisfies z.ZodType<Type>`, so the server will not typecheck if the schema and the shared type drift apart.

## New module

1. Write `shared/modules/<name>.ts`.
2. Server: build the Zod schemas in `<name>.schema.ts` and add `satisfies z.ZodType<...>` to each.
3. Client: `import type { ... } from "@common/modules/<name>"` and pass the types to `api.get<...>()` / `api.post<...>()`.
