import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
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

export const env = { ...parsed.data, NEXT_PUBLIC_API_URL: reachableApiUrl(parsed.data.NEXT_PUBLIC_API_URL) };
