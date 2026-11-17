import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "@shared/logger";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

const server = app.listen(env.PORT, env.HOST, (error) => {
  if (error) {
    logger.fatal({ err: error }, "Failed to start server");
    process.exit(1);
  }
  logger.info(`Server listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
});

let shuttingDown = false;

const shutdown = (reason: string, exitCode: number) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${reason} received, shutting down`);

  server.close((error) => {
    if (error) logger.error({ err: error }, "Error while closing the server");
    process.exit(error ? 1 : exitCode);
  });
  server.closeIdleConnections();

  setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM", 0));
process.on("SIGINT", () => shutdown("SIGINT", 0));

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  shutdown("unhandledRejection", 1);
});
process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  shutdown("uncaughtException", 1);
});
