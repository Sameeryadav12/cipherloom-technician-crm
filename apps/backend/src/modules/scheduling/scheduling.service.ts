import { JobStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { SuggestScheduleBody } from "./scheduling.schemas.js";
import type {
  SchedulingAuthContext,
  SchedulingSuggestResponse
} from "./scheduling.types.js";
import {
  SCHEDULING_FREE_SLOT_STEP_MINUTES,
  SCHEDULING_WORKDAY_END_HOUR,
  SCHEDULING_WORKDAY_START_HOUR
} from "./scheduling.constants.js";
import {
  buildDefaultSearchWindow,
  generateCandidateSlots,
  slotOverlapsAny,
  technicianMatchesAllSkills
} from "./scheduling.utils.js";

const MAX_SUGGESTIONS = 10;

export type SchedulingConflictInput = {
  technicianId: string;
  start: Date;
  end: Date;
  ignoreJobId?: string;
};

export type SchedulingConflictResult = {
  hasConflict: boolean;
  conflicts: Array<{
    type: "job" | "timeOff";
    id: string;
    title: string;
    start: Date;
    end: Date;
  }>;
};

async function requireCustomerExists(customerId: string) {
  const row = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true }
  });
  if (!row) {
    throw new AppError({
      statusCode: 400,
      message: "Customer not found"
    });
  }
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

function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

export async function checkSchedulingConflict(
  input: SchedulingConflictInput
): Promise<SchedulingConflictResult> {
  await requireTechnicianExists(input.technicianId);

  const [conflictingJobs, conflictingTimeOff] = await Promise.all([
    prisma.job.findMany({
      where: {
        technicianId: input.technicianId,
        status: { not: JobStatus.CANCELLED },
        scheduledStart: { not: null, lt: input.end },
        scheduledEnd: { not: null, gt: input.start },
        ...(input.ignoreJobId ? { id: { not: input.ignoreJobId } } : {})
      },
      orderBy: [{ scheduledStart: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        scheduledStart: true,
        scheduledEnd: true
      }
    }),
    prisma.timeOff.findMany({
      where: {
        technicianId: input.technicianId,
        start: { lt: input.end },
        end: { gt: input.start }
      },
      orderBy: [{ start: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        reason: true,
        start: true,
        end: true
      }
    })
  ]);

  const conflicts: SchedulingConflictResult["conflicts"] = [];
  for (const job of conflictingJobs) {
    if (!job.scheduledStart || !job.scheduledEnd) continue;
    conflicts.push({
      type: "job",
      id: job.id,
      title: job.title,
      start: job.scheduledStart,
      end: job.scheduledEnd
    });
  }
  for (const row of conflictingTimeOff) {
    conflicts.push({
      type: "timeOff",
      id: row.id,
      title: row.reason?.trim() ? `Time Off - ${row.reason.trim()}` : "Time Off",
      start: row.start,
      end: row.end
    });
  }
  conflicts.sort((a, b) => a.start.getTime() - b.start.getTime());
  return { hasConflict: conflicts.length > 0, conflicts };
}

export async function getTechnicianAvailability(
  technicianId: string,
  dateRange: { start: Date; end: Date }
) {
  await requireTechnicianExists(technicianId);
  const [jobs, timeOff] = await Promise.all([
    prisma.job.findMany({
      where: {
        technicianId,
        status: { not: JobStatus.CANCELLED },
        scheduledStart: { not: null, lt: dateRange.end },
        scheduledEnd: { not: null, gt: dateRange.start }
      },
      orderBy: [{ scheduledStart: "asc" }],
      select: {
        id: true,
        title: true,
        scheduledStart: true,
        scheduledEnd: true
      }
    }),
    prisma.timeOff.findMany({
      where: {
        technicianId,
        start: { lt: dateRange.end },
        end: { gt: dateRange.start }
      },
      orderBy: [{ start: "asc" }],
      select: {
        id: true,
        reason: true,
        start: true,
        end: true
      }
    })
  ]);

  const occupied = [
    ...jobs
      .filter((j) => j.scheduledStart && j.scheduledEnd)
      .map((j) => ({ start: j.scheduledStart as Date, end: j.scheduledEnd as Date })),
    ...timeOff.map((t) => ({ start: t.start, end: t.end }))
  ];

  const freeSlots: Array<{ start: Date; end: Date }> = [];
  const cursor = new Date(dateRange.start);
  while (cursor < dateRange.end) {
    const slotStart = new Date(cursor);
    slotStart.setHours(SCHEDULING_WORKDAY_START_HOUR, 0, 0, 0);
    if (slotStart < dateRange.start) slotStart.setTime(dateRange.start.getTime());
    const slotEnd = new Date(cursor);
    slotEnd.setHours(SCHEDULING_WORKDAY_END_HOUR, 0, 0, 0);
    if (slotEnd > dateRange.end) slotEnd.setTime(dateRange.end.getTime());

    let window = new Date(slotStart);
    while (window < slotEnd) {
      const candidateStart = new Date(window);
      const candidateEnd = new Date(
        candidateStart.getTime() + SCHEDULING_FREE_SLOT_STEP_MINUTES * 60_000
      );
      if (candidateEnd > slotEnd) break;
      const blocked = occupied.some((o) =>
        intervalsOverlap(candidateStart, candidateEnd, o.start, o.end)
      );
      if (!blocked) freeSlots.push({ start: candidateStart, end: candidateEnd });
      window = new Date(
        window.getTime() + SCHEDULING_FREE_SLOT_STEP_MINUTES * 60_000
      );
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    totalJobs: jobs.length,
    freeSlots,
    timeOffBlocks: timeOff.map((t) => ({
      id: t.id,
      reason: t.reason,
      start: t.start,
      end: t.end
    })),
    nextAvailableSlot: freeSlots[0] ?? null
  };
}

function buildSearchWindow(body: SuggestScheduleBody) {
  if (body.preferredStart && body.preferredEnd) {
    return { start: body.preferredStart, end: body.preferredEnd };
  }
  return buildDefaultSearchWindow(new Date(), 7);
}

export async function suggestSchedule(
  body: SuggestScheduleBody,
  auth: SchedulingAuthContext
): Promise<SchedulingSuggestResponse> {
  if (auth.role !== UserRole.ADMIN && auth.role !== UserRole.STAFF) {
    throw new AppError({
      statusCode: 403,
      message: "Forbidden"
    });
  }

  await requireCustomerExists(body.customerId);
  if (body.technicianId) {
    await requireTechnicianExists(body.technicianId);
  }

  const searchWindow = buildSearchWindow(body);

  const techWhere: Prisma.TechnicianWhereInput = {
    isActive: true,
    ...(body.technicianId ? { id: body.technicianId } : {})
  };

  const technicians = await prisma.technician.findMany({
    where: techWhere,
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      color: true,
      skills: true
    }
  });

  const requiredSkills = body.requiredSkills ?? [];
  const eligibleTechs = technicians.filter((t) =>
    technicianMatchesAllSkills(t.skills, requiredSkills)
  );

  if (eligibleTechs.length === 0) {
    return {
      suggestions: [],
      searchWindow
    };
  }

  const techIds = eligibleTechs.map((t) => t.id);

  const [jobs, timeOffRows] = await Promise.all([
    prisma.job.findMany({
      where: {
        technicianId: { in: techIds },
        status: { not: JobStatus.CANCELLED },
        scheduledStart: { not: null, lt: searchWindow.end },
        scheduledEnd: { not: null, gt: searchWindow.start },
        ...(body.ignoreJobId ? { id: { not: body.ignoreJobId } } : {})
      },
      select: {
        id: true,
        technicianId: true,
        scheduledStart: true,
        scheduledEnd: true
      }
    }),
    prisma.timeOff.findMany({
      where: {
        technicianId: { in: techIds },
        start: { lt: searchWindow.end },
        end: { gt: searchWindow.start }
      },
      select: {
        id: true,
        technicianId: true,
        start: true,
        end: true
      }
    })
  ]);

  const jobsByTech = new Map<string, Array<{ start: Date; end: Date }>>();
  const workloadByTech = new Map<string, number>();
  for (const job of jobs) {
    if (!job.technicianId || !job.scheduledStart || !job.scheduledEnd) continue;
    const arr = jobsByTech.get(job.technicianId) ?? [];
    arr.push({ start: job.scheduledStart, end: job.scheduledEnd });
    jobsByTech.set(job.technicianId, arr);
    workloadByTech.set(job.technicianId, (workloadByTech.get(job.technicianId) ?? 0) + 1);
  }

  const timeOffByTech = new Map<string, Array<{ start: Date; end: Date }>>();
  for (const row of timeOffRows) {
    const arr = timeOffByTech.get(row.technicianId) ?? [];
    arr.push({ start: row.start, end: row.end });
    timeOffByTech.set(row.technicianId, arr);
  }

  const candidateSlots = generateCandidateSlots({
    searchStart: searchWindow.start,
    searchEnd: searchWindow.end,
    durationMinutes: body.durationMinutes,
    stepMinutes: 30
  });

  const suggestions: SchedulingSuggestResponse["suggestions"] = [];
  const windowStartMs = searchWindow.start.getTime();

  for (const tech of eligibleTechs) {
    const busyJobs = jobsByTech.get(tech.id) ?? [];
    const busyTimeOff = timeOffByTech.get(tech.id) ?? [];
    const workload = workloadByTech.get(tech.id) ?? 0;

    for (const slot of candidateSlots) {
      if (slotOverlapsAny(slot, busyJobs)) continue;
      if (slotOverlapsAny(slot, busyTimeOff)) continue;

      const minutesFromWindowStart = Math.floor(
        (slot.start.getTime() - windowStartMs) / 60_000
      );
      const score = 1_000_000 - minutesFromWindowStart - workload * 100;

      suggestions.push({
        technician: {
          id: tech.id,
          name: tech.name,
          color: tech.color,
          skills: tech.skills
        },
        slot,
        score,
        reason: "Earliest available matching technician"
      });

      break;
    }
  }

  suggestions.sort((a, b) => {
    const byStart = a.slot.start.getTime() - b.slot.start.getTime();
    if (byStart !== 0) return byStart;
    const aWorkload = workloadByTech.get(a.technician.id) ?? 0;
    const bWorkload = workloadByTech.get(b.technician.id) ?? 0;
    if (aWorkload !== bWorkload) return aWorkload - bWorkload;
    return a.technician.name.localeCompare(b.technician.name);
  });

  return {
    suggestions: suggestions.slice(0, MAX_SUGGESTIONS),
    searchWindow
  };
}

