import { ZodError } from "zod";
import { STATUS_CODES } from "node:http";
import type { NextFunction, Request, Response } from "express";

import { logger } from "@shared/logger";
import { AppError } from "@shared/errors/AppError";
import type { ErrorResponse } from "@shared/http/response";

interface NormalizedError {
  statusCode: number;
  message: string;
  details?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const normalizeError = (err: unknown): NormalizedError => {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, message: err.message, details: err.details };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      message: "Validation failed",
      details: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    };
  }

  if (isRecord(err)) {
    // Mongoose validation error
    if (err.name === "ValidationError" && isRecord(err.errors)) {
      return {
        statusCode: 400,
        message: "Validation failed",
        details: Object.entries(err.errors).map(([path, error]) => ({
          path,
          message: isRecord(error) ? String(error.message) : String(error),
        })),
      };
    }

    // Mongoose invalid ObjectId / cast error
    if (err.name === "CastError" && typeof err.path === "string") {
      return { statusCode: 400, message: `Invalid ${err.path}` };
    }

    // Client errors raised by Express itself (malformed JSON, payload too large, ...)
    // follow the http-errors convention and mark themselves as safe to expose.
    if (err.expose === true && typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 500) {
      return {
        statusCode: err.statusCode,
        message: typeof err.message === "string" ? err.message : "Bad request",
      };
    }
  }

  return { statusCode: 500, message: "Internal server error" };
};

const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const { statusCode, message, details } = normalizeError(err);
  const log = req.log ?? logger;

  if (statusCode >= 500) {
    log.error({ err }, "Unhandled error");
  } else {
    log.debug({ err }, "Request rejected");
  }

  const body: ErrorResponse = {
    success: false,
    statusCode,
    status: STATUS_CODES[statusCode] ?? "Error",
    message,
    ...(details !== undefined && { details }),
    ...(req.id !== undefined && { requestId: String(req.id) }),
  };

  res.status(statusCode).json(body);
};

export default globalErrorHandler;
