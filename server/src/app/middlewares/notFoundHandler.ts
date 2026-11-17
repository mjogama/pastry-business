import type { NextFunction, Request, Response } from "express";

import { NotFoundError } from "@shared/errors/AppError";

const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.path}`));
};

export default notFoundHandler;
