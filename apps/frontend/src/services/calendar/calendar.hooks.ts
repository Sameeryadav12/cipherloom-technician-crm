import { useMutation, useQuery } from "@tanstack/react-query";
import { checkCalendarConflicts, getCalendarEvents } from "./calendar.api";
import type { CalendarQueryParams, ConflictCheckRequest } from "@/types/calendar";

export const calendarKeys = {
  all: ["calendar"] as const,
  events: (params: CalendarQueryParams) => ["calendar", "events", params] as const
};

export function useCalendarEvents(params: CalendarQueryParams, enabled: boolean) {
  return useQuery({
    queryKey: calendarKeys.events(params),
    queryFn: () => getCalendarEvents(params),
    select: (response) => response.data,
    enabled:
      enabled &&
      Boolean(params.start && params.end) &&
      (params.includeJobs || params.includeTimeOff)
  });
}

export function useCheckCalendarConflicts() {
  return useMutation({
    mutationFn: (payload: ConflictCheckRequest) => checkCalendarConflicts(payload)
  });
}
