import cors from "cors";
import express from "express";
import helmet from "helmet";
import { API_PREFIX } from "./config/constants.js";
import { buildApiRouter } from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { env } from "./config/env.js";
import { requestLoggingMiddleware } from "./middlewares/request-logging.middleware.js";

function isOriginAllowed(origin: string | undefined | null) {
  if (!origin) return true;
  const allowed = env.CORS_ALLOWED_ORIGINS.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (allowed.length === 0) return env.NODE_ENV !== "production";
  return allowed.includes(origin);
}

export function createApp() {
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
  app.use(express.json({ limit: env.API_JSON_LIMIT }));
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) return callback(null, true);
        return callback(new Error("CORS origin denied"));
      },
      credentials: true
    })
  );
  app.use(requestLoggingMiddleware);

  app.use(API_PREFIX, buildApiRouter());

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

