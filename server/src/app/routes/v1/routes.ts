import { Router } from "express";

import { sendSuccess } from "@shared/http/response";
import { RecipesModule } from "@modules/recipes/recipes.module";

const v1Router = Router();

v1Router.get("/status", (_req, res) => {
  sendSuccess(res, { message: "API v1 is running", data: null });
});

v1Router.use("/recipes", new RecipesModule().router);

export default v1Router;
