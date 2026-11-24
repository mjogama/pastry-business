import { Router } from "express";

import { updateSettingsSchemas } from "./menu.schema";
import type { MenuController } from "./menu.controller";
import { validate } from "@shared/middlewares/validate";
import { requireAuth } from "@shared/middlewares/requireAuth";

export class MenuRouter {
  readonly router: Router = Router();

  constructor(controller: MenuController) {
    this.router.get("/", controller.get);
    this.router.get("/settings", controller.getSettings);
    this.router.put("/settings", requireAuth, validate(updateSettingsSchemas), controller.updateSettings);
  }
}
