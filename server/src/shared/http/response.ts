import type { Response } from "express";

import type { SuccessResponse } from "@common/http";

export type { ApiResponse, ErrorResponse, SuccessResponse } from "@common/http";

interface SendSuccessOptions<T> {
  statusCode?: number;
  message?: string;
  data: T;
}

export const sendSuccess = <T>(res: Response, { statusCode = 200, message = "OK", data }: SendSuccessOptions<T>) => {
  const body: SuccessResponse<T> = { success: true, statusCode, message, data };
  return res.status(statusCode).json(body);
};
