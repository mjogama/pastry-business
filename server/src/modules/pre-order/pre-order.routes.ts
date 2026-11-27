import { Router } from "express";

import { validate } from "@shared/middlewares/validate";
import { requireAuth } from "@shared/middlewares/requireAuth";
import type { PreOrderController } from "./pre-order.controller";
import {
  getPreOrderSchemas,
  listPreOrdersSchemas,
  createPreOrderSchemas,
  deletePreOrderSchemas,
  updatePreOrderStatusSchemas,
} from "./pre-order.schema";

export class PreOrderRouter {
  readonly router: Router = Router();

  constructor(controller: PreOrderController) {
    // Placing an order is public; everything else is the owner's (orders hold customers' emails).
    this.router.post("/", validate(createPreOrderSchemas), controller.create);
    this.router.get("/", requireAuth, validate(listPreOrdersSchemas), controller.list);
    this.router.get("/:id", requireAuth, validate(getPreOrderSchemas), controller.getById);
    this.router.patch("/:id/status", requireAuth, validate(updatePreOrderStatusSchemas), controller.updateStatus);
    this.router.delete("/:id", requireAuth, validate(deletePreOrderSchemas), controller.delete);
  }
}
