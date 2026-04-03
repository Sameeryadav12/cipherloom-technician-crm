export type CalendarEventType = "job" | "time_off";

export type CalendarEventItem = {
  id: string;
  type: CalendarEventType;
  title: string;
  start: string;
  end: string;
  technicianId: string;
  technicianName: string;
  status?: string;
  color?: string | null;
  meta: Record<string, unknown>;
};

export type CalendarQueryParams = {
  start: string;
  end: string;
  technicianId?: string;
  includeJobs: boolean;
  includeTimeOff: boolean;
};

export type CalendarApiResponse = {
  range: {
    start: string;
    end: string;
  };
  events: CalendarEventItem[];
};

export type ConflictCheckRequest = {
  technicianId: string;
  start: string;
  end: string;
  ignoreJobId?: string;
  ignoreTimeOffId?: string;
};

export type ConflictItem = {
  type: CalendarEventType;
  id: string;
  title: string;
  start: string;
  end: string;
  message: string;
};

export type ConflictCheckResponse = {
  hasConflict: boolean;
  conflicts: ConflictItem[];
};
