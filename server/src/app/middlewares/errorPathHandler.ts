import type { Request, Response, NextFunction } from "express";

import { createAppError } from "@modules/utils/errorHandler";

const errorPathHandler = (req: Request, res: Response, next: NextFunction) => {
  next(createAppError(`Route not found: ${req.originalUrl}`, 404));
};

export default errorPathHandler;
