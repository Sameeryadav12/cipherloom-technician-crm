/**
 * Pure scheduling execution helpers — no React, no side effects.
 * Used by hooks and tests; safe for future automation (dispatch queue, approvals, etc.).
 */
import type { ConflictCheckRequest } from "@/types/calendar";
import type { JobPayload } from "@/types/jobs";
import type {
  SchedulingExecutionMode,
  SchedulingRequest,
  SchedulingSuggestion,
  SchedulingSuggestionKey
} from "@/types/scheduling";

export function getSchedulingSuggestionKey(suggestion: SchedulingSuggestion): SchedulingSuggestionKey {
  return `${suggestion.technician.id}|${suggestion.slot.start}|${suggestion.slot.end}`;
}

export function getSchedulingExecutionMode(request: SchedulingRequest): SchedulingExecutionMode {
  return request.ignoreJobId?.trim() ? "reschedule" : "create";
}

export function buildConflictCheckRequest(
  suggestion: SchedulingSuggestion,
  request: SchedulingRequest
): ConflictCheckRequest {
  return {
    technicianId: suggestion.technician.id,
    start: suggestion.slot.start,
    end: suggestion.slot.end,
    ignoreJobId: request.ignoreJobId?.trim() || undefined
  };
}

/** Optional description for new jobs (skills + planned duration). */
export function buildSchedulingJobDescription(request: SchedulingRequest): string | undefined {
  const parts: string[] = [];
  if (request.requiredSkills?.length) {
    parts.push(`Target skills: ${request.requiredSkills.join(", ")}`);
  }
  parts.push(`Planned duration: ${request.durationMinutes} min`);
  return parts.length ? parts.join("\n") : undefined;
}

export type BuiltJobMutation =
  | { mode: "create"; payload: JobPayload }
  | { mode: "reschedule"; jobId: string; payload: Partial<JobPayload> };

/**
 * Maps assistant suggestion + original request into a create or reschedule mutation payload.
 * Reschedule updates schedule + assignment + title + customer so the slot is authoritative.
 */
export function buildJobMutationFromSuggestion(
  suggestion: SchedulingSuggestion,
  request: SchedulingRequest,
  defaultPricingRuleId?: string | null
): BuiltJobMutation {
  const start = suggestion.slot.start;
  const end = suggestion.slot.end;
  const technicianId = suggestion.technician.id;
  const title = request.title.trim();
  const customerId = request.customerId;

  const ignoreId = request.ignoreJobId?.trim();
  if (ignoreId) {
    return {
      mode: "reschedule",
      jobId: ignoreId,
      payload: {
        title,
        customerId,
        technicianId,
        scheduledStart: start,
        scheduledEnd: end
      }
    };
  }

  return {
    mode: "create",
    payload: {
      title,
      customerId,
      technicianId,
      scheduledStart: start,
      scheduledEnd: end,
      pricingRuleId: defaultPricingRuleId || undefined,
      description: buildSchedulingJobDescription(request)
    }
  };
}
