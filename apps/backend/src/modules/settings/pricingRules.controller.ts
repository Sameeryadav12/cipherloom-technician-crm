import type { Request, Response } from "express";
import { created, ok, paginated } from "../../utils/api-response.js";
import type {
  CreatePricingRuleBody,
  ListPricingRulesQuery,
  UpdatePricingRuleBody
} from "./pricingRules.schemas.js";
import * as pricingRulesService from "./pricingRules.service.js";

export async function listPricingRules(req: Request, res: Response) {
  const query = req.query as unknown as ListPricingRulesQuery;
  const data = await pricingRulesService.listPricingRules(query);
  return paginated(res, data);
}

export async function getPricingRuleById(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const pricingRule = await pricingRulesService.getPricingRuleById(id);
  return ok(res, { pricingRule });
}

export async function createPricingRule(req: Request, res: Response) {
  const body = req.body as CreatePricingRuleBody;
  const pricingRule = await pricingRulesService.createPricingRule(body);
  return created(res, { pricingRule }, { message: "Pricing rule created" });
}

export async function updatePricingRule(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body as UpdatePricingRuleBody;
  const pricingRule = await pricingRulesService.updatePricingRule(id, body);
  return ok(res, { pricingRule }, { message: "Pricing rule updated" });
}

export async function deletePricingRule(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  await pricingRulesService.deletePricingRule(id);
  return ok(res, { deleted: true }, { message: "Pricing rule deleted" });
}

