export type AutomationTaskKey =
  | "recurring_jobs"
  | "invoice_reminders"
  | "stale_jobs"
  | "dispatch_attention"
  | "auto_assignment_suggestions";

export type AutomationRunTaskResult = {
  taskKey: AutomationTaskKey;
  ok: boolean;
  created?: number;
  skipped?: number;
  details?: Record<string, unknown>;
  error?: string;
};
