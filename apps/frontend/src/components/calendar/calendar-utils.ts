import type { EventInput } from "@fullcalendar/core";
import type { CalendarEventItem } from "@/types/calendar";

const JOB_STATUS_STYLE: Record<string, { border: string; soft: string }> = {
  NEW: { border: "#64748b", soft: "rgba(100,116,139,0.35)" },
  SCHEDULED: { border: "#3b82f6", soft: "rgba(59,130,246,0.28)" },
  IN_PROGRESS: { border: "#f59e0b", soft: "rgba(245,158,11,0.28)" },
  COMPLETED: { border: "#10b981", soft: "rgba(16,185,129,0.28)" },
  INVOICED: { border: "#8b5cf6", soft: "rgba(139,92,246,0.28)" },
  CANCELLED: { border: "#f43f5e", soft: "rgba(244,63,94,0.22)" }
};

function jobColors(status: string | undefined, technicianColor: string | null | undefined) {
  const byStatus = status ? JOB_STATUS_STYLE[status] : undefined;
  const border = technicianColor && /^#[0-9A-Fa-f]{6}$/.test(technicianColor)
    ? technicianColor
    : byStatus?.border ?? "#475569";
  const soft = byStatus?.soft ?? "rgba(71,85,105,0.35)";
  return { border, soft };
}

export function mapCalendarItemsToEvents(
  items: CalendarEventItem[],
  highlightJobId?: string | null
): EventInput[] {
  return items.map((item) => {
    if (item.type === "time_off") {
      const border = item.color && /^#[0-9A-Fa-f]{6}$/.test(item.color) ? item.color : "#a855f7";
      return {
        id: item.id,
        title: item.title,
        start: item.start,
        end: item.end,
        backgroundColor: "rgba(168,85,247,0.18)",
        borderColor: border,
        textColor: "#e9d5ff",
        classNames: ["calendar-event-time-off", "calendar-event-leave"],
        extendedProps: { calendarItem: item }
      };
    }

    const { border, soft } = jobColors(item.status, item.color);
    const jobId = typeof item.meta["jobId"] === "string" ? item.meta["jobId"] : null;
    const pulse = highlightJobId && jobId === highlightJobId;
    return {
      id: item.id,
      title: item.title,
      start: item.start,
      end: item.end,
      backgroundColor: soft,
      borderColor: border,
      textColor: "#f1f5f9",
      classNames: [
        "calendar-event-job",
        "calendar-event-work",
        ...(pulse ? (["calendar-event-applied-highlight"] as const) : [])
      ],
      extendedProps: { calendarItem: item }
    };
  });
}

export function formatCalendarRangeLabel(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  return `${s.toLocaleDateString()} – ${e.toLocaleDateString()}`;
}
