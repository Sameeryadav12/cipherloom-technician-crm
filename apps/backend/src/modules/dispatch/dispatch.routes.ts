import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import * as dispatchController from "./dispatch.controller.js";

export const dispatchRouter = Router();

dispatchRouter.use(
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.STAFF)
);

dispatchRouter.get("/queue", asyncHandler(dispatchController.getDispatchQueue));
