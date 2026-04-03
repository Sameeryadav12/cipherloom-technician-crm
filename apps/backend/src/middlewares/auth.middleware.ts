import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";
import { verifyAccessToken } from "../modules/auth/auth.utils.js";

function parseBearerToken(authorization: string | undefined): string | null {
  if (!authorization || typeof authorization !== "string") return null;
  const parts = authorization.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  const token = parts[1]?.trim();
  return token && token.length > 0 ? token : null;
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    return next(
      new AppError({
        statusCode: 401,
        message: "Missing or invalid Authorization header"
      })
    );
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
    return next();
  } catch {
    return next(
      new AppError({
        statusCode: 401,
        message: "Invalid or expired token"
      })
    );
  }
}
