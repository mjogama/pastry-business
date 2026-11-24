import { Router } from "express";

import { validate } from "@shared/middlewares/validate";
import { requireAuth } from "@shared/middlewares/requireAuth";
import type { ProductsController } from "./products.controller";
import {
  getProductSchemas,
  listProductsSchemas,
  createProductSchemas,
  deleteProductSchemas,
  updateProductSchemas,
} from "./products.schema";

export class ProductsRouter {
  readonly router: Router = Router();

  constructor(controller: ProductsController) {
    this.router.get("/", validate(listProductsSchemas), controller.list);
    this.router.get("/:id", validate(getProductSchemas), controller.getById);
    this.router.post("/", requireAuth, validate(createProductSchemas), controller.create);
    this.router.patch("/:id", requireAuth, validate(updateProductSchemas), controller.update);
    this.router.delete("/:id", requireAuth, validate(deleteProductSchemas), controller.delete);
  }
}
