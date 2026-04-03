import { JobStatus, type Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { logger } from "../../utils/logger.js";
import type {
  CreateTimeOffBody,
  ListTimeOffQuery,
  UpdateTimeOffBody
} from "./timeOff.schemas.js";
import type { TimeOffPublic } from "./timeOff.types.js";
import * as notificationService from "../notifications/notification.service.js";

const technicianSummarySelect = {
  id: true,
  name: true,
  email: true,
  isActive: true
} satisfies Prisma.TechnicianSelect;

function assertRangeOrder(start: Date, end: Date) {
  if (end <= start) {
    throw new AppError({
      statusCode: 400,
      message: "end must be later than start"
    });
  }
}

async function requireTechnicianExists(technicianId: string) {
  const t = await prisma.technician.findUnique({
    where: { id: technicianId },
    select: { id: true }
  });
  if (!t) {
    throw new AppError({
      statusCode: 400,
      message: "Technician not found"
    });
  }
}

async function assertNoTimeOffOverlap(input: {
  technicianId: string;
  start: Date;
  end: Date;
  excludeId?: string;
}) {
  const { technicianId, start, end, excludeId } = input;
  const overlapping = await prisma.timeOff.findFirst({
    where: {
      technicianId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      start: { lt: end },
      end: { gt: start }
    },
    select: { id: true }
  });
  if (overlapping) {
    throw new AppError({
      statusCode: 409,
      message:
        "Time-off period overlaps with an existing time-off entry for this technician."
    });
  }
}

function buildListWhere(query: ListTimeOffQuery): Prisma.TimeOffWhereInput {
  const parts: Prisma.TimeOffWhereInput[] = [];

  if (query.technicianId && query.technicianId.length > 0) {
    parts.push({ technicianId: query.technicianId });
  }

  const rangeStart = query.start;
  const rangeEnd = query.end;

  if (rangeStart && rangeEnd) {
    if (rangeEnd <= rangeStart) {
      throw new AppError({
        statusCode: 400,
        message: "Query end must be later than query start"
      });
    }
    parts.push({
      start: { lt: rangeEnd },
      end: { gt: rangeStart }
    });
  } else if (rangeStart) {
    parts.push({ end: { gt: rangeStart } });
  } else if (rangeEnd) {
    parts.push({ start: { lt: rangeEnd } });
  }

  return parts.length === 0 ? {} : { AND: parts };
}

export async function listTimeOff(query: ListTimeOffQuery): Promise<{
  items: TimeOffPublic[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}> {
  const where = buildListWhere(query);
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [rows, totalItems] = await prisma.$transaction([
    prisma.timeOff.findMany({
      where,
      orderBy: { start: "asc" },
      skip,
      take: limit,
      include: {
        technician: { select: technicianSummarySelect }
      }
    }),
    prisma.timeOff.count({ where })
  ]);

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  return {
    items: rows,
    page,
    pageSize: limit,
    totalItems,
    totalPages
  };
}

export async function getTimeOffById(id: string): Promise<TimeOffPublic> {
  const row = await prisma.timeOff.findUnique({
    where: { id },
    include: {
      technician: { select: technicianSummarySelect }
    }
  });
  if (!row) {
    throw new AppError({
      statusCode: 404,
      message: "Time-off not found"
    });
  }
  return row;
}

export async function createTimeOff(
  input: CreateTimeOffBody
): Promise<TimeOffPublic> {
  assertRangeOrder(input.start, input.end);
  await requireTechnicianExists(input.technicianId);
  await assertNoTimeOffOverlap({
    technicianId: input.technicianId,
    start: input.start,
    end: input.end
  });

  const created = await prisma.timeOff.create({
    data: {
      technicianId: input.technicianId,
      start: input.start,
      end: input.end,
      reason: input.reason
    },
    include: {
      technician: { select: technicianSummarySelect }
    }
  });

  const overlappingJobs = await prisma.job.findMany({
    where: {
      technicianId: input.technicianId,
      status: { not: JobStatus.CANCELLED },
      scheduledStart: { not: null, lt: input.end },
      scheduledEnd: { not: null, gt: input.start }
    },
    select: { id: true, title: true }
  });
  if (overlappingJobs.length > 0) {
    try {
      await notificationService.notifyDispatchAlert({
        type: "TIME_OFF_CONFLICT",
        title: "Time-off overlaps scheduled jobs",
        message: `${created.technician.name} time-off overlaps ${overlappingJobs.length} scheduled job(s).`,
        payload: {
          technicianId: input.technicianId,
          timeOffId: created.id,
          overlappingJobIds: overlappingJobs.map((j: { id: string }) => j.id)
        }
      });
    } catch (error) {
      logger.warn("Failed to send time-off conflict notification", {
        timeOffId: created.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return created;
}

export async function updateTimeOff(
  id: string,
  input: UpdateTimeOffBody
): Promise<TimeOffPublic> {
  const existing = await prisma.timeOff.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError({
      statusCode: 404,
      message: "Time-off not found"
    });
  }

  const nextTechnicianId = input.technicianId ?? existing.technicianId;
  const nextStart = input.start ?? existing.start;
  const nextEnd = input.end ?? existing.end;

  assertRangeOrder(nextStart, nextEnd);

  if (input.technicianId !== undefined) {
    await requireTechnicianExists(nextTechnicianId);
  }

  await assertNoTimeOffOverlap({
    technicianId: nextTechnicianId,
    start: nextStart,
    end: nextEnd,
    excludeId: id
  });

  const updated = await prisma.timeOff.update({
    where: { id },
    data: {
      ...(input.technicianId !== undefined
        ? { technicianId: input.technicianId }
        : {}),
      ...(input.start !== undefined ? { start: input.start } : {}),
      ...(input.end !== undefined ? { end: input.end } : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {})
    },
    include: {
      technician: { select: technicianSummarySelect }
    }
  });
  const overlappingJobs = await prisma.job.findMany({
    where: {
      technicianId: nextTechnicianId,
      status: { not: JobStatus.CANCELLED },
      scheduledStart: { not: null, lt: nextEnd },
      scheduledEnd: { not: null, gt: nextStart }
    },
    select: { id: true }
  });
  if (overlappingJobs.length > 0) {
    try {
      await notificationService.notifyDispatchAlert({
        type: "TIME_OFF_CONFLICT",
        title: "Updated time-off conflicts with jobs",
        message: `${updated.technician.name} time-off now overlaps ${overlappingJobs.length} scheduled job(s).`,
        payload: {
          technicianId: nextTechnicianId,
          timeOffId: updated.id,
          overlappingJobIds: overlappingJobs.map((j: { id: string }) => j.id)
        }
      });
    } catch (error) {
      logger.warn("Failed to send updated time-off conflict notification", {
        timeOffId: updated.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return updated;
}

export async function deleteTimeOff(id: string): Promise<void> {
  const existing = await prisma.timeOff.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!existing) {
    throw new AppError({
      statusCode: 404,
      message: "Time-off not found"
    });
  }
  await prisma.timeOff.delete({ where: { id } });
}
