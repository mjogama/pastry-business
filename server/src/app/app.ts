import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import express, { type Express } from "express";

import { registerRoutes } from "./routes";
import { type Env, env } from "./config/env";
import requestLogger from "./middlewares/requestLogger";
import notFoundHandler from "./middlewares/notFoundHandler";
import { createRateLimiter } from "./middlewares/rateLimit";
import { healthModule } from "@modules/health/health.module";
import globalErrorHandler from "./middlewares/globalErrorHandler";

export const createApp = (config: Env = env): Express => {
  const app = express();

  app.disable("x-powered-by");
  // Needed behind a load balancer / reverse proxy so req.ip (and the rate limiter) see the real client.
  app.set("trust proxy", config.TRUST_PROXY);

  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: config.BASE_URL,
      methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.use(healthModule.router);

  app.use(createRateLimiter(config));
  app.use(express.json({ limit: config.BODY_LIMIT }));
  app.use(express.urlencoded({ limit: config.BODY_LIMIT, extended: true }));
  app.use(compression());

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
