import type { InvoiceStatus, JobStatus } from "@/types/api";
import type { InvoiceListItem } from "@/types/invoices";
import type { JobListItem } from "@/types/jobs";

const OPEN_JOB_STATUSES: JobStatus[] = ["NEW", "SCHEDULED", "IN_PROGRESS"];
const UNPAID_INVOICE: InvoiceStatus[] = ["DRAFT", "SENT", "OVERDUE"];

export type CustomerOpsSummary = {
  openJobs: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  completedJobs: number;
  latestJobAt: string | null;
  lastActivityAt: string | null;
};

function maxIso(a: string | null, b: string | undefined | null): string | null {
  if (!b) return a;
  if (!a) return b;
  return new Date(b).getTime() > new Date(a).getTime() ? b : a;
}

/** Build per-customer rollups from recent jobs and invoices (client-side; bounded fetch). */
export function buildCustomerOpsMap(
  jobs: JobListItem[],
  invoices: InvoiceListItem[]
): Map<string, CustomerOpsSummary> {
  const map = new Map<string, CustomerOpsSummary>();

  const touch = (customerId: string): CustomerOpsSummary => {
    let row = map.get(customerId);
    if (!row) {
      row = {
        openJobs: 0,
        unpaidInvoices: 0,
        overdueInvoices: 0,
        completedJobs: 0,
        latestJobAt: null,
        lastActivityAt: null
      };
      map.set(customerId, row);
    }
    return row;
  };

  for (const job of jobs) {
    const row = touch(job.customerId);
    if (OPEN_JOB_STATUSES.includes(job.status)) row.openJobs += 1;
    if (job.status === "COMPLETED" || job.status === "INVOICED") row.completedJobs += 1;
    row.latestJobAt = maxIso(row.latestJobAt, job.updatedAt ?? job.createdAt);
    row.lastActivityAt = maxIso(row.lastActivityAt, job.updatedAt ?? job.createdAt);
  }

  const now = Date.now();
  for (const inv of invoices) {
    const cid = inv.job?.customer?.id;
    if (!cid) continue;
    const row = touch(cid);
    if (UNPAID_INVOICE.includes(inv.status)) row.unpaidInvoices += 1;
    const pastDue =
      inv.status === "OVERDUE" ||
      (inv.status !== "PAID" &&
        inv.status !== "VOID" &&
        inv.dueAt &&
        new Date(inv.dueAt).getTime() < now);
    if (pastDue) row.overdueInvoices += 1;
    row.lastActivityAt = maxIso(row.lastActivityAt, inv.updatedAt ?? inv.issuedAt ?? inv.createdAt);
  }

  return map;
}
