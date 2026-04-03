import type { Request, Response } from "express";
import { AppError } from "../utils/app-error.js";

export function notFoundMiddleware(req: Request, _res: Response) {
  throw new AppError({
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

