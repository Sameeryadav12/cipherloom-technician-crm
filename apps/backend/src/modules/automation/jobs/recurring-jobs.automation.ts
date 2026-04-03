import { JobStatus } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import { logger } from "../../../utils/logger.js";
import * as notificationService from "../../notifications/notification.service.js";
import { nextRecurrenceDate } from "../automation.utils.js";

export async function runRecurringJobsAutomation() {
  const now = new Date();
  const templates = await prisma.recurringJobTemplate.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }]
    },
    orderBy: [{ nextRunAt: "asc" }]
  });

  let created = 0;
  let skipped = 0;

  for (const template of templates) {
    if (!template.nextRunAt) {
      skipped += 1;
      continue;
    }
    const occurrenceDate = template.nextRunAt;
    const existing = await prisma.recurringJobOccurrence.findUnique({
      where: {
        templateId_occurrenceDate: {
          templateId: template.id,
          occurrenceDate
        }
      },
      select: { id: true }
    });
    if (existing) {
      skipped += 1;
      await prisma.recurringJobTemplate.update({
        where: { id: template.id },
        data: {
          nextRunAt: nextRecurrenceDate(occurrenceDate, template.recurrencePattern)
        }
      });
      continue;
    }

    const scheduledStart = new Date(occurrenceDate);
    scheduledStart.setHours(9, 0, 0, 0);
    const scheduledEnd = new Date(scheduledStart.getTime() + template.durationMinutes * 60_000);

    const createdData = await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          title: template.title,
          description: template.description,
          customerId: template.customerId,
          technicianId: template.technicianId,
          createdByUserId: template.createdByUserId,
          status: JobStatus.NEW,
          scheduledStart,
          scheduledEnd,
          recurringTemplateId: template.id,
          recurrenceOccurrenceDate: occurrenceDate
        }
      });

      await tx.recurringJobOccurrence.create({
        data: {
          templateId: template.id,
          occurrenceDate,
          generatedJobId: job.id
        }
      });

      await tx.recurringJobTemplate.update({
        where: { id: template.id },
        data: {
          lastGeneratedAt: now,
          nextRunAt: nextRecurrenceDate(occurrenceDate, template.recurrencePattern)
        }
      });

      return { jobId: job.id, title: job.title };
    });

    try {
      await notificationService.notifyDispatchAlert({
        title: "Recurring job created",
        message: `Automation created "${createdData.title}" from recurring template.`,
        payload: { jobId: createdData.jobId, recurringTemplateId: template.id }
      });
    } catch (error) {
      logger.warn("Failed to send recurring job notification", {
        recurringTemplateId: template.id,
        jobId: createdData.jobId,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    created += 1;
  }

  return { created, skipped };
}
