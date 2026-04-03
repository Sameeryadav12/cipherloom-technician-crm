import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as invoiceController from "./invoice.controller.js";
import {
  invoiceIdParamSchema,
  listInvoicesQuerySchema,
  updateInvoiceBodySchema
} from "./invoice.schemas.js";

export const invoiceRouter = Router();

const staffOrAdmin = requireRole(UserRole.ADMIN, UserRole.STAFF);
const staffAdminOrTech = requireRole(
  UserRole.ADMIN,
  UserRole.STAFF,
  UserRole.TECHNICIAN
);

invoiceRouter.use(authMiddleware);

invoiceRouter.get(
  "/",
  staffAdminOrTech,
  validateRequest({ query: listInvoicesQuerySchema }),
  asyncHandler(invoiceController.listInvoices)
);

invoiceRouter.get(
  "/:id",
  staffAdminOrTech,
  validateRequest({ params: invoiceIdParamSchema }),
  asyncHandler(invoiceController.getInvoiceById)
);

invoiceRouter.patch(
  "/:id",
  staffOrAdmin,
  validateRequest({
    params: invoiceIdParamSchema,
    body: updateInvoiceBodySchema
  }),
  asyncHandler(invoiceController.updateInvoice)
);

invoiceRouter.delete(
  "/:id",
  staffOrAdmin,
  validateRequest({ params: invoiceIdParamSchema }),
  asyncHandler(invoiceController.deleteInvoice)
);
