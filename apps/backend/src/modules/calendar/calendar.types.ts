import type { UserRole } from "@prisma/client";

export type CalendarAuthContext = {
  userId: string;
  role: UserRole;
};

export type CalendarEventType = "job" | "time_off";

export type CalendarEvent = {
  id: string;
  type: CalendarEventType;
  title: string;
  start: Date;
  end: Date;
  technicianId: string;
  technicianName: string;
  status?: string;
  color?: string | null;
  meta: Record<string, unknown>;
};

export type CalendarConflict = {
  type: CalendarEventType;
  id: string;
  title: string;
  start: Date;
  end: Date;
  message: string;
};

