import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const baseLimiter = (max: number) =>
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please retry shortly.",
      details: null
    }
  });

export const authRateLimit = baseLimiter(env.RATE_LIMIT_AUTH_MAX);
export const sensitiveActionRateLimit = baseLimiter(env.RATE_LIMIT_SENSITIVE_MAX);
