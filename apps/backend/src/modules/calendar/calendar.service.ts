import { JobStatus, UserRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { CheckConflictsBody, GetCalendarQuery } from "./calendar.schemas.js";
import {
  buildJobCalendarEvent,
  buildJobConflict,
  buildTimeOffCalendarEvent,
  buildTimeOffConflict
} from "./calendar.utils.js";
import type {
  CalendarAuthContext,
  CalendarConflict,
  CalendarEvent
} from "./calendar.types.js";

async function getTechnicianIdForUser(userId: string): Promise<string | null> {
  const row = await prisma.technician.findFirst({
    where: { linkedUserId: userId },
    select: { id: true }
  });
  return row?.id ?? null;
}

async function requireTechnicianExists(technicianId: string) {
  const row = await prisma.technician.findUnique({
    where: { id: technicianId },
    select: { id: true }
  });
  if (!row) {
    throw new AppError({
      statusCode: 400,
      message: "Technician not found"
    });
  }
}

async function resolveScopedTechnicianId(
  auth: CalendarAuthContext,
  requestedTechnicianId?: string
) {
  if (auth.role !== UserRole.TECHNICIAN) {
    return requestedTechnicianId ?? null;
  }

  const ownTechnicianId = await getTechnicianIdForUser(auth.userId);
  if (!ownTechnicianId) {
    throw new AppError({
      statusCode: 403,
      message: "No technician profile linked to this user"
    });
  }

  if (
    requestedTechnicianId !== undefined &&
    requestedTechnicianId !== ownTechnicianId
  ) {
    throw new AppError({
      statusCode: 403,
      message: "Technicians can only access their own calendar scope"
    });
  }

  return ownTechnicianId;
}

export async function getCalendarEvents(
  query: GetCalendarQuery,
  auth: CalendarAuthContext
) {
  const scopedTechnicianId = await resolveScopedTechnicianId(
    auth,
    query.technicianId
  );

  const events: CalendarEvent[] = [];
  const rangeStart = query.start;
  const rangeEnd = query.end;

  if (query.includeJobs) {
    const where: Prisma.JobWhereInput = {
      status: { not: JobStatus.CANCELLED },
      scheduledStart: { not: null, lt: rangeEnd },
      scheduledEnd: { not: null, gt: rangeStart },
      technicianId: scopedTechnicianId ?? { not: null }
    };

    const jobs = await prisma.job.findMany({
      where,
      orderBy: [{ scheduledStart: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        scheduledStart: true,
        scheduledEnd: true,
        customerId: true,
        customer: { select: { name: true } },
        technicianId: true,
        technician: { select: { name: true, color: true } }
      }
    });

    for (const job of jobs) {
      if (
        !job.scheduledStart ||
        !job.scheduledEnd ||
        !job.technicianId ||
        !job.technician
      ) {
        continue;
      }
      events.push(
        buildJobCalendarEvent({
          jobId: job.id,
          title: job.title,
          start: job.scheduledStart,
          end: job.scheduledEnd,
          technicianId: job.technicianId,
          technicianName: job.technician.name,
          technicianColor: job.technician.color,
          status: job.status,
          customerId: job.customerId,
          customerName: job.customer.name
        })
      );
    }
  }

  if (query.includeTimeOff) {
    const where: Prisma.TimeOffWhereInput = {
      start: { lt: rangeEnd },
      end: { gt: rangeStart },
      technicianId: scopedTechnicianId ?? undefined
    };

    const rows = await prisma.timeOff.findMany({
      where,
      orderBy: [{ start: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        start: true,
        end: true,
        reason: true,
        technicianId: true,
        technician: { select: { name: true, color: true } }
      }
    });

    for (const row of rows) {
      events.push(
        buildTimeOffCalendarEvent({
          timeOffId: row.id,
          start: row.start,
          end: row.end,
          reason: row.reason,
          technicianId: row.technicianId,
          technicianName: row.technician.name,
          technicianColor: row.technician.color
        })
      );
    }
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  return {
    range: {
      start: rangeStart,
      end: rangeEnd
    },
    events
  };
}

export async function checkCalendarConflicts(
  body: CheckConflictsBody,
  auth: CalendarAuthContext
) {
  await requireTechnicianExists(body.technicianId);

  if (auth.role === UserRole.TECHNICIAN) {
    const ownTechnicianId = await getTechnicianIdForUser(auth.userId);
    if (!ownTechnicianId || ownTechnicianId !== body.technicianId) {
      throw new AppError({
        statusCode: 403,
        message:
          "Technicians can only check conflicts for their own technician record"
      });
    }
  }

  const conflicts: CalendarConflict[] = [];

  const conflictingJobs = await prisma.job.findMany({
    where: {
      technicianId: body.technicianId,
      status: { not: JobStatus.CANCELLED },
      scheduledStart: { not: null, lt: body.end },
      scheduledEnd: { not: null, gt: body.start },
      ...(body.ignoreJobId ? { id: { not: body.ignoreJobId } } : {})
    },
    orderBy: [{ scheduledStart: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      scheduledStart: true,
      scheduledEnd: true
    }
  });

  for (const job of conflictingJobs) {
    if (!job.scheduledStart || !job.scheduledEnd) continue;
    conflicts.push(
      buildJobConflict({
        id: job.id,
        title: job.title,
        start: job.scheduledStart,
        end: job.scheduledEnd
      })
    );
  }

  const conflictingTimeOff = await prisma.timeOff.findMany({
    where: {
      technicianId: body.technicianId,
      start: { lt: body.end },
      end: { gt: body.start },
      ...(body.ignoreTimeOffId ? { id: { not: body.ignoreTimeOffId } } : {})
    },
    orderBy: [{ start: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      reason: true,
      start: true,
      end: true
    }
  });

  for (const row of conflictingTimeOff) {
    conflicts.push(
      buildTimeOffConflict({
        id: row.id,
        reason: row.reason,
        start: row.start,
        end: row.end
      })
    );
  }

  conflicts.sort((a, b) => a.start.getTime() - b.start.getTime());

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

