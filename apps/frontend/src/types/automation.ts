export type AutomationRule = {
  id: string;
  key: string;
  name: string;
  isEnabled: boolean;
  config?: Record<string, unknown> | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AutomationRunLog = {
  id: string;
  taskKey: string;
  status: string;
  startedAt: string;
  finishedAt?: string | null;
  error?: string | null;
};

export type RecurrencePattern = "DAILY" | "WEEKLY" | "MONTHLY";

export type RecurringJobTemplate = {
  id: string;
  customerId: string;
  title: string;
  description?: string | null;
  technicianId?: string | null;
  durationMinutes: number;
  recurrencePattern: RecurrencePattern;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  lastGeneratedAt?: string | null;
  nextRunAt?: string | null;
  customer?: { id: string; name: string };
  technician?: { id: string; name: string } | null;
  _count?: { generatedJobs: number };
};
