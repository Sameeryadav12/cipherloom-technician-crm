import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { ok } from "../../utils/api-response.js";
import type {
  CheckConflictsBody,
  GetCalendarQuery
} from "./calendar.schemas.js";
import type { CalendarAuthContext } from "./calendar.types.js";
import * as calendarService from "./calendar.service.js";

function calendarAuth(req: Request): CalendarAuthContext {
  if (!req.user) {
    throw new AppError({
      statusCode: 401,
      message: "Unauthorized"
    });
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function getCalendar(req: Request, res: Response) {
  const query = req.query as unknown as GetCalendarQuery;
  const data = await calendarService.getCalendarEvents(query, calendarAuth(req));
  return ok(res, data);
}

export async function checkConflicts(req: Request, res: Response) {
  const body = req.body as CheckConflictsBody;
  const data = await calendarService.checkCalendarConflicts(
    body,
    calendarAuth(req)
  );
  return ok(res, data);
}

