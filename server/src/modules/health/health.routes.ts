import { Router } from "express";

import type { HealthController } from "./health.controller";

export class HealthRouter {
  readonly router: Router = Router();

  constructor(controller: HealthController) {
    this.router.get("/health", controller.health);
    this.router.get("/ready", controller.ready);
  }
}
