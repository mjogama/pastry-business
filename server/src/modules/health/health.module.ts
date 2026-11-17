import type { Router } from "express";

import { HealthRouter } from "./health.routes";
import { HealthService } from "./health.service";
import { HealthController } from "./health.controller";

export class HealthModule {
  readonly service: HealthService;
  readonly router: Router;

  constructor() {
    this.service = new HealthService();
    this.router = new HealthRouter(new HealthController(this.service)).router;
  }
}

/** Shared instance, so any module can call `healthModule.service.register("database", ...)`. */
export const healthModule = new HealthModule();
