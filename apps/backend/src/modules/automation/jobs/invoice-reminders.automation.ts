import { InvoiceStatus } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import * as notificationService from "../../notifications/notification.service.js";

const DUE_SOON_DAYS = 2;

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function runInvoiceRemindersAutomation() {
  const now = new Date();
  const dueSoonUpper = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 3_600_000);

  const invoices = await prisma.invoice.findMany({
    where: {
      dueAt: { not: null, lte: dueSoonUpper },
      status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.OVERDUE] }
    },
    include: { job: { select: { id: true, title: true } } }
  });

  let created = 0;
  let skipped = 0;

  for (const invoice of invoices) {
    if (!invoice.dueAt) continue;
    const isOverdue = invoice.dueAt < now || invoice.status === InvoiceStatus.OVERDUE;
    const eventType = isOverdue ? "invoice_overdue_reminder" : "invoice_due_soon_reminder";
    const eventKey = `${eventType}:${invoice.id}:${dayKey(now)}`;

    const existing = await prisma.automationEventLog.findUnique({ where: { eventKey }, select: { id: true } });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.automationEventLog.create({
      data: {
        eventKey,
        eventType,
        entityType: "invoice",
        entityId: invoice.id,
        payload: { dueAt: invoice.dueAt.toISOString(), status: invoice.status }
      }
    });

    await notificationService.notifyDispatchAlert({
      type: isOverdue ? "INVOICE_OVERDUE" : "INVOICE_DUE",
      title: isOverdue ? "Invoice overdue reminder" : "Invoice due soon reminder",
      message: `${invoice.job?.title ?? "Invoice job"} ${isOverdue ? "is overdue" : "is due soon"}.`,
      payload: { invoiceId: invoice.id, jobId: invoice.jobId, dueAt: invoice.dueAt.toISOString() }
    });
    created += 1;
  }

  return { created, skipped };
}
