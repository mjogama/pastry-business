import { Router } from "express";

import { sendSuccess } from "@shared/http/response";
import { ExampleModule } from "@modules/example/example.module";

const v1Router = Router();

v1Router.get("/status", (_req, res) => {
  sendSuccess(res, { message: "API v1 is running", data: null });
});

// Mount one module per feature.
v1Router.use("/examples", new ExampleModule().router);

export default v1Router;
