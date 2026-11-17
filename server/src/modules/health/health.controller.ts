import type { Request, Response } from "express";

import { AppError } from "@shared/errors/AppError";
import { sendSuccess } from "@shared/http/response";
import type { HealthService } from "./health.service";

export class HealthController {
  constructor(private readonly service: HealthService) {}

  /** Liveness: the process is up. Never touches external dependencies. */
  health = (_req: Request, res: Response) => {
    sendSuccess(res, { message: "OK", data: { uptime: this.service.uptime() } });
  };

  /** Readiness: every registered dependency responds. */
  ready = async (_req: Request, res: Response) => {
    const checks = await this.service.runChecks();

    if (checks.some((check) => !check.ok)) {
      throw new AppError("Service unavailable", 503, checks);
    }

    sendSuccess(res, { message: "Ready", data: { checks } });
  };
}
