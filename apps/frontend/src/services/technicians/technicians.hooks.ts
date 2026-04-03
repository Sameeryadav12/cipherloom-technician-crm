import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTechnician,
  deleteTechnician,
  getTechnicianById,
  listTechnicians,
  updateTechnician,
  type TechniciansListParams
} from "./technicians.api";
import type { TechnicianPayload } from "@/types/technicians";

export const technicianKeys = {
  all: ["technicians"] as const,
  list: (params?: TechniciansListParams) => ["technicians", "list", params ?? {}] as const,
  detail: (id: string) => ["technicians", "detail", id] as const
};

type ListQueryOptions = { enabled?: boolean };

export function useTechniciansList(params?: TechniciansListParams, options?: ListQueryOptions) {
  return useQuery({
    queryKey: technicianKeys.list(params),
    queryFn: () => listTechnicians(params),
    select: (response) => response.data,
    enabled: options?.enabled ?? true
  });
}

export function useTechnician(id: string) {
  return useQuery({
    queryKey: technicianKeys.detail(id),
    queryFn: () => getTechnicianById(id),
    select: (response) => response.data.technician,
    enabled: Boolean(id)
  });
}

export function useCreateTechnician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TechnicianPayload) => createTechnician(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: technicianKeys.all });
    }
  });
}

export function useUpdateTechnician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TechnicianPayload> }) =>
      updateTechnician(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: technicianKeys.all });
      void queryClient.invalidateQueries({ queryKey: technicianKeys.detail(variables.id) });
    }
  });
}

export function useDeleteTechnician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTechnician(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: technicianKeys.all });
      void queryClient.removeQueries({ queryKey: technicianKeys.detail(id) });
    }
  });
}

