import { pino } from "pino";

import { env } from "@app/config/env";

const defaultLevel = env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug";

export const logger = pino({
  level: env.LOG_LEVEL ?? defaultLevel,
  redact: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
  ...(env.NODE_ENV === "development" && {
    transport: { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } },
  }),
});
