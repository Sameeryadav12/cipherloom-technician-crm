import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { sensitiveActionRateLimit } from "../../middlewares/rate-limit.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as automationController from "./automation.controller.js";
import {
  automationRuleIdParamSchema,
  runAutomationBodySchema,
  updateAutomationRuleBodySchema
} from "./automation.schemas.js";

export const automationRouter = Router();

automationRouter.use(authMiddleware, requireRole(UserRole.ADMIN, UserRole.STAFF));

automationRouter.get("/rules", asyncHandler(automationController.listRules));
automationRouter.patch(
  "/rules/:id",
  validateRequest({ params: automationRuleIdParamSchema, body: updateAutomationRuleBodySchema }),
  asyncHandler(automationController.updateRule)
);
automationRouter.post(
  "/run",
  requireRole(UserRole.ADMIN),
  sensitiveActionRateLimit,
  validateRequest({ body: runAutomationBodySchema }),
  asyncHandler(automationController.runNow)
);
automationRouter.get("/status", asyncHandler(automationController.status));
