import type { ApiResponse, FieldError } from "@common/http";
import { env } from "@/lib/env";

/** Thrown for every failed request, so callers handle one error type. Check it with `isApiError`. */
export interface ApiError extends Error {
  name: "ApiError";
  statusCode: number;
  details: unknown;
  requestId: string | undefined;
  fieldErrors: Record<string, string>;
}

const toFieldErrors = (details: unknown): Record<string, string> =>
  Array.isArray(details)
    ? Object.fromEntries((details as FieldError[]).map((error) => [error.path, error.message]))
    : {};

const createApiError = (message: string, statusCode: number, details?: unknown, requestId?: string): ApiError =>
  Object.assign(new Error(message), {
    name: "ApiError" as const,
    statusCode,
    details,
    requestId,
    fieldErrors: toFieldErrors(details),
  });

export const isApiError = (error: unknown): error is ApiError => error instanceof Error && error.name === "ApiError";

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

const request = async <T>(method: string, path: string, body?: unknown, options: RequestOptions = {}) => {
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

/** A message to show the user for a failed request, including the first field error from validation. */
export const apiErrorMessage = (error: unknown) => {
  if (!isApiError(error)) return "Something went wrong. Please try again.";
  const [field] = Object.entries(error.fieldErrors);
  return field ? `${error.message}: ${field[0]} ${field[1]}` : error.message;
};
