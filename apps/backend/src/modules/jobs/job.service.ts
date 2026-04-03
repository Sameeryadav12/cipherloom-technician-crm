import { JobStatus, UserRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { logger } from "../../utils/logger.js";
import type {
  AssignTechnicianBody,
  CreateJobBody,
  ListJobsQuery,
  UpdateJobBody,
  UpdateJobStatusBody
} from "./job.schemas.js";
import type { JobAuthContext } from "./job.types.js";
import * as notificationService from "../notifications/notification.service.js";
import { getLinkedTechnicianUser } from "../notifications/notification.utils.js";

const listInclude = {
  customer: { select: { id: true, name: true } },
  technician: { select: { id: true, name: true } }
} satisfies Prisma.JobInclude;

const detailInclude = listInclude;

export async function getTechnicianIdForUser(userId: string): Promise<string | null> {
  const row = await prisma.technician.findFirst({
    where: { linkedUserId: userId },
    select: { id: true }
  });
  return row?.id ?? null;
}

function stripInternalNotesForTechnician<T extends { internalNotes?: string | null }>(
  job: T,
  role: UserRole
): T {
  if (role !== UserRole.TECHNICIAN) return job;
  const { internalNotes: _ignored, ...rest } = job;
  return rest as T;
}

function assertTechnicianOwnsJob(
  job: { technicianId: string | null },
  techId: string | null,
  role: UserRole
) {
  if (role !== UserRole.TECHNICIAN) return;
  if (!techId || job.technicianId !== techId) {
    throw new AppError({
      statusCode: 403,
      message: "You do not have access to this job"
    });
  }
}

async function requireCustomerExists(customerId: string) {
  const c = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true }
  });
  if (!c) {
    throw new AppError({
      statusCode: 400,
      message: "Customer not found"
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

async function requirePricingRuleExists(pricingRuleId: string) {
  const p = await prisma.pricingRule.findUnique({
    where: { id: pricingRuleId },
    select: { id: true }
  });
  if (!p) {
    throw new AppError({
      statusCode: 400,
      message: "Pricing rule not found"
    });
  }
}

function assertScheduleOrder(start: Date | null, end: Date | null) {
  if (start !== null && end !== null && end <= start) {
    throw new AppError({
      statusCode: 400,
      message: "scheduledEnd must be later than scheduledStart"
    });
  }
}

function assertValidStatusTransition(from: JobStatus, to: JobStatus) {
  if (from === to) return;
  if (to === JobStatus.CANCELLED) return;

  const allowed: Record<JobStatus, JobStatus[]> = {
    [JobStatus.NEW]: [JobStatus.SCHEDULED, JobStatus.IN_PROGRESS],
    [JobStatus.SCHEDULED]: [JobStatus.IN_PROGRESS],
    [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED],
    [JobStatus.COMPLETED]: [JobStatus.INVOICED],
    [JobStatus.INVOICED]: [],
    [JobStatus.CANCELLED]: []
  };

  if (allowed[from].includes(to)) return;
  throw new AppError({
    statusCode: 400,
    message: `Invalid status transition from ${from} to ${to}`
  });
}

export async function listJobs(
  query: ListJobsQuery,
  auth: JobAuthContext
): Promise<{
  items: unknown[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}> {
  const { page, limit } = query;
  const parts: Prisma.JobWhereInput[] = [];

  if (auth.role === UserRole.TECHNICIAN) {
    const techId = await getTechnicianIdForUser(auth.userId);
    if (!techId) {
      return {
        items: [],
        page,
        pageSize: limit,
        totalItems: 0,
        totalPages: 0
      };
    }
    parts.push({ technicianId: techId });
  }

  if (query.status) parts.push({ status: query.status });
  if (query.technicianId) parts.push({ technicianId: query.technicianId });
  if (query.customerId) parts.push({ customerId: query.customerId });

  if (query.scheduledStartFrom || query.scheduledStartTo) {
    const range: Prisma.DateTimeFilter = {};
    if (query.scheduledStartFrom) range.gte = query.scheduledStartFrom;
    if (query.scheduledStartTo) range.lte = query.scheduledStartTo;
    parts.push({ scheduledStart: range });
  }

  const where: Prisma.JobWhereInput =
    parts.length === 0 ? {} : { AND: parts };

  const skip = (page - 1) * limit;

  const [rows, totalItems] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy: [{ scheduledStart: "asc" }, { createdAt: "asc" }],
      skip,
      take: limit,
      include: listInclude
    }),
    prisma.job.count({ where })
  ]);

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  const items = rows.map((j) =>
    stripInternalNotesForTechnician(j, auth.role)
  );

  return {
    items,
    page,
    pageSize: limit,
    totalItems,
    totalPages
  };
}

export async function getJobById(id: string, auth: JobAuthContext) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: detailInclude
  });
  if (!job) {
    throw new AppError({
      statusCode: 404,
      message: "Job not found"
    });
  }

  const techId =
    auth.role === UserRole.TECHNICIAN
      ? await getTechnicianIdForUser(auth.userId)
      : null;
  assertTechnicianOwnsJob(job, techId, auth.role);

  return stripInternalNotesForTechnician(job, auth.role);
}

export async function createJob(input: CreateJobBody, auth: JobAuthContext) {
  await requireCustomerExists(input.customerId);
  if (input.technicianId) {
    await requireTechnicianExists(input.technicianId);
  }
  if (input.pricingRuleId) {
    await requirePricingRuleExists(input.pricingRuleId);
  }
  assertScheduleOrder(
    input.scheduledStart ?? null,
    input.scheduledEnd ?? null
  );

  return prisma.job.create({
    data: {
      title: input.title,
      customerId: input.customerId,
      technicianId: input.technicianId,
      description: input.description,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      pricingRuleId: input.pricingRuleId,
      createdByUserId: auth.userId,
      status: JobStatus.NEW
    },
    include: detailInclude
  });
}

export async function updateJob(id: string, input: UpdateJobBody, auth: JobAuthContext) {
  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError({
      statusCode: 404,
      message: "Job not found"
    });
  }

  const nextStart =
    input.scheduledStart === undefined
      ? existing.scheduledStart
      : input.scheduledStart;
  const nextEnd =
    input.scheduledEnd === undefined ? existing.scheduledEnd : input.scheduledEnd;

  assertScheduleOrder(nextStart, nextEnd);

  if (input.customerId !== undefined) {
    await requireCustomerExists(input.customerId);
  }
  if (input.technicianId !== undefined && input.technicianId !== null) {
    await requireTechnicianExists(input.technicianId);
  }
  if (input.pricingRuleId !== undefined && input.pricingRuleId !== null) {
    await requirePricingRuleExists(input.pricingRuleId);
  }

  const data: Prisma.JobUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.customerId !== undefined) data.customer = { connect: { id: input.customerId } };
  if (input.technicianId !== undefined) {
    data.technician =
      input.technicianId === null
        ? { disconnect: true }
        : { connect: { id: input.technicianId } };
  }
  if (input.description !== undefined) data.description = input.description;
  if (input.scheduledStart !== undefined) data.scheduledStart = input.scheduledStart;
  if (input.scheduledEnd !== undefined) data.scheduledEnd = input.scheduledEnd;
  if (input.pricingRuleId !== undefined) {
    data.pricingRule =
      input.pricingRuleId === null
        ? { disconnect: true }
        : { connect: { id: input.pricingRuleId } };
  }
  if (input.internalNotes !== undefined) data.internalNotes = input.internalNotes;
  if (input.customerNotes !== undefined) data.customerNotes = input.customerNotes;
  if (input.serviceAddressLine1 !== undefined)
    data.serviceAddressLine1 = input.serviceAddressLine1;
  if (input.serviceAddressLine2 !== undefined)
    data.serviceAddressLine2 = input.serviceAddressLine2;
  if (input.serviceSuburb !== undefined) data.serviceSuburb = input.serviceSuburb;
  if (input.serviceState !== undefined) data.serviceState = input.serviceState;
  if (input.servicePostcode !== undefined)
    data.servicePostcode = input.servicePostcode;
  if (input.serviceCountry !== undefined) data.serviceCountry = input.serviceCountry;

  const updated = await prisma.job.update({
    where: { id },
    data,
    include: detailInclude
  });

  const wasScheduledChanged =
    input.scheduledStart !== undefined || input.scheduledEnd !== undefined;
  if (
    wasScheduledChanged &&
    updated.technicianId &&
    updated.scheduledStart &&
    updated.scheduledEnd
  ) {
    const linked = await getLinkedTechnicianUser(updated.technicianId);
    if (linked) {
      try {
        await notificationService.notifyUser({
          userId: linked.id,
          type: "JOB_RESCHEDULED",
          title: "Job rescheduled",
          message: `${updated.title} was rescheduled to ${updated.scheduledStart.toLocaleString()}.`,
          payload: {
            jobId: updated.id,
            technicianId: updated.technicianId,
            customerId: updated.customerId
          }
        });
      } catch (error) {
        logger.warn("Failed to send job rescheduled notification", {
          jobId: updated.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  return updated;
}

export async function deleteJob(id: string) {
  const existing = await prisma.job.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!existing) {
    throw new AppError({
      statusCode: 404,
      message: "Job not found"
    });
  }
  await prisma.job.delete({ where: { id } });
}

export async function assignTechnician(
  id: string,
  input: AssignTechnicianBody
) {
  await requireTechnicianExists(input.technicianId);
  const existing = await prisma.job.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!existing) {
    throw new AppError({
      statusCode: 404,
      message: "Job not found"
    });
  }
  const updated = await prisma.job.update({
    where: { id },
    data: { technician: { connect: { id: input.technicianId } } },
    include: detailInclude
  });
  const linked = await getLinkedTechnicianUser(input.technicianId);
  if (linked) {
    try {
      await notificationService.notifyUser({
        userId: linked.id,
        type: "JOB_ASSIGNED",
        title: "New job assigned",
        message: `You have been assigned to ${updated.title}.`,
        payload: {
          jobId: updated.id,
          customerId: updated.customerId,
          technicianId: input.technicianId
        }
      });
    } catch (error) {
      logger.warn("Failed to send job assignment notification", {
        jobId: updated.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return updated;
}

export async function updateStatus(
  id: string,
  input: UpdateJobStatusBody,
  auth: JobAuthContext
) {
  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, status: true, technicianId: true }
  });
  if (!job) {
    throw new AppError({
      statusCode: 404,
      message: "Job not found"
    });
  }

  const techId =
    auth.role === UserRole.TECHNICIAN
      ? await getTechnicianIdForUser(auth.userId)
      : null;
  assertTechnicianOwnsJob(job, techId, auth.role);

  assertValidStatusTransition(job.status, input.status);

  const updated = await prisma.job.update({
    where: { id },
    data: { status: input.status },
    include: detailInclude
  });
  if (input.status === JobStatus.COMPLETED) {
    try {
      await notificationService.notifyDispatchAlert({
        type: "READY_TO_INVOICE",
        title: "Job ready to invoice",
        message: `${updated.title} is completed and ready for invoicing.`,
        payload: { jobId: updated.id, customerId: updated.customerId }
      });
    } catch (error) {
      logger.warn("Failed to send ready-to-invoice notification", {
        jobId: updated.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return stripInternalNotesForTechnician(updated, auth.role);
}
