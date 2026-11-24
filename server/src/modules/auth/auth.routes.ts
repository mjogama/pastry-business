import { Router } from "express";

import { loginSchemas } from "./auth.schema";
import type { AuthController } from "./auth.controller";
import { validate } from "@shared/middlewares/validate";
import { requireAuth } from "@shared/middlewares/requireAuth";

export class AuthRouter {
  readonly router: Router = Router();

  constructor(controller: AuthController) {
    this.router.post("/login", validate(loginSchemas), controller.login);
    this.router.post("/refresh", controller.refresh);
    this.router.get("/me", requireAuth, controller.me);
  }
}
