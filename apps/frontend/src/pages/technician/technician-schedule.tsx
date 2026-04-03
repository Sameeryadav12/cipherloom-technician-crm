import { useMemo, useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useMyTechnicianJobs, useMyTechnicianTimeOff } from "@/services/technician/technician.hooks";

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function TechnicianSchedulePage() {
  const [mode, setMode] = useState<"today" | "week">("today");
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (mode === "week") end.setDate(end.getDate() + 7);

  const jobsQuery = useMyTechnicianJobs({ page: 1, limit: 200, start: toYmd(start), end: toYmd(end) });
  const timeOffQuery = useMyTechnicianTimeOff({ start: start.toISOString(), end: end.toISOString() });

  const blocks = useMemo(() => {
    const jobs = (jobsQuery.data?.items ?? []).map((j) => ({
      id: `job:${j.id}`,
      type: "job" as const,
      title: j.title,
      subtitle: j.customer?.name ?? "Customer",
      start: j.scheduledStart,
      end: j.scheduledEnd
    }));
    const timeOff = (timeOffQuery.data?.items ?? []).map((t) => ({
      id: `timeoff:${t.id}`,
      type: "timeoff" as const,
      title: "Time off",
      subtitle: t.reason ?? "Unavailable",
      start: t.start,
      end: t.end
    }));
    return [...jobs, ...timeOff].sort((a, b) => new Date(a.start ?? 0).getTime() - new Date(b.start ?? 0).getTime());
  }, [jobsQuery.data?.items, timeOffQuery.data?.items]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground">Your work blocks and availability in a simple timeline.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={`rounded-md border px-3 py-1.5 text-sm ${mode === "today" ? "bg-primary text-primary-foreground" : "bg-card/40"}`} onClick={() => setMode("today")}>Today</button>
          <button type="button" className={`rounded-md border px-3 py-1.5 text-sm ${mode === "week" ? "bg-primary text-primary-foreground" : "bg-card/40"}`} onClick={() => setMode("week")}>Week</button>
        </div>
      </header>
      <Card>
        <CardTitle className="text-base">{mode === "today" ? "Today timeline" : "Week timeline"}</CardTitle>
        <CardDescription className="mt-2">Sorted by start time with jobs and time-off blocks.</CardDescription>
        <div className="mt-3 space-y-2">
          {blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedule blocks in this range.</p>
          ) : (
            blocks.map((block) => (
              <div key={block.id} className={`rounded-lg border p-3 ${block.type === "timeoff" ? "border-violet-500/30 bg-violet-950/15" : "border-border/70 bg-card/40"}`}>
                <p className="text-sm font-medium">{block.title}</p>
                <p className="text-xs text-muted-foreground">{block.subtitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(block.start)} → {formatDateTime(block.end)}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
