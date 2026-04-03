import { JobStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { checkSchedulingConflict } from "../scheduling/scheduling.service.js";
import { DISPATCH_STALE_HOURS, DISPATCH_STARTS_SOON_HOURS } from "./dispatch.constants.js";

type DispatchJob = {
  id: string;
  title: string;
  status: JobStatus;
  customerId: string;
  customer: { id: string; name: string };
  technicianId: string | null;
  technician: { id: string; name: string } | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  createdAt: Date;
  invoice: { id: string } | null;
};

function ageHours(createdAt: Date, now: Date) {
  return (now.getTime() - createdAt.getTime()) / 3_600_000;
}

function toQueueItem(job: DispatchJob, reason: string) {
  return {
    jobId: job.id,
    title: job.title,
    status: job.status,
    customerId: job.customerId,
    customerName: job.customer.name,
    technicianId: job.technicianId,
    technicianName: job.technician?.name ?? "Unassigned",
    scheduledStart: job.scheduledStart,
    scheduledEnd: job.scheduledEnd,
    createdAt: job.createdAt,
    reason
  };
}

export async function getDispatchQueue() {
  const jobs = await prisma.job.findMany({
    where: { status: { not: JobStatus.CANCELLED } },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      status: true,
      customerId: true,
      customer: { select: { id: true, name: true } },
      technicianId: true,
      technician: { select: { id: true, name: true } },
      scheduledStart: true,
      scheduledEnd: true,
      createdAt: true,
      invoice: { select: { id: true } }
    }
  });

  const now = new Date();
  const startsSoonBoundary = new Date(now.getTime() + DISPATCH_STARTS_SOON_HOURS * 3_600_000);

  const unassigned: ReturnType<typeof toQueueItem>[] = [];
  const needsScheduling: ReturnType<typeof toQueueItem>[] = [];
  const conflicted: ReturnType<typeof toQueueItem>[] = [];
  const startsSoon: ReturnType<typeof toQueueItem>[] = [];
  const readyToInvoice: ReturnType<typeof toQueueItem>[] = [];
  const stale: ReturnType<typeof toQueueItem>[] = [];

  for (const job of jobs) {
    if (!job.technicianId) {
      unassigned.push(toQueueItem(job, "Unassigned technician"));
    }
    if (!job.scheduledStart || !job.scheduledEnd || job.status === JobStatus.NEW) {
      needsScheduling.push(toQueueItem(job, "Missing or incomplete schedule"));
    }
    if (
      job.technicianId &&
      job.scheduledStart &&
      job.scheduledEnd &&
      (job.status === JobStatus.SCHEDULED || job.status === JobStatus.NEW)
    ) {
      const conflict = await checkSchedulingConflict({
        technicianId: job.technicianId,
        start: job.scheduledStart,
        end: job.scheduledEnd,
        ignoreJobId: job.id
      });
      if (conflict.hasConflict) {
        conflicted.push(toQueueItem(job, "Overlaps with another job or time-off"));
      }
    }
    if (
      job.scheduledStart &&
      job.status === JobStatus.SCHEDULED &&
      job.scheduledStart >= now &&
      job.scheduledStart <= startsSoonBoundary
    ) {
      startsSoon.push(toQueueItem(job, `Starts in next ${DISPATCH_STARTS_SOON_HOURS}h`));
    }
    if (job.status === JobStatus.COMPLETED && !job.invoice) {
      readyToInvoice.push(toQueueItem(job, "Completed but invoice not generated"));
    }
    if (
      (job.status === JobStatus.NEW || job.status === JobStatus.SCHEDULED) &&
      ageHours(job.createdAt, now) > DISPATCH_STALE_HOURS
    ) {
      stale.push(toQueueItem(job, `Aging more than ${DISPATCH_STALE_HOURS}h`));
    }
  }

  return {
    unassigned,
    needsScheduling,
    conflicted,
    startsSoon,
    readyToInvoice,
    stale
  };
}
