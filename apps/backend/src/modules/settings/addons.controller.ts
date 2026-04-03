import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import type {
  CreateAddonBody,
  ListAddonsQuery,
  UpdateAddonBody
} from "./addons.schemas.js";
import * as addonsService from "./addons.service.js";

export async function listAddonsForPricingRule(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const query = req.query as unknown as ListAddonsQuery;
  const addons = await addonsService.listAddonsForPricingRule(id, query);
  return ok(res, { addons });
}

export async function createAddonForPricingRule(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body as CreateAddonBody;
  const addon = await addonsService.createAddonForPricingRule(id, body);
  return created(res, { addon }, { message: "Service addon created" });
}

export async function updateAddon(req: Request, res: Response) {
  const { addonId } = req.params as { addonId: string };
  const body = req.body as UpdateAddonBody;
  const addon = await addonsService.updateAddon(addonId, body);
  return ok(res, { addon }, { message: "Service addon updated" });
}

export async function deleteAddon(req: Request, res: Response) {
  const { addonId } = req.params as { addonId: string };
  await addonsService.deleteAddon(addonId);
  return ok(res, { deleted: true }, { message: "Service addon deleted" });
}

