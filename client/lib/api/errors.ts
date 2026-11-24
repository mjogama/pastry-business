import type { FieldError } from "@common/http";

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

export const createApiError = (message: string, statusCode: number, details?: unknown, requestId?: string): ApiError =>
  Object.assign(new Error(message), {
    name: "ApiError" as const,
    statusCode,
    details,
    requestId,
    fieldErrors: toFieldErrors(details),
  });

export const isApiError = (error: unknown): error is ApiError => error instanceof Error && error.name === "ApiError";

/** A message to show the user for a failed request, including the first field error from validation. */
export const apiErrorMessage = (error: unknown) => {
  if (!isApiError(error)) return "Something went wrong. Please try again.";
  const [field] = Object.entries(error.fieldErrors);
  return field ? `${error.message}: ${field[0]} ${field[1]}` : error.message;
};
