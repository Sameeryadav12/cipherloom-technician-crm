import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { nextRecurrenceDate } from "../automation/automation.utils.js";
import type {
  CreateRecurringJobTemplateBody,
  UpdateRecurringJobTemplateBody
} from "./recurring-jobs.schemas.js";

async function requireCustomerExists(customerId: string) {
  const row = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
  if (!row) throw new AppError({ statusCode: 400, message: "Customer not found" });
}

async function requireTechnicianExists(technicianId: string) {
  const row = await prisma.technician.findUnique({ where: { id: technicianId }, select: { id: true } });
  if (!row) throw new AppError({ statusCode: 400, message: "Technician not found" });
}

export async function listRecurringJobTemplates() {
  return prisma.recurringJobTemplate.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      customer: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
      _count: { select: { generatedJobs: true } }
    }
  });
}

export async function getRecurringJobTemplate(id: string) {
  const row = await prisma.recurringJobTemplate.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
      _count: { select: { generatedJobs: true } }
    }
  });
  if (!row) throw new AppError({ statusCode: 404, message: "Recurring template not found" });
  return row;
}

export async function createRecurringJobTemplate(input: CreateRecurringJobTemplateBody, createdByUserId: string) {
  await requireCustomerExists(input.customerId);
  if (input.technicianId) await requireTechnicianExists(input.technicianId);
  return prisma.recurringJobTemplate.create({
    data: {
      customerId: input.customerId,
      title: input.title,
      description: input.description,
      technicianId: input.technicianId,
      durationMinutes: input.durationMinutes,
      recurrencePattern: input.recurrencePattern,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: input.isActive,
      createdByUserId,
      nextRunAt: input.startDate
    },
    include: {
      customer: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
      _count: { select: { generatedJobs: true } }
    }
  });
}

export async function updateRecurringJobTemplate(id: string, input: UpdateRecurringJobTemplateBody) {
  const existing = await prisma.recurringJobTemplate.findUnique({ where: { id } });
  if (!existing) throw new AppError({ statusCode: 404, message: "Recurring template not found" });
  if (input.customerId) await requireCustomerExists(input.customerId);
  if (input.technicianId) await requireTechnicianExists(input.technicianId);
  const nextRunAt =
    input.startDate !== undefined
      ? input.startDate
      : existing.nextRunAt ?? nextRecurrenceDate(new Date(), existing.recurrencePattern);

  return prisma.recurringJobTemplate.update({
    where: { id },
    data: {
      ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.technicianId !== undefined ? { technicianId: input.technicianId } : {}),
      ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
      ...(input.recurrencePattern !== undefined ? { recurrencePattern: input.recurrencePattern } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      nextRunAt
    },
    include: {
      customer: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
      _count: { select: { generatedJobs: true } }
    }
  });
}

export async function deleteRecurringJobTemplate(id: string) {
  const existing = await prisma.recurringJobTemplate.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError({ statusCode: 404, message: "Recurring template not found" });
  await prisma.recurringJobTemplate.delete({ where: { id } });
}
