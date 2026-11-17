import { Router } from "express";

import { validate } from "@shared/middlewares/validate";
import type { ExampleController } from "./example.controller";
import { createExampleSchemas, getExampleSchemas, listExamplesSchemas } from "./example.schema";

export class ExampleRouter {
  readonly router: Router = Router();

  constructor(controller: ExampleController) {
    this.router.get("/", validate(listExamplesSchemas), controller.list);
    this.router.get("/:id", validate(getExampleSchemas), controller.getById);
    this.router.post("/", validate(createExampleSchemas), controller.create);
  }
}
