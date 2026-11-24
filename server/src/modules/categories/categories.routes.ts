import { Router } from "express";

import { validate } from "@shared/middlewares/validate";
import { requireAuth } from "@shared/middlewares/requireAuth";
import type { CategoriesController } from "./categories.controller";
import {
  getCategorySchemas,
  listCategoriesSchemas,
  createCategorySchemas,
  deleteCategorySchemas,
  updateCategorySchemas,
} from "./categories.schema";

export class CategoriesRouter {
  readonly router: Router = Router();

  constructor(controller: CategoriesController) {
    this.router.get("/", validate(listCategoriesSchemas), controller.list);
    this.router.get("/:id", validate(getCategorySchemas), controller.getById);
    this.router.post("/", requireAuth, validate(createCategorySchemas), controller.create);
    this.router.patch("/:id", requireAuth, validate(updateCategorySchemas), controller.update);
    this.router.delete("/:id", requireAuth, validate(deleteCategorySchemas), controller.delete);
  }
}
