import { z } from "zod";

const envSchema = z.object({
  SERVER_API: z.url(),
});

// SERVER_API has no NEXT_PUBLIC_ prefix, so next.config.ts `env` inlines it at build time; that is
// what makes it readable in the browser. Read it written out in full: other lookups are not inlined.
const parsed = envSchema.safeParse({
  SERVER_API: process.env.SERVER_API,
});

if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

/**
 * On another device (a phone testing the dev site at http://192.168.x.x:3000), `localhost` in the
 * API URL would point at that device. In the browser, swap it for the host the page came from.
 */
function reachableApiUrl(url: string) {
  if (typeof window === "undefined") return url;
  const api = new URL(url);
  const page = window.location.hostname;
  const isLocal = (host: string) => host === "localhost" || host === "127.0.0.1";
  if (isLocal(api.hostname) && !isLocal(page)) api.hostname = page;
  return api.toString().replace(/\/$/, "");
}

export const env = { ...parsed.data, SERVER_API: reachableApiUrl(parsed.data.SERVER_API) };
