import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { ok } from "../../utils/api-response.js";
import type {
  RunAutomationBody,
  UpdateAutomationRuleBody
} from "./automation.schemas.js";
import * as automationService from "./automation.service.js";

function requireAuth(req: Request) {
  if (!req.user) throw new AppError({ statusCode: 401, message: "Unauthorized" });
  return req.user;
}

export async function listRules(req: Request, res: Response) {
  requireAuth(req);
  const rules = await automationService.listAutomationRules();
  return ok(res, { rules });
}

export async function updateRule(req: Request, res: Response) {
  requireAuth(req);
  const { id } = req.params as { id: string };
  const body = req.body as UpdateAutomationRuleBody;
  const rule = await automationService.updateAutomationRule(id, body);
  return ok(res, { rule }, { message: "Automation rule updated" });
}

export async function runNow(req: Request, res: Response) {
  requireAuth(req);
  if (!env.ENABLE_MANUAL_AUTOMATION_RUN) {
    throw new AppError({
      statusCode: 404,
      message: "Manual automation run endpoint is disabled"
    });
  }
  const body = req.body as RunAutomationBody;
  const result = await automationService.runAutomation(body.taskKey);
  return ok(res, result, { message: "Automation run completed" });
}

export async function status(req: Request, res: Response) {
  requireAuth(req);
  const data = await automationService.getAutomationStatus();
  return ok(res, data);
}
