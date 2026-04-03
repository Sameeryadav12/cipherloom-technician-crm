import { Link } from "react-router-dom";
import { AlertTriangle, Briefcase, CalendarClock, UserX, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEventItem } from "@/types/calendar";

type CalendarDispatchSummaryProps = {
  events: CalendarEventItem[];
  unassignedJobsCount?: number;
  isLoading?: boolean;
};

function StatChip({
  icon: Icon,
  label,
  value,
  tone = "default",
  href,
  sub
}: {
  icon: typeof Briefcase;
  label: string;
  value: string | number;
  tone?: "default" | "amber" | "sky";
  href?: string;
  sub?: string;
}) {
  const inner = (
    <div
      className={cn(
        "flex min-w-[140px] flex-1 items-start gap-2 rounded-xl border px-3 py-2.5 shadow-sm transition-colors",
        tone === "amber" && "border-amber-500/35 bg-amber-950/20",
        tone === "sky" && "border-sky-500/30 bg-sky-950/15",
        tone === "default" && "border-border/80 bg-card/60"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          tone === "amber" && "text-amber-300",
          tone === "sky" && "text-sky-300",
          tone === "default" && "text-muted-foreground"
        )}
      />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums leading-tight">{value}</p>
        {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function CalendarDispatchSummary({
  events,
  unassignedJobsCount = 0,
  isLoading
}: CalendarDispatchSummaryProps) {
  const jobs = events.filter((e) => e.type === "job");
  const timeOff = events.filter((e) => e.type === "time_off");
  const techWithJobs = new Set(jobs.map((j) => j.technicianId)).size;
  const techOnLeave = new Set(timeOff.map((t) => t.technicianId)).size;

  if (isLoading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <StatChip
        icon={Briefcase}
        label="Jobs in view"
        value={jobs.length}
        sub="Scheduled work in range"
      />
      <StatChip
        icon={CalendarClock}
        label="Time off"
        value={timeOff.length}
        sub="Leave blocks"
      />
      <StatChip
        icon={Users}
        label="Techs with jobs"
        value={techWithJobs}
        tone="sky"
        sub="Unique assignees"
      />
      <StatChip
        icon={UserX}
        label="Unassigned (board)"
        value={unassignedJobsCount}
        tone={unassignedJobsCount > 0 ? "amber" : "default"}
        href="/jobs"
        sub={unassignedJobsCount > 0 ? "Open Jobs to assign" : "None in latest fetch"}
      />
      {techOnLeave > 0 ? (
        <div className="sm:col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2 rounded-lg border border-violet-500/25 bg-violet-950/15 px-3 py-2 text-xs text-violet-100/95">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-violet-300" />
            <span>
              <strong>{techOnLeave}</strong> technician{techOnLeave === 1 ? "" : "s"} have leave visible in this
              range — check coverage before promising customers.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
