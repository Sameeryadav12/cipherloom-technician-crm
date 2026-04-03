import type { Job } from "@/types/api";
import type { ConflictItem } from "@/types/calendar";

export type SchedulingServiceAddress = {
  suburb?: string;
  state?: string;
  postcode?: string;
};

export type SchedulingRequest = {
  customerId: string;
  title: string;
  durationMinutes: number;
  preferredStart?: string;
  preferredEnd?: string;
  technicianId?: string;
  requiredSkills?: string[];
  serviceAddress?: SchedulingServiceAddress;
  ignoreJobId?: string;
};

export type SchedulingSearchWindow = {
  start: string;
  end: string;
};

export type SchedulingSuggestionTechnician = {
  id: string;
  name?: string;
  color?: string | null;
  skills?: string[] | null;
};

export type SchedulingSuggestionSlot = {
  start: string;
  end: string;
};

export type SchedulingSuggestion = {
  rank?: number;
  score?: number;
  reason?: string;
  technician: SchedulingSuggestionTechnician;
  slot: SchedulingSuggestionSlot;
};

export type SchedulingResponse = {
  suggestions?: SchedulingSuggestion[];
  searchWindow?: SchedulingSearchWindow;
  effectiveSearchWindow?: SchedulingSearchWindow;
};

export type SchedulingRequestFormValues = {
  customerId: string;
  title: string;
  durationMinutes: string;
  preferredStart: string;
  preferredEnd: string;
  technicianId: string;
  requiredSkills: string[];
  serviceSuburb: string;
  serviceState: string;
  servicePostcode: string;
  ignoreJobId: string;
};

/** How scheduling execution will mutate jobs. */
export type SchedulingExecutionMode = "create" | "reschedule";

/** Stable key for a suggestion row (loading / identity). */
export type SchedulingSuggestionKey = string;

/** Input required to run validation + commit (after user confirms in preview). */
export type SchedulingExecutionCommitInput = {
  suggestion: SchedulingSuggestion;
  request: SchedulingRequest;
  /** When true, skip conflict API (used only after explicit dispatcher override). */
  skipConflictCheck?: boolean;
  defaultPricingRuleId?: string | null;
};

/** Normalized conflict payload for UI (calendar API stays source of truth). */
export type SchedulingConflictSummary = {
  items: ConflictItem[];
  technicianName: string;
};

export type SchedulingExecutionResult =
  | {
      ok: true;
      mode: SchedulingExecutionMode;
      job: Job;
    }
  | {
      ok: false;
      reason: "conflict";
      conflict: SchedulingConflictSummary;
    }
  | {
      ok: false;
      reason: "error";
      message: string;
    };

/** Draft opened from UI before preview dialog (suggestion + request context). */
export type SchedulingExecutionDraft = {
  suggestion: SchedulingSuggestion;
  request: SchedulingRequest;
};
