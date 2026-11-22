import { Router } from "express";

import { validate } from "@shared/middlewares/validate";
import type { RecipesController } from "./recipes.controller";
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
    this.router.post("/", validate(createRecipesSchemas), controller.create);
    this.router.put("/:id", validate(updateRecipesSchemas), controller.update);
    this.router.delete("/:id", validate(deleteRecipesSchemas), controller.delete);
  }
}
