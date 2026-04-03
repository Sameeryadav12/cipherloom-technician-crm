import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import { AlertTriangle } from "lucide-react";
import { CalendarDispatchSummary } from "@/components/calendar/calendar-dispatch-summary";
import { RescheduleJobDialog } from "@/components/dispatch/reschedule-job-dialog";
import { CalendarEmptyState } from "@/components/calendar/calendar-empty-state";
import { CalendarEventContent } from "@/components/calendar/calendar-event-content";
import { CalendarEventDetailSheet } from "@/components/calendar/calendar-event-detail-sheet";
import type { CalendarFiltersValue } from "@/components/calendar/calendar-filters";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { mapCalendarItemsToEvents, formatCalendarRangeLabel } from "@/components/calendar/calendar-utils";
import { ConflictCheckDialog } from "@/components/calendar/conflict-check-dialog";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import {
  CALENDAR_HIGHLIGHT_JOB_EVENT,
  type CalendarHighlightJobDetail
} from "@/lib/calendar-highlight";
import {
  useCalendarEvents,
  useCheckCalendarConflicts
} from "@/services/calendar/calendar.hooks";
import { useJobsList } from "@/services/jobs/jobs.hooks";
import { useTechniciansList } from "@/services/technicians/technicians.hooks";
import type { CalendarEventItem, CalendarQueryParams, ConflictCheckResponse } from "@/types/calendar";
import type { RescheduleJobContext } from "@/types/dispatch";

const defaultFilters: CalendarFiltersValue = {
  technicianId: "",
  includeJobs: true,
  includeTimeOff: true
};

function getCalendarItemFromClick(arg: EventClickArg): CalendarEventItem | null {
  const raw = arg.event.extendedProps["calendarItem"];
  if (raw && typeof raw === "object") return raw as CalendarEventItem;
  return null;
}

export function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isTechnicianUser = user?.role === "TECHNICIAN";
  const calendarRef = useRef<FullCalendar>(null);

  const techniciansQuery = useTechniciansList({ page: 1, limit: 200, isActive: true });
  const jobsBoardQuery = useJobsList({ page: 1, limit: 100 });

  const scopeTechnicians = useMemo(() => {
    const items = techniciansQuery.data?.items ?? [];
    if (!isTechnicianUser || !user?.id) return items;
    return items.filter((t) => t.linkedUser?.id === user.id);
  }, [techniciansQuery.data?.items, isTechnicianUser, user?.id]);

  const unassignedJobsCount = useMemo(
    () => (jobsBoardQuery.data?.items ?? []).filter((j) => !j.technicianId).length,
    [jobsBoardQuery.data?.items]
  );

  const [filters, setFilters] = useState<CalendarFiltersValue>(defaultFilters);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);

  const [detailItem, setDetailItem] = useState<CalendarEventItem | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictResult, setConflictResult] = useState<ConflictCheckResponse | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [rescheduleContext, setRescheduleContext] = useState<RescheduleJobContext | null>(null);

  const calendarQueryParams = useMemo((): CalendarQueryParams => {
    const technicianId =
      isTechnicianUser && scopeTechnicians[0]
        ? scopeTechnicians[0].id
        : filters.technicianId || undefined;
    return {
      start: range?.start ?? "",
      end: range?.end ?? "",
      technicianId,
      includeJobs: filters.includeJobs,
      includeTimeOff: filters.includeTimeOff
    };
  }, [range, filters, isTechnicianUser, scopeTechnicians]);

  const calendarQueryEnabled = Boolean(
    range &&
      calendarQueryParams.start &&
      calendarQueryParams.end &&
      (calendarQueryParams.includeJobs || calendarQueryParams.includeTimeOff)
  );

  const eventsQuery = useCalendarEvents(calendarQueryParams, calendarQueryEnabled);

  const checkMutation = useCheckCalendarConflicts();

  const [pulseJobId, setPulseJobId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<CalendarHighlightJobDetail>).detail;
      if (!d?.jobId) return;
      setPulseJobId(d.jobId);
      queueMicrotask(() => {
        const api = calendarRef.current?.getApi();
        if (api && d.scheduledStart) {
          try {
            api.gotoDate(new Date(d.scheduledStart));
          } catch {
            /* invalid date */
          }
        }
      });
    };
    window.addEventListener(CALENDAR_HIGHLIGHT_JOB_EVENT, handler);
    return () => window.removeEventListener(CALENDAR_HIGHLIGHT_JOB_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!pulseJobId) return;
    const t = window.setTimeout(() => setPulseJobId(null), 12_000);
    return () => window.clearTimeout(t);
  }, [pulseJobId]);

  const fcEvents = useMemo(
    () => mapCalendarItemsToEvents(eventsQuery.data?.events ?? [], pulseJobId),
    [eventsQuery.data?.events, pulseJobId]
  );

  const rangeLabel = range ? formatCalendarRangeLabel(range.start, range.end) : "";

  const eventsInView = eventsQuery.data?.events ?? [];
  const jobsTodayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return eventsInView.filter((e) => {
      if (e.type !== "job") return false;
      const s = new Date(e.start).getTime();
      return s >= today.getTime() && s <= end.getTime();
    }).length;
  }, [eventsInView]);

  const onDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({
      start: arg.start.toISOString(),
      end: arg.end.toISOString()
    });
  }, []);

  const onEventClick = useCallback((arg: EventClickArg) => {
    const item = getCalendarItemFromClick(arg);
    if (item) setDetailItem(item);
  }, []);

  const jumpToToday = useCallback(() => {
    calendarRef.current?.getApi().today();
  }, []);

  const openConflict = useCallback(() => {
    setConflictError(null);
    setConflictResult(null);
    setConflictOpen(true);
  }, []);

  const onConflictSubmit = useCallback(
    async (payload: {
      technicianId: string;
      start: string;
      end: string;
      ignoreJobId?: string;
      ignoreTimeOffId?: string;
    }) => {
      setConflictError(null);
      try {
        const envelope = await checkMutation.mutateAsync(payload);
        setConflictResult(envelope.data);
      } catch (error) {
        setConflictResult(null);
        const message = error instanceof ApiError ? error.message : "Conflict check failed.";
        setConflictError(message);
        toast({ title: "Conflict check failed", description: message, variant: "destructive" });
      }
    },
    [checkMutation, toast]
  );

  const showFilterWarning = !filters.includeJobs && !filters.includeTimeOff;
  const showEmptyNoEvents =
    calendarQueryEnabled &&
    !eventsQuery.isLoading &&
    !eventsQuery.isError &&
    fcEvents.length === 0;

  const needsAttention =
    unassignedJobsCount > 0 || (calendarQueryEnabled && jobsTodayCount > 8);

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Dispatch board
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Calendar</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Live lane for jobs and technician leave — spot conflicts before they hit the field.
          </p>
        </div>
      </header>

      <CalendarToolbar rangeLabel={rangeLabel} onCheckConflicts={openConflict} onToday={jumpToToday} />

      {needsAttention ? (
        <div className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-950/15 px-4 py-3 text-sm text-amber-50/95">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-amber-100">Needs attention</p>
            <ul className="list-inside list-disc text-xs text-amber-100/85">
              {unassignedJobsCount > 0 ? (
                <li>
                  <Link to="/jobs" className="font-medium underline-offset-2 hover:underline">
                    {unassignedJobsCount} unassigned job{unassignedJobsCount === 1 ? "" : "s"}
                  </Link>{" "}
                  in the latest jobs fetch — assign before the day slips.
                </li>
              ) : null}
              {calendarQueryEnabled && jobsTodayCount > 8 ? (
                <li>Heavy job load today ({jobsTodayCount} in view) — confirm technician coverage and break times.</li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}

      <CalendarDispatchSummary
        events={eventsInView}
        unassignedJobsCount={unassignedJobsCount}
        isLoading={calendarQueryEnabled && eventsQuery.isLoading}
      />

      <div className="space-y-3">
        <CalendarFilters
          value={filters}
          technicians={techniciansQuery.data?.items ?? []}
          isTechnicianUser={isTechnicianUser}
          onChange={setFilters}
        />
        <CalendarLegend />
      </div>

      {showFilterWarning ? <CalendarEmptyState reason="no-filters" /> : null}

      {eventsQuery.isError ? (
        <Card>
          <CardTitle>Could not load calendar</CardTitle>
          <CardDescription className="mt-2">
            Check your connection and permissions, then change the range or filters.
          </CardDescription>
        </Card>
      ) : null}

      {showEmptyNoEvents ? <CalendarEmptyState reason="no-events" /> : null}

      <div className="relative min-h-[560px] flex-1 rounded-xl border border-border/80 bg-card/40 p-2 shadow-inner md:min-h-[640px]">
        {calendarQueryEnabled && eventsQuery.isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-[1px]">
            <p className="text-sm text-muted-foreground">Loading events…</p>
          </div>
        ) : null}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          }}
          editable={false}
          selectable={false}
          dayMaxEvents={4}
          height="auto"
          nowIndicator
          businessHours={{ daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "18:00" }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          events={calendarQueryEnabled ? fcEvents : []}
          datesSet={onDatesSet}
          eventClick={onEventClick}
          eventContent={(arg) => <CalendarEventContent {...arg} />}
        />
      </div>

      <CalendarEventDetailSheet
        open={Boolean(detailItem)}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onRescheduleJob={(context) => setRescheduleContext(context)}
      />

      <RescheduleJobDialog
        open={Boolean(rescheduleContext)}
        context={rescheduleContext}
        onClose={() => setRescheduleContext(null)}
      />

      <ConflictCheckDialog
        open={conflictOpen}
        technicians={isTechnicianUser ? scopeTechnicians : techniciansQuery.data?.items ?? []}
        isTechnicianUser={isTechnicianUser}
        isSubmitting={checkMutation.isPending}
        submitError={conflictError}
        result={conflictResult}
        onClose={() => {
          setConflictOpen(false);
          setConflictResult(null);
          setConflictError(null);
        }}
        onSubmit={onConflictSubmit}
      />
    </div>
  );
}
