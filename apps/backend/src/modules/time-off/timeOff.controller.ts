import type { Request, Response } from "express";
import { created, ok, paginated } from "../../utils/api-response.js";
import type {
  CreateTimeOffBody,
  ListTimeOffQuery,
  UpdateTimeOffBody
} from "./timeOff.schemas.js";
import * as timeOffService from "./timeOff.service.js";

export async function listTimeOff(req: Request, res: Response) {
  const query = req.query as unknown as ListTimeOffQuery;
  const data = await timeOffService.listTimeOff(query);
  return paginated(res, data);
}

export async function getTimeOffById(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const timeOff = await timeOffService.getTimeOffById(id);
  return ok(res, { timeOff });
}

export async function createTimeOff(req: Request, res: Response) {
  const body = req.body as CreateTimeOffBody;
  const timeOff = await timeOffService.createTimeOff(body);
  return created(res, { timeOff }, { message: "Time-off created" });
}

export async function updateTimeOff(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body as UpdateTimeOffBody;
  const timeOff = await timeOffService.updateTimeOff(id, body);
  return ok(res, { timeOff }, { message: "Time-off updated" });
}

export async function deleteTimeOff(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  await timeOffService.deleteTimeOff(id);
  return ok(res, { deleted: true }, { message: "Time-off deleted" });
}
