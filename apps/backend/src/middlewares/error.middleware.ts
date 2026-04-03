import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import type { ApiErrorResponse } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const isDev = env.NODE_ENV === "development";

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error("Operational error", {
        path: req.originalUrl,
        method: req.method,
        statusCode: err.statusCode,
        message: err.message
      });
    }
    const body: ApiErrorResponse & { stack?: string } = {
      success: false,
      message: err.message,
      details: err.statusCode >= 500 && !isDev ? null : (err.details ?? null),
      ...(isDev ? { stack: err.stack } : {})
    };
    return res.status(err.statusCode).json(body);
  }

  const message = "Internal server error";

  logger.error(message, {
    path: req.originalUrl,
    method: req.method,
    err: err instanceof Error ? { name: err.name, message: err.message } : err
  });

  const body: ApiErrorResponse & { stack?: string } = {
    success: false,
    message,
    details: null,
    ...(isDev && err instanceof Error ? { stack: err.stack } : {})
  };

  return res.status(500).json(body);
}

