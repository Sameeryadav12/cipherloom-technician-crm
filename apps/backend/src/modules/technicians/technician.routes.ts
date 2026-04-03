import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as technicianController from "./technician.controller.js";
import {
  createTechnicianBodySchema,
  listTechniciansQuerySchema,
  technicianIdParamSchema,
  updateTechnicianBodySchema
} from "./technician.schemas.js";

export const technicianRouter = Router();

technicianRouter.use(authMiddleware);

technicianRouter.get(
  "/",
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateRequest({ query: listTechniciansQuerySchema }),
  asyncHandler(technicianController.listTechnicians)
);

technicianRouter.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateRequest({ body: createTechnicianBodySchema }),
  asyncHandler(technicianController.createTechnician)
);

technicianRouter.get(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateRequest({ params: technicianIdParamSchema }),
  asyncHandler(technicianController.getTechnicianById)
);

technicianRouter.patch(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateRequest({
    params: technicianIdParamSchema,
    body: updateTechnicianBodySchema
  }),
  asyncHandler(technicianController.updateTechnician)
);

technicianRouter.delete(
  "/:id",
  requireRole(UserRole.ADMIN),
  validateRequest({ params: technicianIdParamSchema }),
  asyncHandler(technicianController.deleteTechnician)
);
