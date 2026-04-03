import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRecurringJob,
  deleteRecurringJob,
  getAutomationStatus,
  listAutomationRules,
  listRecurringJobs,
  runAutomation,
  updateAutomationRule,
  updateRecurringJob
} from "./automation.api";

export const automationKeys = {
  all: ["automation"] as const,
  rules: ["automation", "rules"] as const,
  status: ["automation", "status"] as const,
  recurring: ["automation", "recurring-jobs"] as const
};

export function useAutomationRules() {
  return useQuery({
    queryKey: automationKeys.rules,
    queryFn: listAutomationRules,
    select: (res) => res.data.rules
  });
}

export function useAutomationStatus() {
  return useQuery({
    queryKey: automationKeys.status,
    queryFn: getAutomationStatus,
    select: (res) => res.data
  });
}

export function useRunAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskKey?: string) => runAutomation(taskKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: automationKeys.all });
    }
  });
}

export function useUpdateAutomationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { isEnabled?: boolean } }) =>
      updateAutomationRule(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: automationKeys.all });
    }
  });
}

export function useRecurringJobs() {
  return useQuery({
    queryKey: automationKeys.recurring,
    queryFn: listRecurringJobs,
    select: (res) => res.data.items
  });
}

export function useCreateRecurringJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecurringJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: automationKeys.recurring });
    }
  });
}

export function useUpdateRecurringJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateRecurringJob>[1] }) =>
      updateRecurringJob(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: automationKeys.recurring });
    }
  });
}

export function useDeleteRecurringJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecurringJob(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: automationKeys.recurring });
    }
  });
}
