import type { ApiResponse } from "@common/http";
import { env } from "@/lib/env";

import { redirectToLogin, refreshSession } from "./auth-client";
import { createApiError } from "./errors";

export { type ApiError, apiErrorMessage, createApiError, isApiError } from "./errors";

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  query?: Query;
}

const buildUrl = (path: string, query?: Query) => {
  const url = new URL(`${env.SERVER_API.replace(/\/$/, "")}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url;
};

const request = async <T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
  retried = false,
): Promise<T> => {
  const { query, headers, ...init } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      method,
      credentials: "include",
      headers: { ...(body !== undefined && { "Content-Type": "application/json" }), ...headers },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  } catch {
    throw createApiError("Cannot reach the server", 0);
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!payload) throw createApiError(response.statusText || "Invalid response", response.status);
  if (!payload.success) {
    // In the browser, an expired session is refreshed once and the request retried.
    if (payload.statusCode === 401 && !retried && typeof window !== "undefined") {
      if (await refreshSession()) return request<T>(method, path, body, options, true);
      redirectToLogin();
    }
    throw createApiError(payload.message, payload.statusCode, payload.details, payload.requestId);
  }

  return payload.data;
};

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, undefined, options),
};
