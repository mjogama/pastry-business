import { Router } from "express";

import { validate } from "@shared/middlewares/validate";
import type { SalesEntryController } from "./sales-entry.controller";
import {
  getSalesEntrySchemas,
  listSalesEntriesSchemas,
  createSalesEntrySchemas,
  deleteSalesEntrySchemas,
  updateSalesEntrySchemas,
} from "./sales-entry.schema";

export class SalesEntryRouter {
  readonly router: Router = Router();

  constructor(controller: SalesEntryController) {
    this.router.get("/", validate(listSalesEntriesSchemas), controller.list);
    // Before "/:id", so "product-suggestions" is not read as an id.
    this.router.get("/product-suggestions", controller.productSuggestions);
    this.router.get("/:id", validate(getSalesEntrySchemas), controller.getById);
    this.router.post("/", validate(createSalesEntrySchemas), controller.create);
    this.router.put("/:id", validate(updateSalesEntrySchemas), controller.update);
    this.router.delete("/:id", validate(deleteSalesEntrySchemas), controller.delete);
  }
}
