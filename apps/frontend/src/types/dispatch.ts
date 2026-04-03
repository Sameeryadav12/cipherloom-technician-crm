import type { JobStatus } from "@/types/api";
import type { JobListItem } from "@/types/jobs";

export type DispatchQueueKey =
  | "unassigned"
  | "needs_scheduling"
  | "conflicted"
  | "starts_soon"
  | "ready_to_invoice"
  | "stale";

export type DispatchAssignmentState =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "NEEDS_REASSIGNMENT";

export type DispatchReasonCode =
  | "UNASSIGNED"
  | "MISSING_SCHEDULE"
  | "SCHEDULING_CONFLICT"
  | "TECHNICIAN_UNAVAILABLE"
  | "STARTS_SOON"
  | "READY_TO_INVOICE"
  | "AGING_JOB";

export type DispatchReason = {
  code: DispatchReasonCode;
  label: string;
  detail?: string;
  urgency: "low" | "medium" | "high";
};

export type DispatchAction =
  | "assign"
  | "reschedule"
  | "smart_schedule"
  | "open_job"
  | "update_status"
  | "generate_invoice";

export type DispatchQueueItem = {
  job: JobListItem;
  assignmentState: DispatchAssignmentState;
  reasons: DispatchReason[];
  queueKeys: DispatchQueueKey[];
  recommendedAction: DispatchAction;
  ageHours: number;
};

export type DispatchQueueEntry = {
  jobId: string;
  title: string;
  status: JobStatus;
  customerId: string;
  customerName: string;
  technicianId: string | null;
  technicianName: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  createdAt: string;
  reason: string;
};

export type DispatchQueueResponse = {
  unassigned: DispatchQueueEntry[];
  needsScheduling: DispatchQueueEntry[];
  conflicted: DispatchQueueEntry[];
  startsSoon: DispatchQueueEntry[];
  readyToInvoice: DispatchQueueEntry[];
  stale: DispatchQueueEntry[];
};

export type DispatchSummary = {
  total: number;
  unassigned: number;
  needsScheduling: number;
  conflicted: number;
  startsSoon: number;
  readyToInvoice: number;
  stale: number;
};

export type DispatchQueueFilters = {
  activeQueue: DispatchQueueKey | "all";
  search: string;
};

export type RescheduleJobContext = {
  jobId: string;
  title: string;
  customerId: string;
  customerName?: string | null;
  technicianId?: string | null;
  technicianName?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  status?: JobStatus;
  requiredSkills?: string[];
};
