import type { Request, Response } from "express";
import { created, ok, paginated } from "../../utils/api-response.js";
import type {
  CreateTechnicianBody,
  ListTechniciansQuery,
  UpdateTechnicianBody
} from "./technician.schemas.js";
import * as technicianService from "./technician.service.js";

export async function listTechnicians(req: Request, res: Response) {
  const query = req.query as unknown as ListTechniciansQuery;
  const data = await technicianService.listTechnicians(query);
  return paginated(res, data);
}

export async function getTechnicianById(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const technician = await technicianService.getTechnicianById(id);
  return ok(res, { technician });
}

export async function createTechnician(req: Request, res: Response) {
  const body = req.body as CreateTechnicianBody;
  const technician = await technicianService.createTechnician(body);
  return created(res, { technician }, { message: "Technician created" });
}

export async function updateTechnician(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body as UpdateTechnicianBody;
  const technician = await technicianService.updateTechnician(id, body);
  return ok(res, { technician }, { message: "Technician updated" });
}

export async function deleteTechnician(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  await technicianService.deleteTechnician(id);
  return ok(res, { deleted: true }, { message: "Technician deleted" });
}
