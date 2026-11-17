// The response envelope every server endpoint returns.

export interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  /** Standard HTTP reason phrase, e.g. "Not Found". */
  status: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/** One entry of `details` when the server rejects a request with "Validation failed". */
export interface FieldError {
  path: string;
  message: string;
}
