import { JobStatus } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import * as notificationService from "../../notifications/notification.service.js";
import { checkSchedulingConflict } from "../../scheduling/scheduling.service.js";

export async function runAutoAssignmentSuggestionAutomation() {
  const jobs = await prisma.job.findMany({
    where: {
      status: JobStatus.NEW,
      technicianId: null,
      scheduledStart: { not: null },
      scheduledEnd: { not: null }
    },
    include: { customer: { select: { id: true, name: true } } },
    take: 50
  });
  let created = 0;
  let skipped = 0;
  for (const job of jobs) {
    if (!job.scheduledStart || !job.scheduledEnd) continue;
    const technicians = await prisma.technician.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    const available: Array<{ id: string; name: string }> = [];
    for (const tech of technicians) {
      const conflict = await checkSchedulingConflict({
        technicianId: tech.id,
        start: job.scheduledStart,
        end: job.scheduledEnd
      });
      if (!conflict.hasConflict) available.push(tech);
      if (available.length > 1) break;
    }
    if (available.length !== 1) {
      skipped += 1;
      continue;
    }
    const tech = available[0];
    if (!tech) {
      skipped += 1;
      continue;
    }
    const eventKey = `auto_assignment_suggestion:${job.id}:${tech.id}`;
    const exists = await prisma.automationEventLog.findUnique({ where: { eventKey }, select: { id: true } });
    if (exists) {
      skipped += 1;
      continue;
    }
    await prisma.automationEventLog.create({
      data: {
        eventKey,
        eventType: "auto_assignment_suggestion",
        entityType: "job",
        entityId: job.id,
        payload: { suggestedTechnicianId: tech.id }
      }
    });
    await notificationService.notifyDispatchAlert({
      type: "DISPATCH_ALERT",
      title: "Auto-assignment recommendation",
      message: `Only one available technician found for ${job.title}: ${tech.name}.`,
      payload: { jobId: job.id, suggestedTechnicianId: tech.id, customerId: job.customerId }
    });
    created += 1;
  }
  return { created, skipped };
}
