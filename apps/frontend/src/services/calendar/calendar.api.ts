import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";
import type {
  CalendarApiResponse,
  CalendarQueryParams,
  ConflictCheckRequest,
  ConflictCheckResponse
} from "@/types/calendar";

function toCalendarQueryString(params: CalendarQueryParams) {
  const query = new URLSearchParams();
  query.set("start", params.start);
  query.set("end", params.end);
  if (params.technicianId) query.set("technicianId", params.technicianId);
  query.set("includeJobs", String(params.includeJobs));
  query.set("includeTimeOff", String(params.includeTimeOff));
  return `?${query.toString()}`;
}

export async function getCalendarEvents(params: CalendarQueryParams) {
  return apiClient.get<ApiEnvelope<CalendarApiResponse>>(
    `/api/calendar${toCalendarQueryString(params)}`
  );
}

export async function checkCalendarConflicts(payload: ConflictCheckRequest) {
  return apiClient.post<ApiEnvelope<ConflictCheckResponse>>(
    "/api/calendar/check-conflicts",
    payload
  );
}
