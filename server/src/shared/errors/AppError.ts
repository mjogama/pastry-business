/**
 * An error that is safe to show to the client. Anything that is not an AppError
 * is treated as unexpected and answered with a generic 500.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly details: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: unknown) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: unknown) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", details?: unknown) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: unknown) {
    super(message, 409, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests, please try again later", details?: unknown) {
    super(message, 429, details);
  }
}
