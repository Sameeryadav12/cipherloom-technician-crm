import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope, Job, JobStatus, PaginatedResponse } from "@/types/api";
import type { JobDetail, JobPayload, JobListItem, PricingRuleListItem } from "@/types/jobs";

export type JobsListParams = {
  page?: number;
  limit?: number;
  status?: JobStatus;
  technicianId?: string;
  customerId?: string;
  scheduledStartFrom?: string;
  scheduledStartTo?: string;
};

function toQueryString(params?: JobsListParams) {
  const query = new URLSearchParams();
  if (!params) return "";
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.technicianId) query.set("technicianId", params.technicianId);
  if (params.customerId) query.set("customerId", params.customerId);
  if (params.scheduledStartFrom) query.set("scheduledStartFrom", params.scheduledStartFrom);
  if (params.scheduledStartTo) query.set("scheduledStartTo", params.scheduledStartTo);
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function listJobs(params?: JobsListParams) {
  return apiClient.get<ApiEnvelope<PaginatedResponse<JobListItem>>>(
    `/api/jobs${toQueryString(params)}`
  );
}

export async function getJobById(id: string) {
  return apiClient.get<ApiEnvelope<{ job: JobDetail }>>(`/api/jobs/${id}`);
}

export async function createJob(payload: JobPayload) {
  return apiClient.post<ApiEnvelope<{ job: Job }>>("/api/jobs", payload);
}

export async function updateJob(id: string, payload: Partial<JobPayload>) {
  return apiClient.patch<ApiEnvelope<{ job: Job }>>(`/api/jobs/${id}`, payload);
}

export async function deleteJob(id: string) {
  return apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(`/api/jobs/${id}`);
}

export async function assignTechnician(id: string, technicianId: string) {
  return apiClient.post<ApiEnvelope<{ job: Job }>>(`/api/jobs/${id}/assign-technician`, {
    technicianId
  });
}

export async function updateJobStatus(id: string, status: JobStatus) {
  return apiClient.post<ApiEnvelope<{ job: Job }>>(`/api/jobs/${id}/status`, { status });
}

export async function listPricingRulesForJobs() {
  return apiClient.get<ApiEnvelope<PaginatedResponse<PricingRuleListItem>>>(
    "/api/settings/pricing-rules?page=1&limit=100&isActive=true"
  );
}

