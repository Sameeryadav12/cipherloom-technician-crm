import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { ok } from "../../utils/api-response.js";
import { logger } from "../../utils/logger.js";
import type {
  CheckSchedulingConflictBody,
  SuggestScheduleBody,
  TechnicianAvailabilityQuery
} from "./scheduling.schemas.js";
import type { SchedulingAuthContext } from "./scheduling.types.js";
import * as schedulingService from "./scheduling.service.js";
import * as notificationService from "../notifications/notification.service.js";

function schedulingAuth(req: Request): SchedulingAuthContext {
  if (!req.user) {
    throw new AppError({
      statusCode: 401,
      message: "Unauthorized"
    });
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function suggestSchedule(req: Request, res: Response) {
  const body = req.body as SuggestScheduleBody;
  const data = await schedulingService.suggestSchedule(body, schedulingAuth(req));
  return ok(res, data);
}

export async function checkConflict(req: Request, res: Response) {
  const body = req.body as CheckSchedulingConflictBody;
  const auth = schedulingAuth(req);
  const data = await schedulingService.checkSchedulingConflict(body);
  if (data.hasConflict) {
    try {
      await notificationService.notifyUser({
        userId: auth.userId,
        type: "JOB_CONFLICT",
        title: "Scheduling conflict detected",
        message: `${data.conflicts.length} conflict(s) detected for selected slot.`,
        payload: {
          technicianId: body.technicianId,
          start: body.start.toISOString(),
          end: body.end.toISOString(),
          conflictIds: data.conflicts.map((c) => c.id)
        }
      });
    } catch (error) {
      logger.warn("Failed to send scheduling conflict notification", {
        userId: auth.userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return ok(res, data);
}

export async function getTechnicianAvailability(req: Request, res: Response) {
  const params = req.params as { technicianId: string };
  const query = req.query as unknown as TechnicianAvailabilityQuery;
  const _auth = schedulingAuth(req);
  const data = await schedulingService.getTechnicianAvailability(params.technicianId, query);
  return ok(res, data);
}

