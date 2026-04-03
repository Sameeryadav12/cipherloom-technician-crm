import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTechniciansList } from "@/services/technicians/technicians.hooks";
import { useUpdateJobStatus } from "@/services/jobs/jobs.hooks";
import { listMyTechnicianJobs, listMyTechnicianTimeOff } from "./technician.api";

export const technicianExperienceKeys = {
  all: ["technician-experience"] as const,
  jobs: (params?: { page?: number; limit?: number; start?: string; end?: string }) =>
    ["technician-experience", "jobs", params ?? {}] as const,
  timeOff: (technicianId: string, params?: { start?: string; end?: string }) =>
    ["technician-experience", "time-off", technicianId, params ?? {}] as const
};

export function useMyTechnicianContext() {
  const auth = useAuth();
  const technicians = useTechniciansList({ page: 1, limit: 200, isActive: true });
  const technician = useMemo(
    () => (technicians.data?.items ?? []).find((t) => t.linkedUser?.id === auth.user?.id) ?? null,
    [auth.user?.id, technicians.data?.items]
  );
  return { technician, isLoading: technicians.isLoading };
}

export function useMyTechnicianJobs(params?: { page?: number; limit?: number; start?: string; end?: string }) {
  return useQuery({
    queryKey: technicianExperienceKeys.jobs(params),
    queryFn: () => listMyTechnicianJobs(params),
    select: (res) => res.data
  });
}

export function useMyTechnicianTimeOff(params?: { start?: string; end?: string }) {
  const ctx = useMyTechnicianContext();
  return useQuery({
    queryKey: technicianExperienceKeys.timeOff(ctx.technician?.id ?? "none", params),
    queryFn: () => listMyTechnicianTimeOff(ctx.technician!.id, params),
    select: (res) => res.data,
    enabled: Boolean(ctx.technician?.id)
  });
}

export function useTechnicianStatusActions() {
  const statusMutation = useUpdateJobStatus();
  const startJob = useMutation({
    mutationFn: (jobId: string) => statusMutation.mutateAsync({ id: jobId, status: "IN_PROGRESS" })
  });
  const completeJob = useMutation({
    mutationFn: (jobId: string) => statusMutation.mutateAsync({ id: jobId, status: "COMPLETED" })
  });
  return {
    startJob,
    completeJob,
    isPending: startJob.isPending || completeJob.isPending || statusMutation.isPending
  };
}
