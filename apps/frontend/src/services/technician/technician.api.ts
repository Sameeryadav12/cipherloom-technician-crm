import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope, PaginatedResponse } from "@/types/api";
import type { JobListItem } from "@/types/jobs";
import type { TimeOffEntry } from "@/types/time-off";

export async function listMyTechnicianJobs(params?: { page?: number; limit?: number; start?: string; end?: string }) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.start) query.set("scheduledStartFrom", params.start);
  if (params?.end) query.set("scheduledStartTo", params.end);
  const value = query.toString();
  return apiClient.get<ApiEnvelope<PaginatedResponse<JobListItem>>>(`/api/jobs${value ? `?${value}` : ""}`);
}

export async function listMyTechnicianTimeOff(technicianId: string, params?: { start?: string; end?: string }) {
  const query = new URLSearchParams();
  query.set("technicianId", technicianId);
  if (params?.start) query.set("start", params.start);
  if (params?.end) query.set("end", params.end);
  return apiClient.get<ApiEnvelope<PaginatedResponse<TimeOffEntry>>>(`/api/time-off?${query.toString()}`);
}
