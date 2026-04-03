import { JobStatus } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import * as notificationService from "../../notifications/notification.service.js";

const STALE_NEW_HOURS = 24;
const STALE_COMPLETED_NO_INVOICE_HOURS = 24;

export async function runStaleJobsAutomation() {
  const now = new Date();
  const staleNewCutoff = new Date(now.getTime() - STALE_NEW_HOURS * 3_600_000);
  const staleCompletedCutoff = new Date(
    now.getTime() - STALE_COMPLETED_NO_INVOICE_HOURS * 3_600_000
  );

  const [staleNew, staleCompletedNoInvoice] = await Promise.all([
    prisma.job.findMany({
      where: { status: JobStatus.NEW, createdAt: { lte: staleNewCutoff } },
      select: { id: true, title: true }
    }),
    prisma.job.findMany({
      where: {
        status: JobStatus.COMPLETED,
        updatedAt: { lte: staleCompletedCutoff },
        invoice: null
      },
      select: { id: true, title: true }
    })
  ]);

  let created = 0;
  let skipped = 0;

  for (const job of [...staleNew, ...staleCompletedNoInvoice]) {
    const type = staleNew.some((j) => j.id === job.id)
      ? "stale_new_job_alert"
      : "stale_completed_no_invoice_alert";
    const eventKey = `${type}:${job.id}:${now.toISOString().slice(0, 10)}`;
    const exists = await prisma.automationEventLog.findUnique({ where: { eventKey }, select: { id: true } });
    if (exists) {
      skipped += 1;
      continue;
    }
    await prisma.automationEventLog.create({
      data: { eventKey, eventType: type, entityType: "job", entityId: job.id }
    });
    await notificationService.notifyDispatchAlert({
      type: "DISPATCH_ALERT",
      title: "Job requires attention",
      message: `${job.title} needs operational follow-up.`,
      payload: { jobId: job.id, attentionType: type }
    });
    created += 1;
  }

  return { created, skipped };
}
