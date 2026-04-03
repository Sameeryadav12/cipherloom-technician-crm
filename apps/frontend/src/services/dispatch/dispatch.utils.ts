import type { InvoiceListItem } from "@/types/invoices";
import type { JobListItem } from "@/types/jobs";
import type {
  DispatchAssignmentState,
  DispatchQueueItem,
  DispatchQueueKey,
  DispatchReason,
  DispatchSummary
} from "@/types/dispatch";

const STALE_HOURS = 48;
const STARTS_SOON_HOURS = 24;

function toHoursDiff(fromIso?: string | null, now = new Date()) {
  if (!fromIso) return Number.POSITIVE_INFINITY;
  const value = new Date(fromIso);
  if (Number.isNaN(value.getTime())) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - value.getTime()) / 3_600_000);
}

function toHoursUntil(targetIso?: string | null, now = new Date()) {
  if (!targetIso) return Number.POSITIVE_INFINITY;
  const value = new Date(targetIso);
  if (Number.isNaN(value.getTime())) return Number.POSITIVE_INFINITY;
  return (value.getTime() - now.getTime()) / 3_600_000;
}

function inferAssignmentState(job: JobListItem): DispatchAssignmentState {
  if (!job.technicianId) return "UNASSIGNED";
  if (!job.scheduledStart || !job.scheduledEnd) return "NEEDS_REASSIGNMENT";
  if (job.status === "SCHEDULED") return "PENDING_CONFIRMATION";
  if (job.status === "IN_PROGRESS" || job.status === "COMPLETED" || job.status === "INVOICED") {
    return "CONFIRMED";
  }
  return "ASSIGNED";
}

function hasInvoice(jobId: string, invoices: InvoiceListItem[]) {
  return invoices.some((invoice) => invoice.jobId === jobId);
}

export function deriveDispatchQueueItems(
  jobs: JobListItem[],
  invoices: InvoiceListItem[],
  now = new Date()
): DispatchQueueItem[] {
  return jobs
    .map((job): DispatchQueueItem => {
      const reasons: DispatchReason[] = [];
      const queueKeys = new Set<DispatchQueueKey>();
      const ageHours = toHoursDiff(job.createdAt, now);
      const startsInHours = toHoursUntil(job.scheduledStart, now);
      const scheduledMissing = !job.scheduledStart || !job.scheduledEnd;
      const isUnassigned = !job.technicianId;
      const isStale = (job.status === "NEW" || job.status === "SCHEDULED") && ageHours >= STALE_HOURS;
      const readyToInvoice = job.status === "COMPLETED" && !hasInvoice(job.id, invoices);
      const startsSoon =
        job.status === "SCHEDULED" &&
        Number.isFinite(startsInHours) &&
        startsInHours >= 0 &&
        startsInHours <= STARTS_SOON_HOURS;
      const conflictRisk = Boolean(job.technicianId && job.scheduledStart && job.scheduledEnd && job.status === "SCHEDULED");

      if (isUnassigned) {
        queueKeys.add("unassigned");
        reasons.push({
          code: "UNASSIGNED",
          label: "Unassigned",
          detail: "No technician is assigned yet.",
          urgency: "high"
        });
      }
      if (scheduledMissing) {
        queueKeys.add("needs_scheduling");
        reasons.push({
          code: "MISSING_SCHEDULE",
          label: "Needs scheduling",
          detail: "Missing start or end schedule window.",
          urgency: "high"
        });
      }
      if (conflictRisk) {
        queueKeys.add("conflicted");
        reasons.push({
          code: "SCHEDULING_CONFLICT",
          label: "Conflict risk",
          detail: "Requires conflict validation before dispatch.",
          urgency: "medium"
        });
      }
      if (startsSoon) {
        queueKeys.add("starts_soon");
        reasons.push({
          code: "STARTS_SOON",
          label: "Starts soon",
          detail: "Scheduled to start in the next 24 hours.",
          urgency: "medium"
        });
      }
      if (readyToInvoice) {
        queueKeys.add("ready_to_invoice");
        reasons.push({
          code: "READY_TO_INVOICE",
          label: "Ready to invoice",
          detail: "Completed job has no invoice record.",
          urgency: "low"
        });
      }
      if (isStale) {
        queueKeys.add("stale");
        reasons.push({
          code: "AGING_JOB",
          label: "Aging",
          detail: "Job stayed NEW/SCHEDULED for more than 48h.",
          urgency: "medium"
        });
      }

      const recommendedAction = isUnassigned || scheduledMissing
        ? "smart_schedule"
        : readyToInvoice
          ? "generate_invoice"
          : "reschedule";

      return {
        job,
        assignmentState: inferAssignmentState(job),
        reasons,
        queueKeys: Array.from(queueKeys),
        recommendedAction,
        ageHours
      };
    })
    .filter((item) => item.reasons.length > 0)
    .sort((a, b) => {
      const aHigh = a.reasons.some((r) => r.urgency === "high") ? 1 : 0;
      const bHigh = b.reasons.some((r) => r.urgency === "high") ? 1 : 0;
      if (aHigh !== bHigh) return bHigh - aHigh;
      return b.ageHours - a.ageHours;
    });
}

export function deriveDispatchSummary(items: DispatchQueueItem[]): DispatchSummary {
  return {
    total: items.length,
    unassigned: items.filter((i) => i.queueKeys.includes("unassigned")).length,
    needsScheduling: items.filter((i) => i.queueKeys.includes("needs_scheduling")).length,
    conflicted: items.filter((i) => i.queueKeys.includes("conflicted")).length,
    startsSoon: items.filter((i) => i.queueKeys.includes("starts_soon")).length,
    readyToInvoice: items.filter((i) => i.queueKeys.includes("ready_to_invoice")).length,
    stale: items.filter((i) => i.queueKeys.includes("stale")).length
  };
}
