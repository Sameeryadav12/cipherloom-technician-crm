import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import { generateInvoiceBodySchema } from "../invoices/invoice.schemas.js";
import * as jobController from "./job.controller.js";
import {
  assignTechnicianBodySchema,
  createJobBodySchema,
  jobIdParamSchema,
  listJobsQuerySchema,
  updateJobBodySchema,
  updateJobStatusBodySchema
} from "./job.schemas.js";

export const jobRouter = Router();

const staffOrAdmin = requireRole(UserRole.ADMIN, UserRole.STAFF);
const staffAdminOrTech = requireRole(
  UserRole.ADMIN,
  UserRole.STAFF,
  UserRole.TECHNICIAN
);

jobRouter.use(authMiddleware);

jobRouter.get(
  "/",
  staffAdminOrTech,
  validateRequest({ query: listJobsQuerySchema }),
  asyncHandler(jobController.listJobs)
);

jobRouter.post(
  "/",
  staffOrAdmin,
  validateRequest({ body: createJobBodySchema }),
  asyncHandler(jobController.createJob)
);

jobRouter.get(
  "/:id",
  staffAdminOrTech,
  validateRequest({ params: jobIdParamSchema }),
  asyncHandler(jobController.getJobById)
);

jobRouter.patch(
  "/:id",
  staffOrAdmin,
  validateRequest({
    params: jobIdParamSchema,
    body: updateJobBodySchema
  }),
  asyncHandler(jobController.updateJob)
);

jobRouter.delete(
  "/:id",
  staffOrAdmin,
  validateRequest({ params: jobIdParamSchema }),
  asyncHandler(jobController.deleteJob)
);

jobRouter.post(
  "/:id/assign-technician",
  staffOrAdmin,
  validateRequest({
    params: jobIdParamSchema,
    body: assignTechnicianBodySchema
  }),
  asyncHandler(jobController.assignTechnician)
);

jobRouter.post(
  "/:id/status",
  staffAdminOrTech,
  validateRequest({
    params: jobIdParamSchema,
    body: updateJobStatusBodySchema
  }),
  asyncHandler(jobController.updateJobStatus)
);

jobRouter.post(
  "/:id/generate-invoice",
  staffOrAdmin,
  validateRequest({
    params: jobIdParamSchema,
    body: generateInvoiceBodySchema
  }),
  asyncHandler(jobController.generateInvoiceForJob)
);
