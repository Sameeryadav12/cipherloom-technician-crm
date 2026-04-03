import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignTechnician,
  createJob,
  deleteJob,
  getJobById,
  listJobs,
  listPricingRulesForJobs,
  updateJob,
  updateJobStatus,
  type JobsListParams
} from "./jobs.api";
import { calendarKeys } from "@/services/calendar/calendar.hooks";
import type { JobPayload } from "@/types/jobs";
import type { JobStatus } from "@/types/api";

export const jobKeys = {
  all: ["jobs"] as const,
  list: (params?: JobsListParams) => ["jobs", "list", params ?? {}] as const,
  detail: (id: string) => ["jobs", "detail", id] as const,
  pricingRules: ["jobs", "supporting", "pricing-rules"] as const
};

type ListQueryOptions = { enabled?: boolean };

export function useJobsList(params?: JobsListParams, options?: ListQueryOptions) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => listJobs(params),
    select: (response) => response.data,
    enabled: options?.enabled ?? true
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => getJobById(id),
    select: (response) => response.data.job,
    enabled: Boolean(id)
  });
}

export function usePricingRulesList() {
  return useQuery({
    queryKey: jobKeys.pricingRules,
    queryFn: listPricingRulesForJobs,
    select: (response) => response.data.items
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: JobPayload) => createJob(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    }
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<JobPayload> }) =>
      updateJob(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    }
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      void queryClient.removeQueries({ queryKey: jobKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useAssignTechnician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, technicianId }: { id: string; technicianId: string }) =>
      assignTechnician(id, technicianId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      updateJobStatus(id, status),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

