import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as timeOffController from "./timeOff.controller.js";
import {
  createTimeOffBodySchema,
  listTimeOffQuerySchema,
  timeOffIdParamSchema,
  updateTimeOffBodySchema
} from "./timeOff.schemas.js";

export const timeOffRouter = Router();

timeOffRouter.use(authMiddleware, requireRole(UserRole.ADMIN, UserRole.STAFF));

timeOffRouter.get(
  "/",
  validateRequest({ query: listTimeOffQuerySchema }),
  asyncHandler(timeOffController.listTimeOff)
);

timeOffRouter.post(
  "/",
  validateRequest({ body: createTimeOffBodySchema }),
  asyncHandler(timeOffController.createTimeOff)
);

timeOffRouter.get(
  "/:id",
  validateRequest({ params: timeOffIdParamSchema }),
  asyncHandler(timeOffController.getTimeOffById)
);

timeOffRouter.patch(
  "/:id",
  validateRequest({
    params: timeOffIdParamSchema,
    body: updateTimeOffBodySchema
  }),
  asyncHandler(timeOffController.updateTimeOff)
);

timeOffRouter.delete(
  "/:id",
  validateRequest({ params: timeOffIdParamSchema }),
  asyncHandler(timeOffController.deleteTimeOff)
);
