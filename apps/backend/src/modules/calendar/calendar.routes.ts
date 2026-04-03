import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as calendarController from "./calendar.controller.js";
import {
  checkConflictsBodySchema,
  getCalendarQuerySchema
} from "./calendar.schemas.js";

export const calendarRouter = Router();

const staffAdminOrTech = requireRole(
  UserRole.ADMIN,
  UserRole.STAFF,
  UserRole.TECHNICIAN
);

calendarRouter.use(authMiddleware, staffAdminOrTech);

calendarRouter.get(
  "/",
  validateRequest({ query: getCalendarQuerySchema }),
  asyncHandler(calendarController.getCalendar)
);

calendarRouter.post(
  "/check-conflicts",
  validateRequest({ body: checkConflictsBodySchema }),
  asyncHandler(calendarController.checkConflicts)
);

