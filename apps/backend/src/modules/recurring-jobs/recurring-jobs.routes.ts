import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as recurringJobsController from "./recurring-jobs.controller.js";
import {
  createRecurringJobTemplateBodySchema,
  recurringJobIdParamSchema,
  updateRecurringJobTemplateBodySchema
} from "./recurring-jobs.schemas.js";

export const recurringJobsRouter = Router();

recurringJobsRouter.use(authMiddleware, requireRole(UserRole.ADMIN, UserRole.STAFF));

recurringJobsRouter.get("/", asyncHandler(recurringJobsController.listRecurringJobs));
recurringJobsRouter.post(
  "/",
  validateRequest({ body: createRecurringJobTemplateBodySchema }),
  asyncHandler(recurringJobsController.createRecurringJob)
);
recurringJobsRouter.get(
  "/:id",
  validateRequest({ params: recurringJobIdParamSchema }),
  asyncHandler(recurringJobsController.getRecurringJob)
);
recurringJobsRouter.patch(
  "/:id",
  validateRequest({
    params: recurringJobIdParamSchema,
    body: updateRecurringJobTemplateBodySchema
  }),
  asyncHandler(recurringJobsController.updateRecurringJob)
);
recurringJobsRouter.delete(
  "/:id",
  validateRequest({ params: recurringJobIdParamSchema }),
  asyncHandler(recurringJobsController.deleteRecurringJob)
);
