import { Router, type Request, type Response } from "express";

import responseHandler from "@modules/utils/responseHandler";

const v1Router = Router();

v1Router.get("/status", (_req: Request, res: Response) => {
  responseHandler(res, 200, "API v1 is running", null);
});

export default v1Router;
