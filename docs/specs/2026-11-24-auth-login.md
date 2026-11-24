# Owner login

- **Status:** done
- **Date:** 2026-11-24
- **Pages / modules:** `/sc/auth/login`, `server/src/modules/auth`, `client/features/auth`
- **Requested by:** owner

## Summary

The owner signs in once with a username and password. The server answers with a JWT access token and a JWT refresh token in httpOnly cookies. Owner pages and the write APIs behind them require that session. Login only: no signup, no password reset, no logout.

## Scope

**In scope**

- `users` table (`username`, bcrypt `passwordHash`); accounts are inserted directly in the database.
- API: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me`.
- Login page `/sc/auth/login`.
- `requireAuth` on the write routes (POST/PUT/PATCH/DELETE) of `/recipes` and every `/sales-entries` write route.
- Client gate on `/recipes` and `/sales-tracker` that redirects to the login page.
- axios auth client with a 401 → refresh → retry interceptor; the fetch `api` client retries once through it.

**Out of scope**

- Signup, reset password, logout, roles, multiple sessions, token revocation.
- Token expiry (for now, see Design).
- Protecting read APIs.

## Design

- **Tokens:** `access_token` (JWT `{ sub, type: "access" }`) and `refresh_token` (JWT `{ sub, type: "refresh" }`), signed with `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. No `exp` claim unless `JWT_ACCESS_TTL_SECONDS` / `JWT_REFRESH_TTL_SECONDS` is set, so a session lasts until those are set. Cookie `maxAge` is 10 years when unset.
- **Cookies:** httpOnly; `Secure` and `SameSite=None` in production (client on Vercel, API on Railway are cross-site), `SameSite=Lax` otherwise. The refresh cookie is limited to path `/api/v1/auth`.
- **Login:** unknown user and wrong password give the same 401 message, and a dummy bcrypt compare runs for unknown users so response time doesn't reveal which usernames exist.
- **Refresh:** verifies the refresh cookie, checks the user still exists, sets new cookies.
- **Client:** `features/auth` holds the form and `api.ts`; `lib/api/auth-client.ts` is the only axios instance. `RequireAuth` calls `GET /auth/me` and redirects to `/sc/auth/login?next=<path>`.
- **Hashing:** `bcryptjs` (pure JS, same hash format as `bcrypt`) to avoid a native build on Railway.

## Open questions

- Safari and other browsers that block third-party cookies may drop the cookies when the client and API are on different sites. Fix is a shared parent domain or a proxy; not decided.
- Add a stricter rate limit on `/auth/login`?

## Changes

- **Server:** `modules/auth/` (login, refresh, me), `shared/auth/tokens.ts`, `shared/middlewares/requireAuth.ts`, `cookie-parser` in `app.ts`, `requireAuth` on write routes of recipes and sales-entry, `User` model and migration `20261124120000_add_users` (not applied yet), deps `jsonwebtoken`, `bcryptjs`, `cookie-parser`.
- **Env:** `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (required), `JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS` (optional) in `env.ts`, `.env.example`, `vitest.config.ts`.
- **Shared:** `shared/modules/auth.ts`.
- **Client:** `features/auth/`, `app/sc/auth/login/`, `lib/api/auth-client.ts` (axios), `lib/api/errors.ts` (split from `client.ts`, re-exported), 401 refresh in `client.ts`, `RequireAuth` in the `/recipes` and `/sales-tracker` layouts, dep `axios`.
- **Tests:** `tests/auth.test.ts`, `tests/helpers.ts`; sales-entry tests send an access cookie.
- **Checked:** `npm run check` (see result in the PR); login against a real database not run.
