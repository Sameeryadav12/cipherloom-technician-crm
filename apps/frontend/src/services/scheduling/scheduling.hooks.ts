import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { ApiError } from "@/lib/api-client";
import { emitCalendarHighlightJob } from "@/lib/calendar-highlight";
import { useCreateJob, useUpdateJob } from "@/services/jobs/jobs.hooks";
import {
  checkSchedulingConflicts,
  suggestSchedule
} from "./scheduling.api";
import {
  buildConflictCheckRequest,
  buildJobMutationFromSuggestion
} from "./scheduling-execution";
import type { ConflictCheckRequest } from "@/types/calendar";
import type {
  SchedulingExecutionCommitInput,
  SchedulingExecutionResult,
  SchedulingRequest
} from "@/types/scheduling";

export function useScheduleSuggestions() {
  return useMutation({
    mutationFn: (payload: SchedulingRequest) => suggestSchedule(payload)
  });
}

/** Calendar-backed conflict check, exposed on the scheduling module for execution flows. */
export function useCheckSchedulingConflict() {
  return useMutation({
    mutationFn: (payload: ConflictCheckRequest) => checkSchedulingConflicts(payload)
  });
}

/**
 * Core scheduling execution: validate (optional conflict check) → create or reschedule job.
 * Side effects: job mutations (with shared invalidation), calendar highlight event on success.
 * Does not toast — callers own UX (preview dialog, automation, etc.).
 */
export function useSchedulingExecution() {
  const checkConflict = useCheckSchedulingConflict();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const commit = useCallback(
    async (input: SchedulingExecutionCommitInput): Promise<SchedulingExecutionResult> => {
      const { suggestion, request, skipConflictCheck, defaultPricingRuleId } = input;

      try {
        if (!skipConflictCheck) {
          const envelope = await checkConflict.mutateAsync(
            buildConflictCheckRequest(suggestion, request)
          );
          if (envelope.data.hasConflict && envelope.data.conflicts.length > 0) {
            return {
              ok: false,
              reason: "conflict",
              conflict: {
                items: envelope.data.conflicts,
                technicianName: suggestion.technician.name ?? "Technician"
              }
            };
          }
        }

        const built = buildJobMutationFromSuggestion(
          suggestion,
          request,
          defaultPricingRuleId ?? undefined
        );

        if (built.mode === "create") {
          const res = await createJob.mutateAsync(built.payload);
          emitCalendarHighlightJob({
            jobId: res.data.job.id,
            scheduledStart: suggestion.slot.start
          });
          return { ok: true, mode: "create", job: res.data.job };
        }

        const res = await updateJob.mutateAsync({
          id: built.jobId,
          payload: built.payload
        });
        emitCalendarHighlightJob({
          jobId: res.data.job.id,
          scheduledStart: suggestion.slot.start
        });
        return { ok: true, mode: "reschedule", job: res.data.job };
      } catch (e) {
        return {
          ok: false,
          reason: "error",
          message: e instanceof ApiError ? e.message : "Scheduling execution failed."
        };
      }
    },
    [checkConflict, createJob, updateJob]
  );

  const isBusy = useMemo(
    () => checkConflict.isPending || createJob.isPending || updateJob.isPending,
    [checkConflict.isPending, createJob.isPending, updateJob.isPending]
  );

  return {
    commit,
    isCheckingConflict: checkConflict.isPending,
    isCommittingJob: createJob.isPending || updateJob.isPending,
    isBusy
  };
}
