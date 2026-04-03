import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";

export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = randomUUID();
  const started = Date.now();
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const elapsedMs = Date.now() - started;
    logger.info("HTTP request completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      elapsedMs
    });
  });

  next();
}
