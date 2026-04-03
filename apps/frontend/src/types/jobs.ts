import type { Job, JobStatus, PaginatedResponse } from "@/types/api";

export type JobListItem = Job & {
  pricingRuleId?: string | null;
  pricingRule?: {
    id: string;
    name: string;
  } | null;
};

export type JobDetail = JobListItem;

export type JobFormValues = {
  title: string;
  customerId: string;
  technicianId: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  pricingRuleId: string;
};

export type JobPayload = {
  title: string;
  customerId: string;
  technicianId?: string;
  description?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  pricingRuleId?: string;
};

export type JobListParams = {
  page?: number;
  limit?: number;
  status?: JobStatus;
  technicianId?: string;
  customerId?: string;
  scheduledStartFrom?: string;
  scheduledStartTo?: string;
};

export type AssignTechnicianValues = {
  technicianId: string;
};

export type UpdateJobStatusValues = {
  status: JobStatus;
};

export type JobListResponse = PaginatedResponse<JobListItem>;

export type PricingRuleListItem = {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
};

