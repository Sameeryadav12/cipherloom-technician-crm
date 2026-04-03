import type { Request, Response } from "express";
import { ok } from "../../utils/api-response.js";
import * as aggregatesService from "./aggregates.service.js";

export async function getDashboardAggregates(_req: Request, res: Response) {
  const data = await aggregatesService.getDashboardAggregates();
  return ok(res, data);
}

export async function getCustomerAggregates(req: Request, res: Response) {
  const params = req.params as { id: string };
  const data = await aggregatesService.getCustomerAggregates(params.id);
  return ok(res, data);
}

export async function getTechnicianAggregates(req: Request, res: Response) {
  const params = req.params as { id: string };
  const data = await aggregatesService.getTechnicianAggregates(params.id);
  return ok(res, data);
}
