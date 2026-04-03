import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as aggregatesController from "./aggregates.controller.js";
import { aggregateEntityIdParamSchema } from "./aggregates.schemas.js";

export const aggregatesRouter = Router();

aggregatesRouter.use(
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.STAFF, UserRole.TECHNICIAN)
);

aggregatesRouter.get(
  "/dashboard",
  asyncHandler(aggregatesController.getDashboardAggregates)
);

aggregatesRouter.get(
  "/customers/:id",
  validateRequest({ params: aggregateEntityIdParamSchema }),
  asyncHandler(aggregatesController.getCustomerAggregates)
);

aggregatesRouter.get(
  "/technicians/:id",
  validateRequest({ params: aggregateEntityIdParamSchema }),
  asyncHandler(aggregatesController.getTechnicianAggregates)
);
