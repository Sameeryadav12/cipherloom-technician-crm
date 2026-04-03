import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as customerController from "./customer.controller.js";
import {
  createCustomerBodySchema,
  customerIdParamSchema,
  listCustomersQuerySchema,
  updateCustomerBodySchema
} from "./customer.schemas.js";

export const customerRouter = Router();

customerRouter.use(
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.STAFF)
);

customerRouter.get(
  "/",
  validateRequest({ query: listCustomersQuerySchema }),
  asyncHandler(customerController.listCustomers)
);

customerRouter.post(
  "/",
  validateRequest({ body: createCustomerBodySchema }),
  asyncHandler(customerController.createCustomer)
);

customerRouter.get(
  "/:id",
  validateRequest({ params: customerIdParamSchema }),
  asyncHandler(customerController.getCustomerById)
);

customerRouter.patch(
  "/:id",
  validateRequest({
    params: customerIdParamSchema,
    body: updateCustomerBodySchema
  }),
  asyncHandler(customerController.updateCustomer)
);

customerRouter.delete(
  "/:id",
  validateRequest({ params: customerIdParamSchema }),
  asyncHandler(customerController.deleteCustomer)
);
