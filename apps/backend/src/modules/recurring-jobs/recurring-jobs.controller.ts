import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { created, ok } from "../../utils/api-response.js";
import type {
  CreateRecurringJobTemplateBody,
  UpdateRecurringJobTemplateBody
} from "./recurring-jobs.schemas.js";
import * as recurringJobsService from "./recurring-jobs.service.js";

function requireUser(req: Request) {
  if (!req.user) throw new AppError({ statusCode: 401, message: "Unauthorized" });
  return req.user;
}

export async function listRecurringJobs(req: Request, res: Response) {
  requireUser(req);
  const items = await recurringJobsService.listRecurringJobTemplates();
  return ok(res, { items });
}

export async function getRecurringJob(req: Request, res: Response) {
  requireUser(req);
  const { id } = req.params as { id: string };
  const item = await recurringJobsService.getRecurringJobTemplate(id);
  return ok(res, { item });
}

export async function createRecurringJob(req: Request, res: Response) {
  const user = requireUser(req);
  const body = req.body as CreateRecurringJobTemplateBody;
  const item = await recurringJobsService.createRecurringJobTemplate(body, user.id);
  return created(res, { item }, { message: "Recurring job template created" });
}

export async function updateRecurringJob(req: Request, res: Response) {
  requireUser(req);
  const { id } = req.params as { id: string };
  const body = req.body as UpdateRecurringJobTemplateBody;
  const item = await recurringJobsService.updateRecurringJobTemplate(id, body);
  return ok(res, { item }, { message: "Recurring job template updated" });
}

export async function deleteRecurringJob(req: Request, res: Response) {
  requireUser(req);
  const { id } = req.params as { id: string };
  await recurringJobsService.deleteRecurringJobTemplate(id);
  return ok(res, { deleted: true }, { message: "Recurring job template deleted" });
}
