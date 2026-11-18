import { Router } from "express";

import { sendSuccess } from "@shared/http/response";

const v1Router = Router();

v1Router.get("/status", (_req, res) => {
  sendSuccess(res, { message: "API v1 is running", data: null });
});

// Mount one module per feature.

export default v1Router;
