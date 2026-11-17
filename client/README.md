# Client: Next.js 16 + Tailwind 4

## Getting started

```bash
pnpm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at the server
pnpm dev
```

Or run it together with the server from the repo root: `npm run dev`.

The home page shows **API connected** when the server answers, so you can tell at a glance whether the backend is up.

## Scripts

| Script           | Purpose                                    |
| ---------------- | ------------------------------------------ |
| `pnpm dev`       | Dev server on http://localhost:3000        |
| `pnpm build`     | Production build                           |
| `pnpm start`     | Run the production build                   |
| `pnpm typecheck` | `tsc --noEmit`                             |
| `pnpm lint`      | Biome lint + format check                  |
| `pnpm format`    | Biome fixes + format, written to disk      |
| `pnpm check`     | typecheck + lint                           |

## Environment variables

Validated in [`lib/env.ts`](lib/env.ts); an invalid value stops the app with a message saying which one.

| Variable              | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Server API base URL including the version, e.g. `http://localhost:8001/api/v1` |

`NEXT_PUBLIC_` values are baked into the bundle at build time. To add one, add it to the schema in `lib/env.ts` and read it there as `process.env.NEXT_PUBLIC_NAME` written out in full; Next.js does not inline values read any other way.

The server's `BASE_URL` must include this app's origin (`http://localhost:3000` in development), or the browser blocks requests with a CORS error.

## Calling the server

Always go through [`lib/api/client.ts`](lib/api/client.ts):

```ts
import { api, isApiError } from "@/lib/api/client";

import type { Example } from "@common/modules/example";

const examples = await api.get<Example[]>("/examples", { query: { limit: 10 } });

try {
  await api.post<Example>("/examples", { name });
} catch (error) {
  if (isApiError(error)) {
    error.statusCode;   // 400, 409, ... (0 = server unreachable)
    error.fieldErrors;  // { name: "Too small: ..." } for validation failures
  }
}
```

It unwraps the server's response envelope, so you get `data` directly, and turns every failure into one `ApiError` (check it with `isApiError`). Cookies are sent with every request (`credentials: "include"`).

## Code style

The client is functional: components, hooks and plain functions. No classes; the class-based module pattern belongs to the server only.

## Shared types

Types for server data (entities, request bodies, the response envelope) come from the repo's `shared/` folder as `@common/*`, the same files the server uses. Don't redefine them here. See `../shared/README.md`.

## Folder structure

```
client/
├── app/              # routes (App Router): pages, layouts
├── components/       # shared UI components
├── features/<name>/  # feature code that mirrors a server module: API calls, components, hooks
└── lib/
    ├── env.ts        # validated env vars
    └── api/          # typed API client
```

Create `features/<name>/` when you build the client side of a server module, e.g. `features/auth/` for `server/src/modules/auth/`.
