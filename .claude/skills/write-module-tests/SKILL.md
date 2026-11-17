---
name: write-module-tests
description: Write the Vitest + Supertest tests for one feature module in server/src/modules/<name>. Use when the user says "write tests for <module>", "test the <module> module", or runs /write-module-tests <module>. The user implements the module; this skill only writes tests.
argument-hint: <module-name>
---

# Write tests for a feature module

The user writes the module. You write its tests. You never edit anything under `server/src/`.

The module name is the argument (e.g. `auth` means `server/src/modules/auth/`). If no name is given, ask for it.

## 1. Read the module first

Read every file in `server/src/modules/<name>/`, and also:

- where it is mounted in `server/src/app/routes/v1/routes.ts` (gives the URL prefix)
- `server/src/shared/errors/AppError.ts` (which error maps to which status)
- `server/vitest.config.ts` (test env vars and aliases)
- one existing test, e.g. `server/tests/example.service.test.ts` and `server/tests/example.test.ts`, to match the style

The module may be unfinished, because the user is still writing it. Test what exists: the schemas, the repository interface, and the public method signatures are the contract. A method that is declared but not implemented yet still gets its tests. They will fail until the user finishes it. That is expected; say so in the report.

## 2. Write two test files

Both go in `server/tests/`. Never put tests inside `server/src/`.

### `tests/<name>.service.test.ts`: the service class alone

- Construct the service directly with the module's in-memory repository (or a hand-written fake that implements the repository interface) in `beforeEach`, so every test starts empty.
- One `it` per behaviour: the happy path of each public method, plus every `AppError` the method can throw (assert with `rejects.toBeInstanceOf(NotFoundError)` etc.).
- Assert on returned values, and that sensitive fields (e.g. `passwordHash`) are never returned.
- No HTTP, no Supertest here.

### `tests/<name>.test.ts`: the HTTP routes

- `const app = createApp();` from `@app/app`, and `request(app)` from `supertest`.
- For every route, test:
  - the success case: status code and the envelope `{ success: true, statusCode, message, data }`
  - each validation rule in the route's schemas: one bad `body`, `query` or `params` value per rule, expecting 400 and `details` containing the field `path`
  - each error status the service can produce through that route (404, 409, 401, ...), expecting `{ success: false, statusCode, status, message }`
  - routes behind an auth middleware: no token gives 401, and a bad token gives 401
- Module instances created at import keep in-memory state for the whole file. Use unique values per test (e.g. different emails or names) so tests do not collide, and do not depend on test order.

## 3. Rules

- Import with the aliases `@app/*`, `@modules/*`, `@shared/*`. Use `describe`, `it`, `expect`, `beforeEach` from `vitest`.
- Do not test what is already covered elsewhere: the global error handler, rate limiting, `/health`.
- Do not mock what you can construct. Mock only external services (email, payment, HTTP APIs) with `vi.mock` or a fake class.
- If the module needs a new env var (e.g. `JWT_SECRET`) and it is missing from `server/vitest.config.ts`, add a test-only value there. That is the one config file you may edit. Say so in the report.
- Never change `server/src/` to make a test pass. If a test fails because of what looks like a bug, keep the test and report it.

## 4. Run and report

Run `npm test -- <name>` from `server/`, then `npx tsc --noEmit`.

Report in this order, briefly:

1. The files written and the number of tests in each.
2. Failing tests, each with one line: either "not implemented yet" or "likely bug in src: <what and where>".
3. Behaviours you could not test and why (e.g. needs a real database).
