import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";

export type DashboardAggregates = {
  totalJobs: number;
  jobsToday: number;
  unassignedJobs: number;
  completedJobs: number;
  overdueInvoices: number;
  techniciansOnLeaveToday: number;
};

export async function getDashboardAggregates() {
  return apiClient.get<ApiEnvelope<DashboardAggregates>>("/api/aggregates/dashboard");
}
