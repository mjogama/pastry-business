import { Router } from "express";

import { validate } from "@shared/middlewares/validate";
import type { RecipesController } from "./recipes.controller";
import { requireAuth } from "@shared/middlewares/requireAuth";
import {
  createRecipesSchemas,
  deleteRecipesSchemas,
  getRecipesSchemas,
  listRecipesSchemas,
  updateRecipesSchemas,
} from "./recipes.schema";

export class RecipesRouter {
  readonly router: Router = Router();

  constructor(controller: RecipesController) {
    this.router.get("/", validate(listRecipesSchemas), controller.list);
    this.router.get("/:id", validate(getRecipesSchemas), controller.getById);
    this.router.post("/", requireAuth, validate(createRecipesSchemas), controller.create);
    this.router.put("/:id", requireAuth, validate(updateRecipesSchemas), controller.update);
    this.router.delete("/:id", requireAuth, validate(deleteRecipesSchemas), controller.delete);
  }
}
