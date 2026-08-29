import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import express from "express";
import compression from "compression";

import { env } from "./config/env";
import limiter from "./middlewares/rateLimit";
import { registerRoutes } from "./routes";
import errorPathHandler from "./middlewares/errorPathHandler";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.BASE_URL,
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(compression());
app.use(morgan("dev"));
app.use(limiter);

registerRoutes(app);

app.use(errorPathHandler);
app.use(globalErrorHandler);

export default app;
