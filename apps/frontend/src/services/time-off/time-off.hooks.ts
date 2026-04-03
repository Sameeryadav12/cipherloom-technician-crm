import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTimeOff,
  deleteTimeOff,
  listTimeOff,
  updateTimeOff,
  type TimeOffPayload
} from "./time-off.api";
import type { TimeOffListParams } from "@/types/time-off";
import { technicianKeys } from "@/services/technicians/technicians.hooks";

export const timeOffKeys = {
  all: ["time-off"] as const,
  list: (params?: TimeOffListParams) => ["time-off", "list", params ?? {}] as const
};

type ListQueryOptions = { enabled?: boolean };

export function useTimeOffList(params?: TimeOffListParams, options?: ListQueryOptions) {
  return useQuery({
    queryKey: timeOffKeys.list(params),
    queryFn: () => listTimeOff(params),
    select: (response) => response.data,
    enabled: options?.enabled ?? true
  });
}

export function useCreateTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TimeOffPayload) => createTimeOff(payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: timeOffKeys.all });
      void queryClient.invalidateQueries({
        queryKey: technicianKeys.detail(variables.technicianId)
      });
    }
  });
}

export function useUpdateTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TimeOffPayload> }) =>
      updateTimeOff(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timeOffKeys.all });
      void queryClient.invalidateQueries({ queryKey: technicianKeys.all });
    }
  });
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTimeOff(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timeOffKeys.all });
      void queryClient.invalidateQueries({ queryKey: technicianKeys.all });
    }
  });
}

