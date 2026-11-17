import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";

import { logger } from "@shared/logger";

const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;

const requestLogger = pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === "/health" || req.url === "/ready" },
  genReqId: (req, res) => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const id = typeof incoming === "string" && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});

export default requestLogger;
