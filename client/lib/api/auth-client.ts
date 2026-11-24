import type { ApiResponse } from "@common/http";
import axios, { type AxiosError } from "axios";
import { env } from "@/lib/env";

import { createApiError } from "./errors";

/** The only axios instance. Cookies (access and refresh tokens) are set by the server and sent with `withCredentials`. */
const http = axios.create({ baseURL: env.SERVER_API, withCredentials: true });

export const LOGIN_PATH = "/sc/auth/login";

/** Only same-site paths, so `?next=` can't send the owner to another site after signing in. */
export const safeNext = (next: string | null | undefined) =>
  next?.startsWith("/") && !next.startsWith("//") ? next : "/";

export const redirectToLogin = () => {
  if (typeof window === "undefined" || window.location.pathname === LOGIN_PATH) return;
  window.location.assign(`${LOGIN_PATH}?next=${encodeURIComponent(window.location.pathname)}`);
};

const toApiError = (error: AxiosError<ApiResponse<unknown>>) => {
  const payload = error.response?.data;
  if (!error.response || !payload || payload.success) return createApiError("Cannot reach the server", 0);
  return createApiError(payload.message, payload.statusCode, payload.details, payload.requestId);
};

const call = async <T>(method: "get" | "post", path: string, body?: unknown): Promise<T> => {
  try {
    const response = await http.request<ApiResponse<T>>({ method, url: path, data: body });
    if (!response.data.success) throw createApiError(response.data.message, response.data.statusCode);
    return response.data.data;
  } catch (error) {
    throw axios.isAxiosError(error) ? toApiError(error as AxiosError<ApiResponse<unknown>>) : error;
  }
};

let refreshing: Promise<boolean> | null = null;

/** Asks the server for new cookies using the refresh cookie. One request at a time; resolves false when it fails. */
export const refreshSession = (): Promise<boolean> => {
  refreshing ??= call("post", "/auth/refresh")
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

/** Sends a file as multipart form data (axios sets the boundary). A 401 is refreshed and retried once. */
const upload = async <T>(path: string, form: FormData): Promise<T> => {
  try {
    return await call<T>("post", path, form);
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode !== 401) throw error;
    if (await refreshSession()) return call<T>("post", path, form);
    redirectToLogin();
    throw error;
  }
};

/** Auth calls. A 401 from `/auth/me` is refreshed and retried once; if that fails the owner goes to the login page. */
export const authClient = {
  post: <T>(path: string, body?: unknown) => call<T>("post", path, body),
  upload,
  async get<T>(path: string): Promise<T> {
    try {
      return await call<T>("get", path);
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode !== 401) throw error;
      if (await refreshSession()) return call<T>("get", path);
      redirectToLogin();
      throw error;
    }
  },
};
