import type { CalendarConflict, CalendarEvent } from "./calendar.types.js";

export function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && endA > startB;
}

export function buildJobCalendarEvent(input: {
  jobId: string;
  title: string;
  start: Date;
  end: Date;
  technicianId: string;
  technicianName: string;
  technicianColor?: string | null;
  status: string;
  customerId: string;
  customerName: string;
}): CalendarEvent {
  return {
    id: `job:${input.jobId}`,
    type: "job",
    title: input.title,
    start: input.start,
    end: input.end,
    technicianId: input.technicianId,
    technicianName: input.technicianName,
    status: input.status,
    color: input.technicianColor ?? null,
    meta: {
      jobId: input.jobId,
      customerId: input.customerId,
      customerName: input.customerName
    }
  };
}

export function buildTimeOffCalendarEvent(input: {
  timeOffId: string;
  start: Date;
  end: Date;
  technicianId: string;
  technicianName: string;
  technicianColor?: string | null;
  reason?: string | null;
}): CalendarEvent {
  const title =
    input.reason && input.reason.trim().length > 0
      ? `Time Off - ${input.reason.trim()}`
      : "Time Off";

  return {
    id: `time_off:${input.timeOffId}`,
    type: "time_off",
    title,
    start: input.start,
    end: input.end,
    technicianId: input.technicianId,
    technicianName: input.technicianName,
    color: input.technicianColor ?? null,
    meta: {
      timeOffId: input.timeOffId,
      reason: input.reason ?? null
    }
  };
}

export function buildJobConflict(input: {
  id: string;
  title: string;
  start: Date;
  end: Date;
}): CalendarConflict {
  return {
    type: "job",
    id: input.id,
    title: input.title,
    start: input.start,
    end: input.end,
    message: "Overlaps with an existing scheduled job."
  };
}

export function buildTimeOffConflict(input: {
  id: string;
  reason?: string | null;
  start: Date;
  end: Date;
}): CalendarConflict {
  return {
    type: "time_off",
    id: input.id,
    title:
      input.reason && input.reason.trim().length > 0
        ? `Time Off - ${input.reason.trim()}`
        : "Time Off",
    start: input.start,
    end: input.end,
    message: "Overlaps with an existing time-off entry."
  };
}

