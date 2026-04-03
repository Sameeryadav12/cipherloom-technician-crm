import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";
import type { ConflictCheckRequest, ConflictCheckResponse } from "@/types/calendar";
import type { SchedulingRequest, SchedulingResponse } from "@/types/scheduling";

export async function suggestSchedule(payload: SchedulingRequest) {
  return apiClient.post<ApiEnvelope<SchedulingResponse>>("/api/scheduling/suggest", payload);
}

/** Delegates to calendar conflict API — single backend contract for scheduling validation. */
export async function checkSchedulingConflicts(payload: ConflictCheckRequest) {
  const response = await apiClient.post<
    ApiEnvelope<{
      hasConflict: boolean;
      conflicts: Array<{
        type: "job" | "timeOff";
        id: string;
        title: string;
        start: string;
        end: string;
      }>;
    }>
  >("/api/scheduling/check-conflict", payload);

  return {
    ...response,
    data: {
      hasConflict: response.data.hasConflict,
      conflicts: response.data.conflicts.map((c) => ({
        ...c,
        type: c.type === "timeOff" ? "time_off" : "job",
        message: c.type === "timeOff" ? "Overlaps with time off." : "Overlaps with existing job."
      }))
    } satisfies ConflictCheckResponse
  };
}

export type { ConflictCheckRequest, ConflictCheckResponse };

