import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";
import type { AutomationRule, AutomationRunLog, RecurringJobTemplate } from "@/types/automation";

export async function listAutomationRules() {
  return apiClient.get<ApiEnvelope<{ rules: AutomationRule[] }>>("/api/automation/rules");
}

export async function updateAutomationRule(
  id: string,
  payload: { isEnabled?: boolean; config?: Record<string, unknown>; nextRunAt?: string }
) {
  return apiClient.patch<ApiEnvelope<{ rule: AutomationRule }>>(`/api/automation/rules/${id}`, payload);
}

export async function runAutomation(taskKey?: string) {
  return apiClient.post<ApiEnvelope<{ ranAt: string; results: unknown[] }>>("/api/automation/run", taskKey ? { taskKey } : {});
}

export async function getAutomationStatus() {
  return apiClient.get<ApiEnvelope<{ rules: AutomationRule[]; recentRuns: AutomationRunLog[] }>>("/api/automation/status");
}

export async function listRecurringJobs() {
  return apiClient.get<ApiEnvelope<{ items: RecurringJobTemplate[] }>>("/api/recurring-jobs");
}

export async function createRecurringJob(payload: {
  customerId: string;
  title: string;
  description?: string;
  technicianId?: string;
  durationMinutes: number;
  recurrencePattern: "DAILY" | "WEEKLY" | "MONTHLY";
  startDate: string;
  endDate?: string;
  isActive: boolean;
}) {
  return apiClient.post<ApiEnvelope<{ item: RecurringJobTemplate }>>("/api/recurring-jobs", payload);
}

export async function updateRecurringJob(
  id: string,
  payload: Partial<{
    customerId: string;
    title: string;
    description?: string;
    technicianId?: string;
    durationMinutes: number;
    recurrencePattern: "DAILY" | "WEEKLY" | "MONTHLY";
    startDate: string;
    endDate?: string;
    isActive: boolean;
  }>
) {
  return apiClient.patch<ApiEnvelope<{ item: RecurringJobTemplate }>>(`/api/recurring-jobs/${id}`, payload);
}

export async function deleteRecurringJob(id: string) {
  return apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(`/api/recurring-jobs/${id}`);
}
