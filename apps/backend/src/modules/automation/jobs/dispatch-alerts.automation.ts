import { JobStatus } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import * as notificationService from "../../notifications/notification.service.js";

export async function runDispatchAttentionAutomation() {
  const now = new Date();
  const soon = new Date(now.getTime() + 6 * 3_600_000);
  const jobs = await prisma.job.findMany({
    where: {
      status: { in: [JobStatus.NEW, JobStatus.SCHEDULED] },
      technicianId: null,
      scheduledStart: { not: null, lte: soon, gte: now }
    },
    select: { id: true, title: true, scheduledStart: true }
  });
  let created = 0;
  let skipped = 0;
  for (const job of jobs) {
    const eventKey = `dispatch_attention_unassigned_soon:${job.id}:${now.toISOString().slice(0, 10)}`;
    const exists = await prisma.automationEventLog.findUnique({ where: { eventKey }, select: { id: true } });
    if (exists) {
      skipped += 1;
      continue;
    }
    await prisma.automationEventLog.create({
      data: { eventKey, eventType: "dispatch_attention_unassigned_soon", entityType: "job", entityId: job.id }
    });
    await notificationService.notifyDispatchAlert({
      type: "DISPATCH_ALERT",
      title: "Job starts soon and is unassigned",
      message: `${job.title} starts soon without technician assignment.`,
      payload: { jobId: job.id, scheduledStart: job.scheduledStart?.toISOString() }
    });
    created += 1;
  }
  return { created, skipped };
}
