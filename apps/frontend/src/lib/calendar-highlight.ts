/** Dispatched after scheduling apply so Calendar can pulse + scroll to the job. */
export const CALENDAR_HIGHLIGHT_JOB_EVENT = "cipherloom:calendar-highlight-job";

export type CalendarHighlightJobDetail = {
  jobId: string;
  scheduledStart: string;
};

export function emitCalendarHighlightJob(detail: CalendarHighlightJobDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CALENDAR_HIGHLIGHT_JOB_EVENT, { detail }));
}
