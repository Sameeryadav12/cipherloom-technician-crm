import { Router } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { authRateLimit } from "../../middlewares/rate-limit.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as authController from "./auth.controller.js";
import {
  loginBodySchema,
  refreshBodySchema,
  registerAdminBodySchema
} from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post(
  "/register-admin",
  authRateLimit,
  validateRequest({ body: registerAdminBodySchema }),
  asyncHandler(authController.registerAdmin)
);

authRouter.post(
  "/login",
  authRateLimit,
  validateRequest({ body: loginBodySchema }),
  asyncHandler(authController.login)
);

authRouter.post(
  "/refresh",
  authRateLimit,
  validateRequest({ body: refreshBodySchema }),
  asyncHandler(authController.refresh)
);
