import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as addonsController from "./addons.controller.js";
import {
  addonIdParamSchema,
  createAddonBodySchema,
  listAddonsQuerySchema,
  pricingRuleIdParamSchemaForAddons,
  updateAddonBodySchema
} from "./addons.schemas.js";
import * as pricingRulesController from "./pricingRules.controller.js";
import {
  createPricingRuleBodySchema,
  listPricingRulesQuerySchema,
  pricingRuleIdParamSchema,
  updatePricingRuleBodySchema
} from "./pricingRules.schemas.js";

export const pricingRulesRouter = Router();

const readRoles = requireRole(UserRole.ADMIN, UserRole.STAFF);
const adminOnly = requireRole(UserRole.ADMIN);

pricingRulesRouter.use(authMiddleware);

pricingRulesRouter.get(
  "/pricing-rules",
  readRoles,
  validateRequest({ query: listPricingRulesQuerySchema }),
  asyncHandler(pricingRulesController.listPricingRules)
);

pricingRulesRouter.post(
  "/pricing-rules",
  adminOnly,
  validateRequest({ body: createPricingRuleBodySchema }),
  asyncHandler(pricingRulesController.createPricingRule)
);

pricingRulesRouter.get(
  "/pricing-rules/:id",
  readRoles,
  validateRequest({ params: pricingRuleIdParamSchema }),
  asyncHandler(pricingRulesController.getPricingRuleById)
);

pricingRulesRouter.patch(
  "/pricing-rules/:id",
  adminOnly,
  validateRequest({
    params: pricingRuleIdParamSchema,
    body: updatePricingRuleBodySchema
  }),
  asyncHandler(pricingRulesController.updatePricingRule)
);

pricingRulesRouter.delete(
  "/pricing-rules/:id",
  adminOnly,
  validateRequest({ params: pricingRuleIdParamSchema }),
  asyncHandler(pricingRulesController.deletePricingRule)
);

pricingRulesRouter.get(
  "/pricing-rules/:id/addons",
  readRoles,
  validateRequest({
    params: pricingRuleIdParamSchemaForAddons,
    query: listAddonsQuerySchema
  }),
  asyncHandler(addonsController.listAddonsForPricingRule)
);

pricingRulesRouter.post(
  "/pricing-rules/:id/addons",
  adminOnly,
  validateRequest({
    params: pricingRuleIdParamSchemaForAddons,
    body: createAddonBodySchema
  }),
  asyncHandler(addonsController.createAddonForPricingRule)
);

pricingRulesRouter.patch(
  "/addons/:addonId",
  adminOnly,
  validateRequest({
    params: addonIdParamSchema,
    body: updateAddonBodySchema
  }),
  asyncHandler(addonsController.updateAddon)
);

pricingRulesRouter.delete(
  "/addons/:addonId",
  adminOnly,
  validateRequest({ params: addonIdParamSchema }),
  asyncHandler(addonsController.deleteAddon)
);

