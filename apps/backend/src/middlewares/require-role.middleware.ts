import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError({
          statusCode: 401,
          message: "Unauthorized"
        })
      );
    }
    if (!allowed.includes(req.user.role)) {
      return next(
        new AppError({
          statusCode: 403,
          message: "Forbidden"
        })
      );
    }
    return next();
  };
}
