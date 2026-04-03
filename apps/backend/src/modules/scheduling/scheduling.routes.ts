import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as schedulingController from "./scheduling.controller.js";
import {
  checkSchedulingConflictBodySchema,
  suggestScheduleBodySchema,
  technicianAvailabilityQuerySchema
} from "./scheduling.schemas.js";

export const schedulingRouter = Router();

schedulingRouter.post(
  "/suggest",
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateRequest({ body: suggestScheduleBodySchema }),
  asyncHandler(schedulingController.suggestSchedule)
);

schedulingRouter.post(
  "/check-conflict",
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.STAFF, UserRole.TECHNICIAN),
  validateRequest({ body: checkSchedulingConflictBodySchema }),
  asyncHandler(schedulingController.checkConflict)
);

schedulingRouter.get(
  "/technicians/:technicianId/availability",
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.STAFF, UserRole.TECHNICIAN),
  validateRequest({ query: technicianAvailabilityQuerySchema }),
  asyncHandler(schedulingController.getTechnicianAvailability)
);

