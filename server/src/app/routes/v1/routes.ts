import { Router } from "express";

import { sendSuccess } from "@shared/http/response";
import { RecipesModule } from "@modules/recipes/recipes.module";
import { SalesEntryModule } from "@modules/sales-entry/sales-entry.module";

const v1Router = Router();

v1Router.get("/status", (_req, res) => {
  sendSuccess(res, { message: "API v1 is running", data: null });
});

v1Router.use("/recipes", new RecipesModule().router);
v1Router.use("/sales-entries", new SalesEntryModule().router);

export default v1Router;
