import type { Response } from "express";

import { sendSuccess } from "./response";

export abstract class BaseController {
  protected ok<T>(res: Response, data: T, message = "OK") {
    return sendSuccess(res, { statusCode: 200, message, data });
  }

  protected created<T>(res: Response, data: T, message = "Created") {
    return sendSuccess(res, { statusCode: 201, message, data });
  }

  protected noContent(res: Response) {
    return res.status(204).end();
  }
}
