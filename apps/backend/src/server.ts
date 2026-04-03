import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Backend listening on port ${env.PORT}`, {
    env: env.NODE_ENV
  });
});

process.on("SIGTERM", () => {
  logger.warn("SIGTERM received. Shutting down...");
  server.close();
});

process.on("SIGINT", () => {
  logger.warn("SIGINT received. Shutting down...");
  server.close();
});

