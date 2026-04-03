import type { EventContentArg } from "@fullcalendar/core";
import type { CalendarEventItem } from "@/types/calendar";
import { cn } from "@/lib/utils";

function getItem(arg: EventContentArg): CalendarEventItem | null {
  const raw = arg.event.extendedProps["calendarItem"];
  if (raw && typeof raw === "object") return raw as CalendarEventItem;
  return null;
}

function statusShort(status?: string) {
  if (!status) return "";
  return status.replace(/_/g, " ");
}

export function CalendarEventContent(arg: EventContentArg) {
  const item = getItem(arg);
  if (!item) {
    return <span className="fc-event-title px-0.5 text-xs font-medium">{arg.event.title}</span>;
  }

  if (item.type === "time_off") {
    const reason = typeof item.meta["reason"] === "string" ? item.meta["reason"] : null;
    return (
      <div className="fc-event-main px-1 py-0.5 text-left text-[11px] leading-tight">
        <div className="flex items-center gap-1">
          <span className="rounded px-1 font-semibold uppercase tracking-wide text-[9px] text-violet-100/95">
            Leave
          </span>
        </div>
        {reason?.trim() ? (
          <div className="mt-0.5 truncate font-medium text-violet-50/95">{reason.trim()}</div>
        ) : (
          <div className="mt-0.5 truncate text-[10px] text-violet-100/80">Time off</div>
        )}
        <div className="truncate text-[10px] text-violet-200/75">{item.technicianName}</div>
      </div>
    );
  }

  const customerName = typeof item.meta["customerName"] === "string" ? item.meta["customerName"] : null;
  const unassigned = !item.technicianId || item.technicianName === "Unassigned";

  return (
    <div className="fc-event-main px-1 py-0.5 text-left text-[11px] leading-tight">
      <div className={cn("truncate font-semibold text-foreground/95", arg.view.type === "dayGridMonth" && "text-[10px]")}>
        {item.title}
      </div>
      {customerName ? (
        <div className="truncate text-[10px] text-foreground/80">{customerName}</div>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-1 truncate text-[10px] text-muted-foreground">
        <span className={cn(unassigned && "font-medium text-amber-200/90")}>{item.technicianName}</span>
        {item.status ? (
          <>
            <span className="opacity-50">·</span>
            <span className="uppercase tracking-tight text-[9px] text-foreground/70">{statusShort(item.status)}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
