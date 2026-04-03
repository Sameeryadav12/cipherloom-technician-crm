import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope, PaginatedResponse } from "@/types/api";
import type { TimeOffEntry, TimeOffListParams } from "@/types/time-off";

function toQueryString(params?: TimeOffListParams) {
  const query = new URLSearchParams();
  if (!params) return "";
  if (params.technicianId) query.set("technicianId", params.technicianId);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.start) query.set("start", params.start);
  if (params.end) query.set("end", params.end);
  const value = query.toString();
  return value ? `?${value}` : "";
}

export type TimeOffPayload = {
  technicianId: string;
  start: string;
  end: string;
  reason?: string;
};

export async function listTimeOff(params?: TimeOffListParams) {
  return apiClient.get<ApiEnvelope<PaginatedResponse<TimeOffEntry>>>(
    `/api/time-off${toQueryString(params)}`
  );
}

export async function createTimeOff(payload: TimeOffPayload) {
  return apiClient.post<ApiEnvelope<{ timeOff: TimeOffEntry }>>("/api/time-off", payload);
}

export async function updateTimeOff(
  id: string,
  payload: Partial<TimeOffPayload>
) {
  return apiClient.patch<ApiEnvelope<{ timeOff: TimeOffEntry }>>(
    `/api/time-off/${id}`,
    payload
  );
}

export async function deleteTimeOff(id: string) {
  return apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(`/api/time-off/${id}`);
}

