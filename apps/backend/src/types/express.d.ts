import type { UserRole } from "@prisma/client";
import "express";

declare global {
  namespace Express {
    interface Request {
      /**
       * Set by `authMiddleware` after a valid Bearer access token.
       */
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};
